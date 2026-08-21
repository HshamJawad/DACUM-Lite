/* ══════════════════════════════════════════════════════════════
   self-check.js — DACUM Lite
   ──────────────────────────────────────────────────────────────
   فحص ذاتي عند الإقلاع.

   ما مشكلته التي يحلّها؟
   الأعطال التي أرهقت هذا المشروع لم تكن أخطاء برمجية. كانت
   وصلات مقطوعة بين ملفّين:

     • arabic-font.js موجود بمحرّكه كاملاً — و events.js لا
       يستورده. تصدير PDF عربي معطوب لأربعة إصدارات.
     • fonts/Cairo.woff2 مخزَّن في sw.js منذ 3.2.1 — ولا قاعدة
       ‎@font-face واحدة تشير إليه. الخط يُحمَّل ولا يُعرض.
     • help.versionFooter: مفتاح بلا عنصر، ثم عنصر بلا مفتاح.
     • قاعدة CSS تتغلّب على أخرى بصمت لفارق وزن انتقائي.
     • sb-sidebar-closed تتسرّب إلى وضع الدرج فيعلق الشريط.

   لا واحدة منها تُنتج استثناءً. لهذا نجت من إصدارات متتابعة
   دون أن يلاحظها أحد، ولهذا احتاج كشفها مراجعة يدوية.

   هذا الملف يفحص هذه الوصلات بالذات عند كل إقلاع. صامت تماماً
   حين يكون كل شيء سليماً؛ يرفع بطاقة خطأ عبر error-reporter.js
   فور انقطاع أي وصلة — فتكتشف الفقدان في أول تشغيل بعد الدمج،
   لا بعد أربعة إصدارات.

   لماذا فحوص محدّدة لا فحص عام؟
   لأن كل فحص هنا يوثّق عطلاً وقع فعلاً. لا تُضف فحصاً لأنه
   "قد يفيد" — أضفه حين ينكسر شيء، مع تعليق يشرح ما انكسر.

   ── التركيب ────────────────────────────────────────────────
   في index.html، بعد سطر تحميل app.js مباشرةً:

       <script type="module">
           import { runSelfCheck } from './self-check.js';
           window.addEventListener('load', () => runSelfCheck());
       </script>

   وفي sw.js أضف './self-check.js' إلى SHELL_ASSETS.

   ── الاستخدام اليدوي ───────────────────────────────────────
       DacumSelfCheck.run()      إعادة الفحص وطباعة جدول
       DacumSelfCheck.report()   نصّ جاهز للنسخ والإرسال
       index.html?selfcheck      يطبع الجدول دائماً حتى لو نجح
   ══════════════════════════════════════════════════════════════ */

import { APP_VERSION, APP_RELEASED } from './version.js';

/* الحدّة: 'fail' يعني ميزة معطّلة الآن. 'warn' يعني شيئاً مريباً
   لا يمنع الاستخدام. الفشل وحده يرفع بطاقة خطأ. */
const FAIL = 'fail';
const WARN = 'warn';

let _results = [];

const ok   = (id, msg)      => ({ id, level: 'ok',  msg });
const bad  = (id, msg, lvl) => ({ id, level: lvl || FAIL, msg });

/* لا يرمي هذا الملف استثناءً أبداً: فحصٌ يُسقط التطبيق أسوأ من
   العطل الذي يبحث عنه. */
const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };


/* ══════════════════════════════════════════════════════════════
   ١ — طبقة التشكيل العربي
   ══════════════════════════════════════════════════════════════
   العطل الأصلي: events.js فقد استيراد arabicVisual أثناء دمج
   يدوي، وأُعيد معه setR2L(true). النتيجة حروف مفكّكة ومعكوسة.

   لا يمكن فحص استيرادات وحدة أخرى من هنا مباشرةً، فنفحص العَرَض
   بدلاً من السبب: هل تنتج arabicVisual فعلاً نصاً بصرياً مختلفاً
   عن مدخله؟ إن ساوى المخرجُ المدخلَ فالمحرّك غير مفعّل. */
