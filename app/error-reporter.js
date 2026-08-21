/* ══════════════════════════════════════════════════════════════
   error-reporter.js — DACUM Lite
   ──────────────────────────────────────────────────────────────
   وحدة التقاط الأخطاء وعرضها بشكل قابل للتصوير.

   لماذا؟ على الموبايل لا توجد وحدة تحكم (console) يمكن فتحها،
   فأي خطأ صامت يظهر للمستخدم كسلوك غريب فقط — تماماً كما حدث
   مع الشريط الجانبي العالق. هذه الوحدة تحوّل كل خطأ صامت إلى
   بطاقة تحمل رمزاً قصيراً (ERR-XXXX) يمكن للمستخدم تصويرها
   وإرسالها، فتصل إليك حالة الجهاز الكاملة في صورة واحدة.

   ما تلتقطه:
     • window 'error'              — أخطاء JS + فشل تحميل الموارد
     • window 'unhandledrejection' — وعود مرفوضة بلا catch
     • console.error(...)          — أخطاء يسجّلها الكود يدوياً
     • DacumErrors.report(e, ctx)  — إبلاغ يدوي من أي مكان

   الواجهة العامة (window.DacumErrors):
     .report(err, context)  تسجيل خطأ يدوياً
     .open()                فتح لوحة السجل
     .close()               إغلاقها
     .clear()               مسح السجل
     .log()                 إرجاع مصفوفة الأخطاء المخزّنة
     .breadcrumb(text)      تسجيل خطوة مستخدم (يظهر آخر ٦ خطوات)
     .test()                توليد خطأ تجريبي للتأكد من عمل الوحدة

   لا تعتمد على أي مكتبة خارجية، ولا ترمي استثناءً بنفسها أبداً.
   ══════════════════════════════════════════════════════════════ */

import { APP_VERSION } from './version.js';

const STORE_KEY = 'dacum_error_log';
const MAX_KEPT  = 30;     // آخر ٣٠ خطأ فقط
const MAX_STACK = 1200;   // اقتطاع الـ stack حتى لا يتضخم التخزين

/* ══════════════════════════════════════════════════════════════
   وضعان: صامت للمستخدم، ظاهر للمطوّر
   ──────────────────────────────────────────────────────────────
   النسخة الأولى كانت تعرض فقاعة وجرساً لكل خطأ. هذا صحيح لمطوّر
   يبحث عن الأعطال عمداً، وخاطئ تماماً لمدرّب في ورشة: يرى رمزاً
   مثل ERR-A0BA لا يفهمه، فيظنّ أن عمله ضاع ويتوقّف — والأداة في
   الغالب تعمل بشكل سليم تماماً.

   السلوك الآن: كل خطأ يُسجَّل في الخلفية بلا أي أثر مرئي. لا
   فقاعة، لا جرس، لا شيء. المستخدم لا يعلم بوجود النظام أصلاً.

   يُفعَّل العرض في حالتين فقط:
     • ?debug في الرابط
     • DacumErrors.open() من الطرفية

   والاستثناء الوحيد الذي يقاطع المستخدم هو فقدان البيانات —
   وهو ليس من مسؤولية هذا الملف: app.js يعرض تنبيه امتلاء
   التخزين مباشرةً، برسالة مفهومة لا برمز خطأ. */
const DEV_MODE = (() => {
    try { return /[?&]debug\b/.test(location.search); } catch { return false; }
})();

let _errors      = [];
let _crumbs      = [];
let _panelOpen   = false;
let _installed   = false;
let _inConsole   = false;   // حارس ضد التكرار اللانهائي
let _seen        = new Set(); // بصمات لمنع تكرار نفس الخطأ

/* ── أدوات مساعدة آمنة ──────────────────────────────────────── */

const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };

const isRTL = () => safe(() => document.documentElement.getAttribute('dir') === 'rtl', false);

function shortCode(str) {
    // FNV-1a مبسّط → رمز من ٤ خانات يسهل نطقه وقراءته من صورة
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return 'ERR-' + h.toString(16).toUpperCase().slice(0, 4).padStart(4, '0');
}

function nowStamp() {
    return safe(() => new Date().toISOString().replace('T', ' ').slice(0, 19), '');
}

/* ── سياق الجهاز — هذا ما يوفّر عليك ٢٠ سؤالاً للمستخدم ─────── */

