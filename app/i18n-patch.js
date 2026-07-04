/**
 * i18n-patch.js — DACUM Lite v3.1
 * ─────────────────────────────────────────────────────────────────────
 * هذا الملف يحتوي على جميع مفاتيح الترجمة الجديدة والمعدَّلة
 * التي يجب إضافتها / تحديثها داخل ملف i18n.js الخاص بك.
 *
 * التعديلات:
 *  1. حقل Sector الجديد (قبل occupationTitle)
 *  2. إعادة تسمية occupationTitle  → المهنة  (AR)
 *  3. إعادة تسمية jobTitle         → العمل   (AR)
 *  4. تحديث خطوة Help step1 لتشمل Sector
 * ─────────────────────────────────────────────────────────────────────
 */

// ── داخل كائن الترجمة الإنجليزية  en: { ... }  ────────────────────

const en_additions = {

  // ─── Chart Info tab ─────────────────────────────────────────────
  "chartInfo.sector":            "🏭 Sector:",
  "chartInfo.sector.ph":         "e.g., Construction / Manufacturing / Health",

  // Updated labels (keep icon, add Arabic name in parentheses for bilingual display)
  "chartInfo.occupationTitle":   "💼 Occupation Title (المهنة):",
  "chartInfo.occupationTitle.ph":"e.g., Automotive Technician",

  "chartInfo.jobTitle":          "👔 Job Title (العمل):",
  "chartInfo.jobTitle.ph":       "e.g., Service Technician Level 2",

  // ─── Help tab step 1 ────────────────────────────────────────────
  "help.step1":
    "Enter the <strong>Sector</strong>, <strong>Occupation Title</strong> and <strong>Job Title</strong> in the <em>Chart Info</em> tab.",
};

// ── داخل كائن الترجمة العربية  ar: { ... }  ────────────────────────

const ar_additions = {

  // ─── Chart Info tab ─────────────────────────────────────────────
  "chartInfo.sector":            "🏭 القطاع:",
  "chartInfo.sector.ph":         "مثال: الإنشاء / التصنيع / الصحة",

  // الاسمان العربيان المطلوبان
  "chartInfo.occupationTitle":   "💼 المهنة:",
  "chartInfo.occupationTitle.ph":"مثال: فني سيارات",

  "chartInfo.jobTitle":          "👔 العمل:",
  "chartInfo.jobTitle.ph":       "مثال: فني خدمة المستوى 2",

  // ─── Help tab step 1 ────────────────────────────────────────────
  "help.step1":
    "أدخل <strong>القطاع</strong> و<strong>المهنة</strong> و<strong>العمل</strong> في تبويب <em>معلومات المخطط</em>.",
};

/*
 * ─── تعليمات التطبيق ────────────────────────────────────────────────
 *
 * 1. افتح ملف  i18n.js
 *
 * 2. في قسم  en: { ... }  أضف / استبدل المفاتيح من  en_additions  أعلاه.
 *    كذلك تأكد من وجود حقل Sector في دالة captureState / syncAllFromDOM
 *    وفي دوال التصدير (PDF + Word).
 *
 * 3. في قسم  ar: { ... }  أضف / استبدل المفاتيح من  ar_additions  أعلاه.
 *
 * 4. في ملف  app.js  (أو الملف الذي يحتوي على captureState / syncAllFromDOM):
 *    أضف قراءة وكتابة حقل sector:
 *
 *      // في captureState():
 *      sector: document.getElementById('sector')?.value.trim() || '',
 *
 *      // في restoreState() / loadProject():
 *      if (s.sector !== undefined)
 *        document.getElementById('sector').value = s.sector;
 *
 * 5. في دوال التصدير exportToPDF() و exportToWord():
 *    أضف سطراً يقرأ قيمة الحقل ويدرجها في الوثيقة المُصدَّرة، مثلاً:
 *
 *      const sector = document.getElementById('sector')?.value.trim() || '';
 *      // ثم ضمّنها في رأس المستند بعد "Produced By" وقبل "Occupation Title"
 *
 * 6. في clearAll():
 *    document.getElementById('sector').value = '';
 *
 * ─────────────────────────────────────────────────────────────────────
 */