async function checkArabicShaping() {
    try {
        const mod = await import('./arabic-font.js');

        if (typeof mod.arabicVisual !== 'function') {
            return bad('arabic.engine',
                'arabic-font.js لا يُصدّر arabicVisual — تصدير PDF العربي سينتج حروفاً مفكّكة');
        }

        // "مهمة" — كلمة متّصلة الحروف. الخرج البصري يجب أن يختلف
        // عن المدخل المنطقي في المحارف وفي الترتيب معاً.
        const input  = 'مهمة';
        const output = mod.arabicVisual(input);

        if (typeof output !== 'string' || output === input) {
            return bad('arabic.engine',
                'arabicVisual تُرجع مدخلها دون تشكيل — المحرّك غير مفعّل');
        }
        return ok('arabic.engine', 'محرّك التشكيل العربي يعمل');
    } catch (e) {
        return bad('arabic.engine', 'تعذّر تحميل arabic-font.js: ' + e.message);
    }
}


/* ══════════════════════════════════════════════════════════════
   ٢ — خط الواجهة العربية
   ══════════════════════════════════════════════════════════════
   العطل الأصلي: sw.js يخزّن fonts/Cairo.woff2 ولا @font-face
   يشير إليه. الخط يُنزَّل ويُخزَّن ولا يُعرض أبداً.

   document.fonts.check يعطي الجواب الحاسم دون أدوات مطوّر. */
function checkCairoFont() {
    if (!document.fonts || typeof document.fonts.check !== 'function') {
        return ok('font.cairo', 'واجهة الخطوط غير مدعومة — تخطّي');
    }
    // يُفحص فقط حين تكون الواجهة عربية؛ في الإنجليزية لا يُحمَّل
    // الخط أصلاً بفضل unicode-range، وهذا سلوك مقصود لا عطل.
    if (document.documentElement.getAttribute('dir') !== 'rtl') {
        return ok('font.cairo', 'الواجهة غير عربية — تخطّي');
    }
    if (document.fonts.check('16px Cairo')) return ok('font.cairo', 'خط Cairo محمَّل');

    // الخط قد يكون قيد التحميل وقت الفحص. الحكم بالفشل هنا يُنتج
    // بطاقة كاذبة عند كل إقلاع بطيء، وهو ما يُفقد البطاقات قيمتها.
    return document.fonts.ready
        .then(() => document.fonts.check('16px Cairo')
            ? ok('font.cairo', 'خط Cairo محمَّل')
            : bad('font.cairo',
                  'Cairo غير محمَّل — تحقّق من ./fonts/Cairo.woff2 ومن @font-face في arabic-ui.css'))
        .catch(() => ok('font.cairo', 'تعذّر التحقّق — تخطّي'));
}


/* ══════════════════════════════════════════════════════════════
   ٣ — الخط داخل حقول الإدخال
   ══════════════════════════════════════════════════════════════
   العطل الأصلي: قاعدة في <style> داخل index.html تعادلت في الوزن
   الانتقائي مع قاعدة Cairo وفازت لأنها متأخّرة. فظهر الخط في
   العناوين وغاب عن مربّعات النص — عطل صامت لا يكشفه إلا النظر.

   نقيس ما يراه المستخدم فعلاً: الخط المحسوب على textarea حقيقي. */
