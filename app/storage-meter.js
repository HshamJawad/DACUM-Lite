/* ══════════════════════════════════════════════════════════════
   storage-meter.js — DACUM Lite
   ──────────────────────────────────────────────────────────────
   مؤشّر استهلاك التخزين المحلي.

   ── لماذا عتبتان لا واحدة، ولماذا 75% لا 95% ────────────────
   الكتابة في localStorage ذرّية: لا تمتلئ تدريجياً، بل إمّا تنجح
   كاملة أو تفشل كاملة. فالقفزة من 94% إلى الفشل تقع في عملية
   واحدة — إضافة شعارين أو خمس لقطات.

   عند 95% تبقى ~250 كيلوبايت فقط. تحذير يصل متأخّراً بخطوة
   واحدة لا يختلف عملياً عن غيابه. عند 75% يبقى 1.25 ميغابايت:
   مساحة حقيقية للتصدير والحذف قبل الاصطدام بالسقف.

   ── لماذا التفصيل لا النسبة ─────────────────────────────────
   "33% مستهلك" لا يخبر المستخدم بما يفعله. قياس فعلي على ثلاثة
   مشاريع بـ12 واجباً و15 لقطة لكل منها:

       اللقطات   3710 ك.ب   ← 94%
       الشعارات   240 ك.ب
       المخططات     8 ك.ب

   اللقطات هي المشكلة دائماً، لا بيانات المخطط. ومعرفة ذلك تحوّل
   التنبيه من إنذار إلى إرشاد: حذف لقطات مشروع منتهٍ يحرّر أكثر
   من أي إجراء آخر، وهو آمن لأنها تاريخ تراجع لا بيانات.

   ── لماذا حدثيّ لا دائم ─────────────────────────────────────
   الشريط الدائم يصير أثاثاً يُتجاهَل، ثم يُتجاهَل معه التنبيه
   الحقيقي. لا شيء يظهر تحت 75%. وفوقها: إشعار واحد لكل جلسة
   لكل عتبة — يُغلق ولا يعود.
   ══════════════════════════════════════════════════════════════ */

import { getStorageStats, pruneInactiveSnapshots,
         persistProjects, getAllProjects } from './project-manager.js';
import { t } from './i18n.js';

const WARN_PCT   = 75;
const URGENT_PCT = 90;
const SEEN_KEY   = 'dacum_storage_notice';   // sessionStorage
const PANEL_ID   = 'dacumStorageMeter';

const safe = (fn, fb) => { try { return fn(); } catch { return fb; } };
const isRTL = () => safe(() => document.documentElement.getAttribute('dir') === 'rtl', true);

const fmt = bytes => {
    const kb = bytes / 1024;
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} م.ب` : `${Math.round(kb)} ك.ب`;
};

/* ── تتبّع ما عُرض في هذه الجلسة ─────────────────────────────
   sessionStorage لا localStorage: التنبيه يعود في الجلسة
   التالية إن بقيت المشكلة، لكنه لا يتكرّر داخل الجلسة الواحدة. */
function alreadyShown(level) {
    return safe(() => (sessionStorage.getItem(SEEN_KEY) || '').split(',').includes(level), false);
}
function markShown(level) {
    safe(() => {
        const cur = (sessionStorage.getItem(SEEN_KEY) || '').split(',').filter(Boolean);
        if (!cur.includes(level)) cur.push(level);
        sessionStorage.setItem(SEEN_KEY, cur.join(','));
    });
}

/* ══════════════════════════════════════════════════════════════
   الأنماط
   ══════════════════════════════════════════════════════════════ */
function injectStyles() {
    if (document.getElementById('dacumStorageStyles')) return;
    const s = document.createElement('style');
    s.id = 'dacumStorageStyles';
    s.textContent = `
