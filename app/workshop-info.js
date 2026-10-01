// ============================================================
// workshop-info.js — Workshop dates, format and venue   (v4.13.0)
//
// Adds three things to the Chart Info tab, directly under DACUM Date:
//
//   1. "Multi-day workshop (from – to)" checkbox. When ticked, a second
//      date field ("To") appears. DACUM Date becomes the first day.
//   2. Workshop format: In person / Online / Hybrid (one choice).
//   3. Venue field whose meaning follows the format:
//        In person → Venue            (e.g. Conference Center, City)
//        Online    → Online platform  (e.g. Zoom, Microsoft Teams)
//        Hybrid    → Venue / platform
//      The field is re-purposed rather than disabled: an online workshop
//      still has a "where" worth recording, and it belongs in the export.
//
// The controls are built here (not in index.html) and inserted next to
// #dacumDate the first time any function below runs, so events.js can
// call them from any code path without depending on boot order.
//
// PERSISTENCE — the four values travel inside chartInfo:
//     multiDay (bool) · dacumDateTo ('YYYY-MM-DD' | '') ·
//     workshopMode ('inperson' | 'online' | 'hybrid') · venue (string)
// chartInfo is stored whole in the project record and in exported
// project files, so no schema change is needed. Older projects simply
// lack the keys and load with the defaults (single day, in person).
//
// ANDROID / PWA — an EMPTY date field on Android draws the phone's own
// locale placeholder, which in Arabic comes out reversed and unjoined
// («موي/رهش/ةنس»). The "To" field is therefore never left empty while
// it is visible: it opens on the day after the start date, and goes
// back to that if the user clears it. It is also never allowed to fall
// before the start date.
// ============================================================

import { getLang } from './i18n.js';
import { saveToLocalStorage } from './storage.js';

const MODES = ['inperson', 'online', 'hybrid'];

const TXT = {
    en: {
        multiDay:   'Multi-day workshop (from – to)',
        to:         '📅 To:',
        format:     '🧭 Workshop format:',
        inperson:   'In person',
        online:     'Online',
        hybrid:     'Hybrid',
        venue_inperson: '📍 Venue:',
        venue_online:   '💻 Online platform:',
        venue_hybrid:   '📍 Venue / platform:',
        ph_inperson: 'e.g., Conference Center, City',
        ph_online:   'e.g., Zoom, Microsoft Teams',
        ph_hybrid:   'e.g., Training Center, City + Zoom',
        // Export labels (no emoji)
        x_format:   'Workshop format',
        x_inperson: 'Venue',
        x_online:   'Online platform',
        x_hybrid:   'Venue / platform'
    },
    fr: {
        multiDay:   'Atelier sur plusieurs jours (du – au)',
        to:         '📅 Au :',
        format:     '🧭 Format de l\'atelier :',
        inperson:   'En présentiel',
        online:     'En ligne',
        hybrid:     'Hybride',
        venue_inperson: '📍 Lieu :',
        venue_online:   '💻 Plateforme en ligne :',
        venue_hybrid:   '📍 Lieu / plateforme :',
        ph_inperson: 'ex. : Centre de conférences, Ville',
        ph_online:   'ex. : Zoom, Microsoft Teams',
        ph_hybrid:   'ex. : Centre de formation, Ville + Zoom',
        x_format:   'Format de l\'atelier',
        x_inperson: 'Lieu',
        x_online:   'Plateforme en ligne',
        x_hybrid:   'Lieu / plateforme'
    },
    ar: {
        multiDay:   'ورشة لعدة أيام (من – إلى)',
        to:         '📅 إلى:',
        format:     '🧭 نمط الورشة:',
        inperson:   'حضوري',
        online:     'عن بُعد',
        hybrid:     'مدمج',
        venue_inperson: '📍 مكان الانعقاد:',
        venue_online:   '💻 المنصة الإلكترونية:',
        venue_hybrid:   '📍 المكان / المنصة:',
        ph_inperson: 'مثال: مركز المؤتمرات، المدينة',
        ph_online:   'مثال: Zoom أو Microsoft Teams',
        ph_hybrid:   'مثال: مركز التدريب، المدينة + Zoom',
        x_format:   'نمط الورشة',
        x_inperson: 'مكان الانعقاد',
        x_online:   'المنصة الإلكترونية',
        x_hybrid:   'المكان / المنصة'
    }
};

function _t(key) {
    let lang = 'en';
    try { lang = getLang() || 'en'; } catch (e) { /* default */ }
    return (TXT[lang] && TXT[lang][key]) ?? TXT.en[key] ?? key;
}

