/* ══════════════════════════════════════════════════════════════
   boot-bridge.js — DACUM Lite
   ──────────────────────────────────────────────────────────────
   جسر الإقلاع: يمنع "ReferenceError: X is not defined" حين يضغط
   المستخدم زراً قبل أن تجهز الوحدات.

   ── المشكلة ─────────────────────────────────────────────────
   وسوم <script type="module"> مؤجَّلة بطبيعتها: تُنفَّذ بعد رسم
   HTML كاملاً. فبين ظهور الأزرار على الشاشة وتنفيذ
   Object.assign(window, {...}) في app.js توجد نافذة قصيرة تكون
   فيها الأزرار مرئية وقابلة للضغط — وبلا دوالّ خلفها.

   في index.html أربعة وستون زراً تستخدم onclick="fn()"، وكلّها
   معرّضة لهذا. النافذة قصيرة عادةً، لكنها تتّسع كثيراً عند
   الإقلاع البارد، أو على اتصال بطيء، أو بعد تفريغ الكاش وإعادة
   التحميل — وهي الحالة التي وقع فيها الخطأ فعلاً.

   ── لماذا هذا الحل لا غيره ──────────────────────────────────
   البدائل المطروحة وسبب رفضها:

   • تعطيل الأزرار حتى الجاهزية: يتطلّب تعديل 64 موضعاً في HTML،
     ويُظهر واجهة رمادية عند كل إقلاع — علاج أسوأ من الداء.

   • استبدال onclick بمستمعات: إعادة هيكلة واسعة لـ 64 زراً،
     وهي بالضبط نوع العمل اليدوي الذي فقد إصلاحات في هذا
     المشروع من قبل.

   • تجاهل المشكلة: الضغطة تُفقد صامتة والمستخدم يظنّ الزر معطّلاً.

   الحل هنا: وكيل (Proxy) على window يلتقط أي استدعاء لدالة غير
   معرّفة بعد، ويضعها في طابور. حين تُعلن app.js جاهزيتها،
   يُشغَّل الطابور بالترتيب. الضغطة المبكّرة لا تُفقد ولا ترمي
   خطأً — تُنفَّذ متأخّرةً بجزء من ثانية.

   صفر تعديل في HTML. صفر تعديل في منطق app.js عدا سطر إعلان
   الجاهزية.

   ── التركيب ────────────────────────────────────────────────
   في index.html، كأول وسم <script> على الإطلاق — يجب أن يسبق
   رسم الأزرار، لذا هو غير مؤجَّل (بلا type="module"):

       <script src="./boot-bridge.js"></script>

   وفي app.js، في آخر سطر من كتلة التهيئة:

       window.__dacumReady?.();
   ══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // أسماء الدوال التي تستدعيها أزرار index.html عبر onclick.
    // القائمة صريحة عمداً: وكيل يلتقط كل اسم غير معرّف على window
    // سيبتلع أخطاءً حقيقية (أخطاء إملائية، دوالّ محذوفة) ويحوّلها
    // إلى صمت — وهو بالضبط ما أرهق هذا المشروع.
    const DEFERRED = [
        // الشريط الجانبي والمشاريع
        'pmToggleSidebar', 'pmResetSidebar', 'pmNewProject', 'pmFilterProjects',
        // الواجبات والمهام
        'addDuty', 'removeDuty', 'addTask', 'removeTask', 'clearDuty',
        'cvAddDuty', 'toggleCardView',
        // المعلومات الإضافية
        'toggleListFormat', 'toggleEditHeading', 'clearSection',
        'addCustomSection', 'removeCustomSection',
        // عرض الجدار
        'showWallView', 'exitWallView', 'wallViewZoom', 'resetWallZoom',
        'toggleWallFullscreen', 'printWallView',
        // التراجع واللقطات
        'undo', 'redo', 'promptSnapshot', 'toggleSnapshotPanel',
        // الصور والتصدير
        'removeImage', 'clearAll', 'cycleTheme', 'pwaInstall'
    ];

    const queue   = [];
    let   ready   = false;
    const MAX_WAIT = 12000;   // بعدها نعتبر الإقلاع فاشلاً

    /* لكل اسم: عرّف بديلاً مؤقّتاً على window. حين تعرّف app.js
       الدالة الحقيقية بـ Object.assign فإنها تكتب فوق البديل —
       فلا يبقى أثر لهذا الملف بعد الجاهزية. */
    DEFERRED.forEach(name => {
        if (typeof window[name] === 'function') return;   // جاهزة أصلاً
        window[name] = function (...args) {
            if (ready) {
                // الجاهزية أُعلنت والدالة ما زالت مفقودة: عطل حقيقي
                console.error(`[BootBridge] ${name} غير معرّفة بعد اكتمال الإقلاع`);
                window.DacumErrors?.report(
                    new Error(`${name} is not defined after boot`), { handler: name });
                return;
            }
            queue.push({ name, args, at: Date.now() });
            console.info(`[BootBridge] ${name}() قبل الجاهزية — أُجّلت`);
        };
    });

    /* تُستدعى من app.js بعد Object.assign(window, {...}) */
    window.__dacumReady = function () {
        if (ready) return;
        ready = true;
        clearTimeout(timer);

        if (!queue.length) return;
        console.info(`[BootBridge] تشغيل ${queue.length} ضغطة مؤجّلة`);

        // الترتيب محفوظ: الضغطات تُنفَّذ كما وقعت
        const pending = queue.splice(0);
        for (const { name, args } of pending) {
            const fn = window[name];
            // لا تستدع البديل مرّة أخرى — لو بقي، فالدالة لم تُعرَّف
            if (typeof fn !== 'function' || fn.__isBootStub) continue;
            try { fn(...args); }
            catch (e) { console.error(`[BootBridge] فشل ${name}():`, e); }
        }
    };

    // وسم البدائل حتى نميّزها عن الدوالّ الحقيقية عند التشغيل
    DEFERRED.forEach(n => { if (window[n]) window[n].__isBootStub = true; });

    /* شبكة أمان: إن لم تُعلن الجاهزية إطلاقاً — أي أن app.js انهار
       عند التحميل — يجب أن يعرف المستخدم بدل أن يضغط أزراراً صامتة. */
    const timer = setTimeout(() => {
        if (ready) return;
        console.error('[BootBridge] لم تكتمل تهيئة app.js خلال 12 ثانية');
        window.DacumErrors?.report(
            new Error('app.js لم يُكمل التهيئة — الأزرار معطّلة'),
            { queued: queue.length, queuedNames: queue.map(q => q.name) });
    }, MAX_WAIT);
})();