function deviceContext() {
    return safe(() => ({
        version : APP_VERSION,
        ua      : navigator.userAgent,
        screen  : `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio || 1}x`,
        mode    : window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop',
        orient  : window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        dir     : document.documentElement.getAttribute('dir') || 'ltr',
        lang    : document.documentElement.getAttribute('lang') || '—',
        pwa     : window.matchMedia('(display-mode: standalone)').matches ? 'yes' : 'no',
        online  : navigator.onLine ? 'yes' : 'no',
        // حالة الشريط الجانبي — مباشرةً ذات صلة بالعلّة التي عالجناها
        sb      : [
            document.body.classList.contains('sb-sidebar-closed') ? 'closed' : '',
            document.getElementById('sidebar')?.classList.contains('sb-mobile-open') ? 'mobile-open' : ''
        ].filter(Boolean).join('+') || 'default'
    }), {});
}

/* ── التخزين ────────────────────────────────────────────────── */

function load() {
    _errors = safe(() => JSON.parse(localStorage.getItem(STORE_KEY) || '[]'), []);
    if (!Array.isArray(_errors)) _errors = [];
}

function persist() {
    safe(() => localStorage.setItem(STORE_KEY, JSON.stringify(_errors.slice(-MAX_KEPT))));
}

/* ── التسجيل الأساسي ────────────────────────────────────────── */

function record(kind, message, detail) {
    const msg   = String(message || 'Unknown error').slice(0, 400);
    const stack = String(detail?.stack || '').slice(0, MAX_STACK);
    const where = detail?.source
        ? `${String(detail.source).split('/').pop()}:${detail.line || '?'}:${detail.col || '?'}`
        : '—';

    const code = shortCode(kind + msg + where);

    // لا تُغرق السجل بنفس الخطأ المتكرر (مثلاً داخل حلقة رسم)
    const fp = code + '|' + where;
    if (_seen.has(fp)) {
        const prev = _errors.find(e => e.code === code && e.where === where);
        if (prev) { prev.count = (prev.count || 1) + 1; prev.time = nowStamp(); persist(); if (DEV_MODE) refreshBadge(); }
        return code;
    }
    _seen.add(fp);

    const entry = {
        code, kind, msg, where, stack,
        time    : nowStamp(),
        count   : 1,
        crumbs  : _crumbs.slice(-6),
        ctx     : deviceContext(),
        context : detail?.context || null
    };

    _errors.push(entry);
    if (_errors.length > MAX_KEPT) _errors = _errors.slice(-MAX_KEPT);
    persist();

    // صمت تامّ للمستخدم. التسجيل يجري، والعرض لا.
    if (DEV_MODE) { refreshBadge(); showToast(entry); }
    return code;
}

/* ── واجهة المستخدم: الجرس + الفقاعة + اللوحة ───────────────── */