// ── Date helpers (local time, never UTC) ─────────────────────
function _iso(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function _parse(iso) {
    return /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? new Date(iso + 'T00:00:00') : null;
}
function _nextDay(iso) {
    const d = _parse(iso) || new Date();
    d.setDate(d.getDate() + 1);
    return _iso(d);
}

// ── DOM ───────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

export function ensureWorkshopFields() {
    if ($('wkBlock')) return true;
    const from = $('dacumDate');
    if (!from) return false;
    const host = from.closest('.mb-10') || from.parentElement;
    if (!host) return false;

    const block = document.createElement('div');
    block.id = 'wkBlock';
    block.className = 'wk-block';
    block.innerHTML = `
        <label class="wk-check" for="wkMultiDay">
            <input type="checkbox" id="wkMultiDay">
            <span class="wk-check-text" data-wk="multiDay"></span>
        </label>

        <div class="wk-to mb-10" id="wkToWrap" hidden>
            <label for="dacumDateTo" data-wk="to"></label>
            <input type="date" id="dacumDateTo">
        </div>

        <div class="wk-mode mb-10" role="radiogroup" aria-labelledby="wkModeLabel">
            <div class="wk-label" id="wkModeLabel" data-wk="format"></div>
            <div class="wk-seg">
                ${MODES.map(m => `
                <label class="wk-seg-opt">
                    <input type="radio" name="wkMode" value="${m}"${m === 'inperson' ? ' checked' : ''}>
                    <span data-wk="${m}"></span>
                </label>`).join('')}
            </div>
        </div>

        <div class="mb-10">
            <label for="workshopVenue" id="wkVenueLabel"></label>
            <input type="text" id="workshopVenue" autocomplete="off">
        </div>
    `;
    host.insertAdjacentElement('afterend', block);

    // ── Wiring ───────────────────────────────────────────────
    const multi = $('wkMultiDay');
    const to    = $('dacumDateTo');

    multi.addEventListener('change', () => {
        _syncTo(true);
        saveToLocalStorage();
    });

    // "To" never empty while shown, never before "From".
    const fixTo = () => { _syncTo(false); };
    to.addEventListener('change', () => { fixTo(); saveToLocalStorage(); });
    to.addEventListener('blur', fixTo);
    from.addEventListener('change', fixTo);

    block.querySelectorAll('input[name="wkMode"]').forEach(r =>
        r.addEventListener('change', () => { _paintLabels(); saveToLocalStorage(); }));

    $('workshopVenue').addEventListener('change', () => saveToLocalStorage());

    document.addEventListener('dacum:langchange', _paintLabels);

    _paintLabels();
    return true;
}

function _mode() {
    const r = document.querySelector('input[name="wkMode"]:checked');
    return r && MODES.includes(r.value) ? r.value : 'inperson';
}

/* Show/hide the "To" field and keep its value valid.
   `opening` is true when the checkbox was just ticked. */
function _syncTo(opening) {
    const multi = $('wkMultiDay'), to = $('dacumDateTo'), wrap = $('wkToWrap');
    const fromV = $('dacumDate')?.value || '';
    if (!multi || !to || !wrap) return;

    wrap.hidden = !multi.checked;
    if (!multi.checked) return;

    if (fromV) to.min = fromV; else to.removeAttribute('min');

    if (!to.value || (opening && to.value <= fromV)) to.value = _nextDay(fromV);
    if (fromV && to.value < fromV) to.value = fromV;
}

function _paintLabels() {
    const block = $('wkBlock');
    if (!block) return;
    block.querySelectorAll('[data-wk]').forEach(el => { el.textContent = _t(el.dataset.wk); });
    const m = _mode();
    $('wkVenueLabel').textContent = _t('venue_' + m);
    $('workshopVenue').placeholder = _t('ph_' + m);
    block.dataset.mode = m;
}

// ── Data API (used by events.js) ─────────────────────────────
export function getWorkshopData() {
    ensureWorkshopFields();
    const multi = !!$('wkMultiDay')?.checked;
    return {
        multiDay:     multi,
        dacumDateTo:  multi ? ($('dacumDateTo')?.value || '') : '',
        workshopMode: _mode(),
        venue:        $('workshopVenue')?.value || ''
    };
}

export function applyWorkshopData(info) {
    if (!ensureWorkshopFields()) return;
    const i = (info && typeof info === 'object') ? info : {};
    const multi = !!i.multiDay;
    const mode  = MODES.includes(i.workshopMode) ? i.workshopMode : 'inperson';

    $('wkMultiDay').checked = multi;
    $('dacumDateTo').value  = multi ? (i.dacumDateTo || '') : '';
    document.querySelectorAll('input[name="wkMode"]').forEach(r => { r.checked = (r.value === mode); });
    $('workshopVenue').value = i.venue || '';

    _syncTo(false);
    _paintLabels();
}

export function resetWorkshopData() {
    applyWorkshopData({});
}

// ── Export helpers ───────────────────────────────────────────

/**
 * "from" alone, or "from – to" when a later end date exists.
 * @param {string}   fromISO
 * @param {string}   toISO
 * @param {Function} fmt  ISO → display string (each export keeps its own format)
 * @param {string}   sep  separator between the two dates
 */
export function formatDateRange(fromISO, toISO, fmt, sep) {
    if (!fromISO) return '';
    const a = fmt(fromISO);
    if (!toISO || toISO <= fromISO) return a;
    return a + sep + fmt(toISO);
}

/** Lines for the export title page, in the current interface language. */
export function workshopExportLines(data) {
    const d = data || getWorkshopData();
    const lines = [`${_t('x_format')}: ${_t(d.workshopMode)}`];
    if (d.venue && d.venue.trim()) lines.push(`${_t('x_' + d.workshopMode)}: ${d.venue.trim()}`);
    return lines;
}