function checkInputFont() {
    if (document.documentElement.getAttribute('dir') !== 'rtl') {
        return ok('font.inputs', 'الواجهة غير عربية — تخطّي');
    }
    const el = document.querySelector('textarea, input[type="text"]');
    if (!el) return ok('font.inputs', 'لا حقول في الصفحة — تخطّي');

    const family = safe(() => getComputedStyle(el).fontFamily, '');
    // إن لم يجهز Cairo بعد فالحقول تعرض الاحتياطي مؤقّتاً — ليس عطلاً
    if (!safe(() => document.fonts?.check('16px Cairo'), true)) {
        return ok('font.inputs', 'Cairo قيد التحميل — تخطّي');
    }
    return /cairo/i.test(family)
        ? ok('font.inputs', 'حقول الإدخال تستخدم Cairo')
        : bad('font.inputs',
              `حقول الإدخال تستخدم "${family}" بدل Cairo — قاعدة أخرى تتغلّب على arabic-ui.css`);
}


/* ══════════════════════════════════════════════════════════════
   ٤ — وضع الشريط الجانبي
   ══════════════════════════════════════════════════════════════
   فحصان: أن CSS يعلن --sb-mode أصلاً، وأن الحالة المستحيلة
   منطقياً لم تقع. اجتماع فئة سطح المكتب مع وضع الدرج هو بالضبط
   ما ترك اللوح عالقاً في منتصف الشاشة على أندرويد بالعربية. */
function checkSidebarMode() {
    const mode = safe(() => getComputedStyle(document.documentElement)
                              .getPropertyValue('--sb-mode').trim(), '');
    if (!mode) {
        return bad('sidebar.mode',
            '--sb-mode غير معرَّف — كتلة نقطة الفصل مفقودة من index.html، وapp.js سيرتدّ إلى innerWidth');
    }
    if (mode !== 'drawer' && mode !== 'desktop') {
        return bad('sidebar.mode', `--sb-mode بقيمة غير متوقّعة: "${mode}"`, WARN);
    }
    return ok('sidebar.mode', `وضع العرض: ${mode}`);
}

function checkSidebarClasses() {
    const drawer = safe(() => getComputedStyle(document.documentElement)
                                .getPropertyValue('--sb-mode').trim(), '') === 'drawer';
    const closed = document.body.classList.contains('sb-sidebar-closed');

    // الحالة المستحيلة: فئة سطح المكتب حاضرة في وضع الدرج.
    if (drawer && closed) {
        return bad('sidebar.classes',
            'sb-sidebar-closed موجودة في وضع الدرج — الشريط عالق. نادِ pmResetSidebar()');
    }
    return ok('sidebar.classes', 'فئات الشريط متّسقة');
}


/* ══════════════════════════════════════════════════════════════
   ٥ — العناصر التي يبحث عنها الكود بالمعرّف
   ══════════════════════════════════════════════════════════════
   العطل الأصلي: update-notifier.js يبحث عن #helpVersionFooter
   والعنصر غير موجود. الحارس if (footer) منع الانهيار، فصمتت
   الميزة تماماً. حارس نافع يخفي عطلاً — وهذا ما يجعله خطراً. */
const REQUIRED_IDS = [
    ['sidebar',           'الشريط الجانبي'],
    ['sidebarOverlay',    'طبقة إغلاق الدرج'],
    ['appWrapper',        'حاوية المحتوى'],
    ['helpVersionFooter', 'سطر الإصدار في تبويب المساعدة'],
    ['copyrightMain',     'سطر حقوق النشر']
];

function checkRequiredElements() {
    const missing = REQUIRED_IDS
        .filter(([id]) => !document.getElementById(id))
        .map(([id, label]) => `#${id} (${label})`);

    return missing.length
        ? bad('dom.elements', 'عناصر مفقودة: ' + missing.join('، '))
        : ok('dom.elements', `${REQUIRED_IDS.length} عناصر حرجة موجودة`);
}


/* ══════════════════════════════════════════════════════════════
   ٦ — مفاتيح الترجمة
   ══════════════════════════════════════════════════════════════
   العطل الأصلي: help.versionFooter مفقود من اللغات الثلاث، فكان
   سيظهر اسم المفتاح حرفياً للمستخدم لو وُجد العنصر.

   نفحص المفاتيح التي يستدعيها الكود في مسارات حرجة فقط — لا كل
   المفاتيح، فذلك عمل أداة بناء لا فحص وقت تشغيل. */