function injectStyles() {
    if (document.getElementById('dacumErrStyles')) return;
    const s = document.createElement('style');
    s.id = 'dacumErrStyles';
    s.textContent = `
#dacumErrBadge{
  position:fixed;bottom:14px;z-index:2147483000;
  width:44px;height:44px;border-radius:50%;border:none;
  background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;
  font-size:19px;font-weight:800;cursor:pointer;display:none;
  align-items:center;justify-content:center;
  box-shadow:0 4px 18px rgba(185,28,28,.5);
  font-family:system-ui,sans-serif;
}
#dacumErrBadge[data-side="left"]{left:14px}
#dacumErrBadge[data-side="right"]{right:14px}
#dacumErrBadge span{
  position:absolute;top:-4px;inset-inline-end:-4px;
  min-width:19px;height:19px;border-radius:10px;
  background:#0f172a;color:#fff;font-size:11px;font-weight:700;
  display:flex;align-items:center;justify-content:center;padding:0 4px;
}
#dacumErrToast{
  position:fixed;bottom:70px;inset-inline:14px;z-index:2147483000;
  background:#1f2937;color:#f8fafc;border:1px solid #ef4444;
  border-inline-start:5px solid #ef4444;border-radius:12px;
  padding:11px 13px;font-family:system-ui,'Segoe UI',Tahoma,sans-serif;
  font-size:13px;line-height:1.5;display:none;cursor:pointer;
  box-shadow:0 8px 30px rgba(0,0,0,.5);max-width:520px;margin-inline:auto;
}
#dacumErrToast b{color:#fca5a5;font-family:ui-monospace,'Courier New',monospace;letter-spacing:.04em}
#dacumErrToast small{display:block;opacity:.72;margin-top:3px;font-size:11.5px}

#dacumErrPanel{
  position:fixed;inset:0;z-index:2147483001;display:none;
  background:rgba(2,6,23,.93);backdrop-filter:blur(3px);
  font-family:system-ui,'Segoe UI',Tahoma,sans-serif;
  overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;
  box-sizing:border-box;
}
#dacumErrPanel .dep-head{
  display:flex;align-items:center;gap:8px;justify-content:space-between;
  color:#f1f5f9;font-weight:800;font-size:15px;margin-bottom:10px;
  position:sticky;top:-14px;background:rgba(2,6,23,.97);padding:12px 2px;
}
#dacumErrPanel .dep-btns{display:flex;gap:6px;flex-wrap:wrap}
#dacumErrPanel button{
  border:1px solid #334155;background:#1e293b;color:#e2e8f0;
  border-radius:8px;padding:7px 11px;font-size:12.5px;font-weight:600;cursor:pointer;
}
#dacumErrPanel button.prim{background:#4f46e5;border-color:#4f46e5;color:#fff}
#dacumErrPanel button.dgr{background:#7f1d1d;border-color:#991b1b;color:#fee2e2}
/* بطاقة الخطأ: مُحسّنة للتصوير — تباين عالٍ، خط أحادي المسافة، سطور قصيرة */
#dacumErrPanel .dep-card{
  background:#0b1220;border:1px solid #1e293b;border-radius:12px;
  padding:12px;margin-bottom:11px;color:#cbd5e1;
  font-family:ui-monospace,'Courier New',monospace;font-size:12px;line-height:1.65;
  white-space:pre-wrap;word-break:break-word;direction:ltr;text-align:left;
}
#dacumErrPanel .dep-card .c{color:#fca5a5;font-weight:800;font-size:14px;letter-spacing:.06em}
#dacumErrPanel .dep-card .m{color:#fde68a;display:block;margin:5px 0}
#dacumErrPanel .dep-card .k{color:#64748b}
#dacumErrPanel .dep-empty{color:#64748b;text-align:center;padding:40px 0;font-size:13.5px}
`;
    document.head.appendChild(s);
}

function refreshBadge() {
    const b = document.getElementById('dacumErrBadge');
    if (!b) return;
    b.style.display = _errors.length ? 'flex' : 'none';
    b.setAttribute('data-side', isRTL() ? 'left' : 'right');
    const n = b.querySelector('span');
    if (n) n.textContent = _errors.length > 99 ? '99+' : String(_errors.length);
}

let _toastTimer = null;
function showToast(entry) {
    const el = document.getElementById('dacumErrToast');
    if (!el) return;
    // إن حمل السياق قائمة أعطال، اعرض أوّلها: "1 وصلة مقطوعة"
    // وحدها لا تكفي لتشخيص شيء من لقطة شاشة.
    const first = safe(() => {
        const list = entry.context?.failures;
        return Array.isArray(list) && list.length ? String(list[0]) : '';
    }, '');

    el.innerHTML =
        `<b>${entry.code}</b> — ${escapeHtml((first || entry.msg).slice(0, 130))}` +
        `<small>${isRTL() ? 'اضغط لعرض التفاصيل وتصويرها' : 'Tap for details'} · ${escapeHtml(entry.where)}</small>`;
    el.style.display = 'block';
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { el.style.display = 'none'; }, 9000);
}

/* السياق المُمرَّر مع الإبلاغ اليدوي كان يُخزَّن ولا يُعرض — فبطاقة
   SelfCheck كانت تقول "وصلة مقطوعة" دون تسمية الوصلة، وهو بالضبط
   ما تحتاجه اللقطة. المصفوفات تُعرض سطراً لكل عنصر لأنها عادةً
   قائمة أعطال. */
/* navigator.clipboard غير متاح على HTTP ولا في بعض المتصفحات
   القديمة. الارتداد إلى execCommand يضمن أن زر النسخ يعمل دائماً —
   وهو القناة الوحيدة لإيصال التقرير، فلا يجوز أن يفشل بصمت. */
async function _copyToClipboard(text) {
    const viaApi = await safe(async () => {
        if (!navigator.clipboard?.writeText) return false;
        await navigator.clipboard.writeText(text);
        return true;
    }, false);
    if (viaApi) return true;

    return safe(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);   // iOS
        const done = document.execCommand('copy');
        ta.remove();
        return done;
    }, false);
}