#${PANEL_ID}{
  position:fixed;inset:0;z-index:2147482000;display:flex;
  align-items:center;justify-content:center;padding:16px;
  background:rgba(15,23,42,.62);backdrop-filter:blur(2px);
  font-family:'Cairo','Segoe UI',Tahoma,sans-serif;
}
#${PANEL_ID} .sm-box{
  background:#fff;border-radius:16px;max-width:460px;width:100%;
  padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.35);
  max-height:88vh;overflow-y:auto;
}
#${PANEL_ID} .sm-title{
  font-size:1.06em;font-weight:800;color:#0f172a;
  margin:0 0 4px;display:flex;align-items:center;gap:8px;
}
#${PANEL_ID} .sm-sub{font-size:.86em;color:#64748b;margin:0 0 16px;line-height:1.6;}

/* الشريط: التدرّج اللوني يحمل المعنى مع النسبة، لا بدلاً منها */
#${PANEL_ID} .sm-bar{
  height:10px;border-radius:99px;background:#e2e8f0;overflow:hidden;margin-bottom:6px;
}
#${PANEL_ID} .sm-fill{height:100%;border-radius:99px;transition:width .5s ease;}
#${PANEL_ID} .sm-pct{
  font-size:.82em;color:#475569;font-weight:700;
  display:flex;justify-content:space-between;margin-bottom:16px;
}

/* التفصيل — هذا هو الجزء القابل للتنفيذ */
#${PANEL_ID} .sm-rows{
  background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
  padding:10px 12px;margin-bottom:16px;
}
#${PANEL_ID} .sm-row{
  display:flex;align-items:center;gap:8px;
  font-size:.85em;padding:5px 0;color:#334155;
}
#${PANEL_ID} .sm-dot{width:9px;height:9px;border-radius:3px;flex-shrink:0;}
#${PANEL_ID} .sm-row .sm-lbl{flex:1;min-width:0;}
#${PANEL_ID} .sm-row .sm-val{font-weight:700;font-variant-numeric:tabular-nums;}
#${PANEL_ID} .sm-hint{
  font-size:.8em;color:#7c2d12;background:#fff7ed;border:1px solid #fed7aa;
  border-radius:8px;padding:9px 11px;margin-bottom:16px;line-height:1.65;
}
#${PANEL_ID} .sm-acts{display:flex;flex-direction:column;gap:8px;}
#${PANEL_ID} button{
  border:none;border-radius:9px;padding:11px 14px;font-size:.9em;
  font-weight:700;cursor:pointer;font-family:inherit;width:100%;
  display:block;text-align:center;
}
#${PANEL_ID} .sm-primary{background:#4f46e5;color:#fff;}
#${PANEL_ID} .sm-secondary{background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;}
#${PANEL_ID} .sm-close{background:transparent;color:#64748b;font-weight:600;}
`;
    document.head.appendChild(s);
}

const COLORS = {
    snapshots: '#6366f1',
    logos:     '#f59e0b',
    charts:    '#10b981',
    meta:      '#94a3b8'
};

function barColor(pct) {
    return pct >= URGENT_PCT ? '#dc2626'
         : pct >= WARN_PCT   ? '#f59e0b'
                             : '#3b82f6';
}

/* ══════════════════════════════════════════════════════════════
   اللوحة
   ══════════════════════════════════════════════════════════════ */
function buildPanel(stats, urgent) {
    injectStyles();
    document.getElementById(PANEL_ID)?.remove();

    const b = stats.breakdown;
    // الترتيب تنازلياً: الأثقل أولاً، فيعرف المستخدم أين يتصرّف
    const rows = [
        ['snapshots', t('storage.snapshots'), b.snapshots],
        ['logos',     t('storage.logos'),     b.logos],
        ['charts',    t('storage.charts'),    b.charts],
        ['meta',      t('storage.other'),     b.meta]
    ].filter(r => r[2] > 512).sort((a, c) => c[2] - a[2]);

    const wrap = document.createElement('div');
    wrap.id = PANEL_ID;
    wrap.dir = isRTL() ? 'rtl' : 'ltr';

    wrap.innerHTML = `