const CRITICAL_KEYS = [
    'help.versionFooter',
    'status.storageFull',
    'status.storageError',
    'status.imageUploaded',
    'status.imageBadType'
];

async function checkTranslations() {
    try {
        const { translations } = await import('./translations.js');
        const langs   = ['en', 'fr', 'ar'];
        const missing = [];

        for (const lang of langs) {
            const dict = translations?.[lang];
            if (!dict) { missing.push(`اللغة ${lang} غائبة كلياً`); continue; }
            for (const key of CRITICAL_KEYS) {
                if (!(key in dict)) missing.push(`${lang}:${key}`);
            }
        }
        // أثناء تحديث لم يكتمل يكون translations.js في الكاش أقدم من
        // بقية الملفات، فتبدو المفاتيح الجديدة مفقودة. هذه حالة
        // عابرة تُحلّ بإعادة التحميل، لا وصلة مقطوعة.
        const stale = safe(() => !!sessionStorage.getItem('dacum_update_reload'), false);
        return missing.length
            ? bad('i18n.keys',
                  'مفاتيح مفقودة: ' + missing.join('، ') +
                  (stale ? ' — تحديث لم يكتمل، أعد التحميل' : ''),
                  stale ? WARN : FAIL)
            : ok('i18n.keys', `${CRITICAL_KEYS.length} مفاتيح حرجة × 3 لغات`);
    } catch (e) {
        return bad('i18n.keys', 'تعذّر تحميل translations.js: ' + e.message);
    }
}


/* ══════════════════════════════════════════════════════════════
   ٧ — قابلية الكتابة في التخزين
   ══════════════════════════════════════════════════════════════
   العطل الأصلي: persistProjects يبتلع QuotaExceededError صامتاً،
   فيواصل المستخدم العمل ويفقد الجلسة عند أول تحديث.

   نكتب مفتاحاً تجريبياً صغيراً ونحذفه فوراً. هذا لا يقيس المساحة
   المتبقّية، لكنه يكشف الحالتين الشائعتين: تخزين ممتلئ، أو
   متصفح يمنع الكتابة (وضع التصفّح الخاص في سفاري). */
function checkStorageWritable() {
    const probe = '__dacum_selfcheck__';
    try {
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
    } catch (e) {
        const quota = e && (e.name === 'QuotaExceededError' ||
                            e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                            e.code === 22);
        return bad('storage.write', quota
            ? 'التخزين ممتلئ — لن يُحفظ أي عمل. صدّر مشاريعك كملفات فوراً'
            : 'الكتابة في التخزين ممنوعة: ' + e.message);
    }

    // تحذير وقائي عند تجاوز 70% من سقف 5MB التقريبي
    const bytes = safe(() => (localStorage.getItem('dacum_projects_v1') || '').length, 0);
    const pct   = Math.round(bytes / (5 * 1024 * 1024) * 100);
    if (pct >= 70) {
        return bad('storage.write',
            `التخزين مستهلَك بنسبة ~${pct}% — احذف مشاريع أو شعارات قديمة قبل الامتلاء`, WARN);
    }
    return ok('storage.write', `التخزين قابل للكتابة (~${pct}% مستهلَك)`);
}


/* ══════════════════════════════════════════════════════════════
   ٨ — اتساق الإصدار مع الـ Service Worker
   ══════════════════════════════════════════════════════════════
   عطل متكرّر في هذا المشروع: تعديل ملف دون رفع APP_VERSION، فيبقى
   المتصفح يقدّم النسخة المخبّأة ولا يظهر أثر التعديل إطلاقاً —
   ثم يُظنّ أن الإصلاح لم ينجح فيُعاد كتابته. */
