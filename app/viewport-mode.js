/* ══════════════════════════════════════════════════════════════
   viewport-mode.js — DACUM Lite
   ──────────────────────────────────────────────────────────────
   مصدر الحقيقة الوحيد للسؤال: هل نحن في «وضع الدرج» أم «وضع
   الشريط الثابت»؟

   لماذا وحدة مستقلّة؟
   العلّة التي عالجناها في v4.5.5 لم تكن خطأً في سطر واحد، بل
   انحرافاً بين تعريفين للمفهوم نفسه:

       CSS : @media (max-width: 768px)
       JS  : window.innerWidth <= 768

   يبدوان متطابقين وليسا كذلك — innerWidth يشمل عرض شريط التمرير
   بينما استعلام الوسائط لا يشمله (فرق ~15px على بعض المتصفحات)،
   ويتأثر بلوحة مفاتيح أندرويد ومستوى التكبير. أي تعديل مستقبلي
   على أحد الطرفين دون الآخر يعيد إنتاج العلّة نفسها.

   الحلّ: CSS يعلن الوضع في متغيّر (--sb-mode)، وJS يقرأه.
   استحالة الانحراف بنيوياً — لا انضباطاً.

   الاستعلام نفسه معرَّف في index.html فقط. هذا الملف لا يكرّره،
   بل يقرأ نتيجته.
   ══════════════════════════════════════════════════════════════ */

/* الاستعلامات الفرعية — تُستخدم للاستماع للتغيّر فقط، لا للقرار.
   القرار يأتي دائماً من --sb-mode. إن أُضيف شرط ثالث للاستعلام
   في CSS مستقبلاً وnسي أحدهم إضافته هنا، فأسوأ ما يحدث تأخّر
   إشعار — لا حالة خاطئة. */
const WATCHED = [
    '(max-width: 1024px)',
    '(pointer: coarse)',
    '(orientation: landscape)'
];

const _listeners = new Set();
let _last = null;

/**
 * هل الواجهة في وضع الدرج المنزلق؟
 * تقرأ الجواب من CSS مباشرةً — لا حساب موازٍ، لا ثابت مكرّر.
 * @returns {boolean}
 */
export function isDrawerMode() {
    try {
        const v = getComputedStyle(document.documentElement)
                    .getPropertyValue('--sb-mode').trim();
        // إن غاب المتغيّر (CSS لم يُحمَّل بعد) نرجع لتقدير محافظ
        if (v) return v === 'drawer';
    } catch { /* بيئات نادرة بلا getComputedStyle */ }
    return window.innerWidth <= 768;
}

/**
 * تسجيل مستمع يُستدعى عند تبدّل الوضع فعلياً (لا عند كل تغيّر مقاس).
 * @param {(mode:'drawer'|'desktop')=>void} cb
 * @returns {()=>void} دالة إلغاء التسجيل
 */
export function onViewportModeChange(cb) {
    _listeners.add(cb);
    return () => _listeners.delete(cb);
}

/** القيمة الحالية كنص — مفيدة لتقارير الأخطاء. */
export function currentMode() {
    return isDrawerMode() ? 'drawer' : 'desktop';
}

function _emit() {
    const mode = currentMode();
    if (mode === _last) return;      // تجاهل الضجيج: لوحة المفاتيح، شريط العنوان
    _last = mode;
    _listeners.forEach(cb => { try { cb(mode); } catch (e) { console.error(e); } });
}

export function initViewportMode() {
    _last = currentMode();

    WATCHED.forEach(q => {
        const mq = window.matchMedia(q);
        // addListener: احتياط لـ Android WebView قبل 2020
        mq.addEventListener ? mq.addEventListener('change', _emit)
                            : mq.addListener(_emit);
    });

    // بعض أجهزة أندرويد تُحدّث المقاسات بعد حدث التدوير بإطارين
    window.addEventListener('orientationchange', () => setTimeout(_emit, 120));
    window.addEventListener('pageshow', e => { if (e.persisted) _emit(); });

    return _last;
}

export default { isDrawerMode, onViewportModeChange, currentMode, initViewportMode };