<div class="sm-box" role="dialog" aria-modal="true">
  <p class="sm-title">${urgent ? '🔴' : '⚠️'} ${t(urgent ? 'storage.titleUrgent' : 'storage.titleWarn')}</p>
  <p class="sm-sub">${t('storage.subtitle', { pct: stats.pct, used: fmt(stats.bytes) })}</p>

  <div class="sm-bar"><div class="sm-fill" style="width:${stats.pct}%;background:${barColor(stats.pct)}"></div></div>
  <div class="sm-pct"><span>${fmt(stats.bytes)}</span><span>${stats.pct}%</span></div>

  <div class="sm-rows">
    ${rows.map(([k, label, val]) => `
      <div class="sm-row">
        <span class="sm-dot" style="background:${COLORS[k]}"></span>
        <span class="sm-lbl">${label}</span>
        <span class="sm-val">${fmt(val)}</span>
      </div>`).join('')}
  </div>

  ${b.snapshots > b.charts
      ? `<div class="sm-hint">${t('storage.hintSnapshots')}</div>`
      : b.logos > b.charts
      ? `<div class="sm-hint">${t('storage.hintLogos')}</div>` : ''}

  <div class="sm-acts">
    <button class="sm-primary"   data-sm="export">${t('storage.actExport')}</button>
    <button class="sm-secondary" data-sm="prune">${t('storage.actPrune')}</button>
    <button class="sm-close"     data-sm="close">${t('storage.actLater')}</button>
  </div>
</div>`;

    document.body.appendChild(wrap);

    const close = () => wrap.remove();
    wrap.querySelector('[data-sm="close"]').addEventListener('click', close);
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });

    // التصدير: يفتح مسار التصدير القائم بدل تكرار منطقه هنا
    wrap.querySelector('[data-sm="export"]').addEventListener('click', () => {
        close();
        safe(() => window.pmExportProject?.() ?? window.exportProject?.());
    });

    // الحذف: أكبر مساحة تُحرَّر بلا فقدان بيانات مخطط
    wrap.querySelector('[data-sm="prune"]').addEventListener('click', () => {
        const others = getAllProjects().length - 1;
        if (others < 1) { alert(t('storage.pruneNone')); return; }
        if (!confirm(t('storage.pruneConfirm', { n: others }))) return;

        const { freed, projects } = pruneInactiveSnapshots();
        persistProjects();
        close();
        alert(t('storage.pruneDone', { size: fmt(freed), n: projects }));
    });
}

/* ══════════════════════════════════════════════════════════════
   الفحص
   ══════════════════════════════════════════════════════════════ */

/**
 * افحص الاستهلاك واعرض التنبيه إن تجاوز عتبة لم تُعرض بعد.
 * @param {{force?:boolean}} [opts] force يتجاهل حارس الجلسة
 * @returns {object} الإحصاءات
 */
export function checkStorage({ force = false } = {}) {
    const stats = getStorageStats();

    if (stats.pct >= URGENT_PCT && (force || !alreadyShown('urgent'))) {
        markShown('urgent');
        buildPanel(stats, true);
    } else if (stats.pct >= WARN_PCT && (force || !alreadyShown('warn'))) {
        markShown('warn');
        buildPanel(stats, false);
    } else if (force) {
        buildPanel(stats, stats.pct >= URGENT_PCT);
    }
    return stats;
}

export function initStorageMeter() {
    // بعد استقرار الإقلاع، لا أثناءه: تنبيه يقفز قبل ظهور الواجهة
    // يربك أكثر مما يفيد.
    const start = () => setTimeout(() => safe(() => checkStorage()), 2500);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    if (typeof window !== 'undefined') {
        window.DacumStorage = {
            check: () => checkStorage({ force: true }),
            stats: getStorageStats,
            reset: () => safe(() => sessionStorage.removeItem(SEEN_KEY))
        };
    }
}

export default { checkStorage, initStorageMeter };