function checkServiceWorkerVersion() {
    return new Promise(resolve => {
        if (!navigator.serviceWorker?.controller) {
            return resolve(ok('sw.version', 'لا service worker نشط — تخطّي'));
        }
        // sw.js يردّ عبر event.source.postMessage — أي إلى العميل
        // نفسه، لا إلى منفذ MessageChannel. لذا نستمع على
        // navigator.serviceWorker مباشرةً. استخدام منفذ هنا كان
        // سينتهي بمهلة صامتة فيبدو الفحص ناجحاً وهو لم يجرِ أصلاً.
        const onMsg = ev => {
            if (ev.data?.type !== 'SW_VERSION') return;
            cleanup();
            const swv = ev.data.version;
            resolve(swv && swv !== APP_VERSION
                ? bad('sw.version',
                      `الصفحة v${APP_VERSION} والـ SW يقدّم v${swv} — حدّث الصفحة أو ارفع APP_VERSION`, WARN)
                : ok('sw.version', `الـ SW متّسق (v${swv || APP_VERSION})`));
        };
        const cleanup = () => {
            clearTimeout(timer);
            navigator.serviceWorker.removeEventListener('message', onMsg);
        };
        const timer = setTimeout(() => {
            cleanup();
            resolve(ok('sw.version', 'لم يردّ الـ SW في الوقت المحدّد — تخطّي'));
        }, 1500);

        navigator.serviceWorker.addEventListener('message', onMsg);
        safe(() => navigator.serviceWorker.controller
                      .postMessage({ type: 'GET_VERSION' }));
    });
}


/* ══════════════════════════════════════════════════════════════
   ٩ — شريط التحديث عالق
   ══════════════════════════════════════════════════════════════
   العطل الأصلي: canReload() كان يقارن البصمة بـ APP_VERSION، وهو
   إصدار الصفحة الحالية الذي يتغيّر بعد كل تحديث ناجح. فكان أثر
   الحارس معكوساً — يسمح بالحلقة ويقمع المحاولة المشروعة، فيبقى
   الزر معطّلاً على "جارٍ التحديث…" بلا مسار خروج.

   نفحص العَرَض: بصمة حارس قديمة باقية في sessionStorage تحمل
   الإصدار الحالي. وجودها بعد اكتمال الإقلاع يعني أن تحديثاً
   سابقاً لم يكتمل. */
function checkUpdateGuard() {
    const rec = safe(() => JSON.parse(sessionStorage.getItem('dacum_update_reload') || 'null'), null);
    if (!rec) return ok('update.guard', 'لا بصمة تحديث معلّقة');

    const age = Math.round((Date.now() - (rec.ts || 0)) / 1000);
    if (rec.version === APP_VERSION && (rec.count || 1) >= 3) {
        return bad('update.guard',
            `تحديث لم يكتمل (${rec.count} محاولات قبل ${age}ث). نفّذ: sessionStorage.removeItem('dacum_update_reload')`,
            WARN);   // مشكلة تحديث عابرة، لا وصلة مقطوعة في الكود
    }
    return ok('update.guard', `بصمة تحديث حديثة (${rec.count || 1} محاولة، ${age}ث)`);
}


/* ══════════════════════════════════════════════════════════════
   ١٠ — الصفحة المحمَّلة مقابل الخادم
   ══════════════════════════════════════════════════════════════
   العطل الأصلي: index.html كان يسجّل sw.js?v=${APP_VERSION} حيث
   APP_VERSION يأتي من version.js المخبّأ. فالصفحة القديمة تسجّل
   العامل القديم الذي يبني الكاش القديم — حلقة لا تنكسر إلا
   بـ Ctrl+Shift+R، وشريط التحديث يظهر ويفشل إلى ما لا نهاية.

   نقارن إصدار الصفحة بما يقدّمه الخادم فعلاً. */