function _ctxLines(ctx) {
    try {
        if (Array.isArray(ctx)) return ctx.map(v => '• ' + String(v)).join('\n');
        if (ctx && typeof ctx === 'object') {
            return Object.entries(ctx).map(([k, v]) =>
                Array.isArray(v)
                    ? `${k}:\n` + v.map(x => '  • ' + String(x)).join('\n')
                    : `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`
            ).join('\n');
        }
        return String(ctx);
    } catch { return '[context unreadable]'; }
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderPanel() {
    const p = document.getElementById('dacumErrPanel');
    if (!p) return;
    const rtl = isRTL();
    const body = _errors.length
        ? _errors.slice().reverse().map(e => {
            const c = e.ctx || {};
            return `<div class="dep-card">
<span class="c">${escapeHtml(e.code)}</span>${e.count > 1 ? `  <span class="k">×${e.count}</span>` : ''}
<span class="m">${escapeHtml(e.msg)}</span>
<span class="k">at</span>   ${escapeHtml(e.where)}
<span class="k">type</span> ${escapeHtml(e.kind)}
<span class="k">time</span> ${escapeHtml(e.time)}
<span class="k">app</span>  v${escapeHtml(c.version || '?')} · ${escapeHtml(c.mode || '?')} · ${escapeHtml(c.orient || '?')} · ${escapeHtml(c.screen || '?')}
<span class="k">i18n</span> dir=${escapeHtml(c.dir || '?')} lang=${escapeHtml(c.lang || '?')} sidebar=${escapeHtml(c.sb || '?')}
<span class="k">env</span>  pwa=${escapeHtml(c.pwa || '?')} online=${escapeHtml(c.online || '?')}
${e.context ? `<span class="k">info</span>\n${escapeHtml(_ctxLines(e.context))}\n` : ''}${e.crumbs && e.crumbs.length ? `<span class="k">steps</span> ${escapeHtml(e.crumbs.join(' → '))}\n` : ''}${e.stack ? `<span class="k">stack</span>\n${escapeHtml(e.stack)}` : ''}</div>`;
        }).join('')
        : `<div class="dep-empty">${rtl ? 'لا توجد أخطاء مسجّلة ✅' : 'No errors logged ✅'}</div>`;

    p.innerHTML = `
<div class="dep-head">
  <span>${rtl ? '🐞 سجل الأخطاء' : '🐞 Error log'} (${_errors.length})</span>
  <span class="dep-btns">
    <button class="prim" id="depCopy">${rtl ? 'نسخ' : 'Copy'}</button>
    <button class="dgr"  id="depClear">${rtl ? 'مسح' : 'Clear'}</button>
    <button id="depClose">${rtl ? 'إغلاق' : 'Close'}</button>
  </span>
</div>${body}`;

    p.querySelector('#depClose')?.addEventListener('click', close);
    p.querySelector('#depClear')?.addEventListener('click', () => { clear(); renderPanel(); });
    p.querySelector('#depCopy')?.addEventListener('click', async e => {
        const txt = asText();
        const ok = await _copyToClipboard(txt);
        e.target.textContent = ok ? (rtl ? 'تم النسخ ✓' : 'Copied ✓') : (rtl ? 'تعذّر النسخ' : 'Failed');
        setTimeout(() => { e.target.textContent = rtl ? 'نسخ' : 'Copy'; }, 1800);
    });
}

function asText() {
    return _errors.map(e => {
        const c = e.ctx || {};
        return [
            `[${e.code}]${e.count > 1 ? ` x${e.count}` : ''} ${e.kind}`,
            e.msg,
            `at ${e.where}  ${e.time}`,
            `v${c.version} ${c.mode}/${c.orient} ${c.screen} dir=${c.dir} lang=${c.lang} sidebar=${c.sb} pwa=${c.pwa}`,
            c.ua ? `UA ${c.ua}` : '',
            e.context ? _ctxLines(e.context) : '',
            e.crumbs?.length ? `steps ${e.crumbs.join(' → ')}` : '',
            e.stack || ''
        ].filter(Boolean).join('\n');
    }).join('\n\n────────────────\n\n');
}

function open()  { safe(() => { if (!document.getElementById('dacumErrPanel')) buildUI(); });
                   _panelOpen = true;  renderPanel();
                   const p = document.getElementById('dacumErrPanel'); if (p) p.style.display = 'block';
                   const t = document.getElementById('dacumErrToast'); if (t) t.style.display = 'none'; }
function close() { _panelOpen = false;
                   const p = document.getElementById('dacumErrPanel'); if (p) p.style.display = 'none'; }
function clear() { _errors = []; _seen.clear(); persist(); refreshBadge(); }

function buildUI() {
    injectStyles();

    const badge = document.createElement('button');
    badge.id = 'dacumErrBadge';
    badge.type = 'button';
    badge.setAttribute('aria-label', 'Error log');
    badge.innerHTML = '🐞<span>0</span>';
    badge.addEventListener('click', () => (_panelOpen ? close() : open()));

    const toast = document.createElement('div');
    toast.id = 'dacumErrToast';
    toast.addEventListener('click', open);

    const panel = document.createElement('div');
    panel.id = 'dacumErrPanel';

    document.body.append(badge, toast, panel);
    refreshBadge();
}

/* ── التركيب ────────────────────────────────────────────────── */

export function initErrorReporter() {
    if (_installed) return;
    _installed = true;

    load();

    window.addEventListener('error', ev => {
        // فشل تحميل مورد (script / img / css) لا يحمل ev.error
        if (ev.target && ev.target !== window && ev.target.tagName) {
            record('resource', `فشل تحميل: <${ev.target.tagName.toLowerCase()}> ${ev.target.src || ev.target.href || ''}`, {});
            return;
        }
        record('error', ev.message, {
            source: ev.filename, line: ev.lineno, col: ev.colno, stack: ev.error?.stack
        });
    }, true);   // capture=true ليلتقط أخطاء الموارد أيضاً

    window.addEventListener('unhandledrejection', ev => {
        const r = ev.reason;
        record('promise', r?.message || String(r), { stack: r?.stack });
    });

    // اعتراض console.error — في وضع المطوّر فقط.
    // مكتبة خارجية تسجّل تحذيراً، أو صورة لا تُحمَّل، أو طلب شبكة
    // يفشل: كلّها تمرّ عبر console.error وكلّها كانت تُنتج سجلّاً.
    // ضجيج بلا قيمة، ويُغرق الأعطال الحقيقية.
    const orig = console.error.bind(console);
    console.error = (...args) => {
        orig(...args);
        if (!DEV_MODE) return;      // لا التقاط في وضع المستخدم
        if (_inConsole) return;
        _inConsole = true;
        safe(() => {
            const first = args[0];
            record('console', args.map(a =>
                a instanceof Error ? a.message :
                typeof a === 'object' ? safe(() => JSON.stringify(a).slice(0, 200), '[object]') :
                String(a)
            ).join(' '), { stack: first instanceof Error ? first.stack : undefined });
        });
        _inConsole = false;
    };

    // فتات الخبز التلقائي: آخر الأزرار التي ضغطها المستخدم
    document.addEventListener('click', ev => {
        safe(() => {
            const el = ev.target.closest?.('button,[onclick],.sb-nav-item,.tb-btn');
            if (!el) return;
            const label = (el.getAttribute('aria-label') || el.title ||
                           el.textContent || el.id || el.className || '').trim().slice(0, 34);
            if (label) breadcrumb(label.replace(/\s+/g, ' '));
        });
    }, true);

    // في وضع المستخدم لا تُبنى عناصر الواجهة إطلاقاً — لا جرس
    // ولا فقاعة في شجرة DOM، فلا يمكن أن يظهر شيء بالخطأ.
    const start = () => { if (DEV_MODE) safe(buildUI); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();

    // إعادة ضبط جهة الجرس عند تبديل اللغة (LTR ⇄ RTL)
    document.addEventListener('dacum:langchange', () => { refreshBadge(); if (_panelOpen) renderPanel(); });

    // فتح اللوحة بالرابط:  index.html?debug
    safe(() => { if (/[?&]debug\b/.test(location.search)) setTimeout(open, 600); });

    window.DacumErrors = {
        report: (err, context) => record('manual',
            err?.message || String(err), { stack: err?.stack, context }),
        open, close, clear,
        log: () => _errors.slice(),
        text: asText,
        breadcrumb,
        test: () => { throw new Error('DacumErrors.test() — خطأ تجريبي متعمّد'); }
    };
}

export function breadcrumb(text) {
    _crumbs.push(String(text).slice(0, 40));
    if (_crumbs.length > 12) _crumbs.shift();
}

export default { initErrorReporter, breadcrumb };