async function checkVersionFreshness() {
    try {
        const res = await fetch('./version.js?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) return ok('version.fresh', 'تعذّر الوصول للخادم — تخطّي');

        const m = (await res.text()).match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
        const serverV = m && m[1];
        if (!serverV) return ok('version.fresh', 'تعذّرت قراءة إصدار الخادم — تخطّي');

        return serverV === APP_VERSION
            ? ok('version.fresh', `الصفحة متطابقة مع الخادم (v${serverV})`)
            : bad('version.fresh',
                  `الصفحة v${APP_VERSION} والخادم v${serverV} — الكاش قديم. اضغط Ctrl+Shift+R`, WARN);
    } catch {
        return ok('version.fresh', 'دون اتصال — تخطّي');
    }
}


/* ══════════════════════════════════════════════════════════════
   المُشغّل
   ══════════════════════════════════════════════════════════════ */

export async function runSelfCheck({ verbose = false } = {}) {
    const checks = await Promise.all([
        checkArabicShaping(),
        Promise.resolve(checkCairoFont()),
        Promise.resolve(checkInputFont()),
        Promise.resolve(checkSidebarMode()),
        Promise.resolve(checkSidebarClasses()),
        Promise.resolve(checkRequiredElements()),
        checkTranslations(),
        Promise.resolve(checkStorageWritable()),
        Promise.resolve(checkUpdateGuard()),
        checkServiceWorkerVersion(),
        checkVersionFreshness()
    ]);

    _results = checks;
    const failures = checks.filter(c => c.level === FAIL);
    const warnings = checks.filter(c => c.level === WARN);
    const force    = safe(() => /[?&]selfcheck\b/.test(location.search), false);

    if (failures.length || warnings.length || verbose || force) {
        const icon = { ok: '✅', warn: '⚠️', fail: '❌' };
        console.groupCollapsed(
            `%c[SelfCheck] v${APP_VERSION} — ${failures.length} فشل، ${warnings.length} تحذير`,
            failures.length ? 'color:#dc2626;font-weight:700'
                            : warnings.length ? 'color:#d97706;font-weight:700'
                                              : 'color:#059669;font-weight:700');
        checks.forEach(c => console.log(`${icon[c.level]} ${c.id.padEnd(18)} ${c.msg}`));
        console.groupEnd();
    }

    // يُسجَّل الفشل دائماً، ولا يُعرض أبداً. error-reporter.js صامت
    // في وضع المستخدم، فالاستدعاء هنا يكتب في السجلّ فقط —
    // ويصير مرئياً عند فتح ?debug أو DacumErrors.open().
    //
    // المستخدم لا يرى شيئاً: وصلة مقطوعة أمر يخصّ المطوّر، وفي
    // معظم الحالات تواصل الأداة عملها بشكل سليم. التنبيه الوحيد
    // الذي يستحق مقاطعته هو فقدان بياناته، وذلك يعرضه app.js
    // مباشرةً برسالة مفهومة لا برمز خطأ.
    if (failures.length && window.DacumErrors) {
        safe(() => window.DacumErrors.report(
            new Error(`SelfCheck: ${failures.length} وصلة مقطوعة`),
            { failures: failures.map(f => `${f.id}: ${f.msg}`) }
        ));
    }

    return { passed: !failures.length, failures, warnings, all: checks };
}

/** تقرير نصّي جاهز للنسخ والإرسال. */
export function report() {
    const icon = { ok: 'OK  ', warn: 'WARN', fail: 'FAIL' };
    return [
        `DACUM Lite SelfCheck — v${APP_VERSION} (${APP_RELEASED})`,
        new Date().toISOString().slice(0, 19).replace('T', ' '),
        navigator.userAgent,
        `${window.innerWidth}x${window.innerHeight} dir=${document.documentElement.getAttribute('dir')}`,
        '',
        ..._results.map(r => `[${icon[r.level]}] ${r.id} — ${r.msg}`)
    ].join('\n');
}

if (typeof window !== 'undefined') {
    window.DacumSelfCheck = { run: runSelfCheck, report, results: () => _results.slice() };
}

export default { runSelfCheck, report };
