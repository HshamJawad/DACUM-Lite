// ============================================================
// word-settings.js — Settings modal: export appearance + card colours
//
// Two independent groups of settings live in this one modal:
//
// 1. EXPORT APPEARANCE (dacum_word_settings) — the look of the
//    exported files. Never touches the tool's own interface.
//      Colours → applied to BOTH the .docx and the .pdf export.
//      Sizes   → applied to the .docx export ONLY. The PDF is a
//                hand-laid-out landscape chart whose row heights,
//                cell padding and page-break maths are all derived
//                from a fixed 5.5mm line height; raising the font
//                there overlaps lines and spills text past the page
//                edge. Sizes stay Word-only until that geometry is
//                made size-aware, which is a separate job.
//
// 2. CARD COLOURS (dacum_card_colors, v4.12.0) — the colour of the
//    duty and task cards in the Duties & Tasks tab (card, wall and
//    table views). Interface only: exports are never affected.
//    Works independently of the colour themes: a picked colour
//    overrides whichever theme is active; "Theme" hands the cards
//    back to the theme.
//
//    Mechanism: components.css paints every card from four tokens
//    (--card-duty, --card-duty-deep, --card-task, --card-task-dark)
//    plus --card-task-ink, whose :root defaults point at the theme's
//    --brand-* tokens. A custom pick is written as an INLINE style on
//    <html>, which outranks both :root and html[data-theme=…], so the
//    theme toggle can keep cycling without undoing the user's choice.
//    Removing the inline properties returns control to the theme.
//
// Both groups are global to the tool, shared by all three languages,
// and persist until the user changes them by hand.
//
// Public API:
//   getWordSettings()      → validated settings object
//   saveWordSettings(obj)  → merge + persist
//   resetWordSettings()    → back to WORD_DEFAULTS
//   contrastText(hex)      → '000000' | 'FFFFFF' for that fill
//   hexToRgb(hex)          → { r, g, b }
//   tintHex(hex, alpha)    → hex of that colour at `alpha` over white
//   getCardColors()        → { duty, task } — 'theme' or a palette hex
//   saveCardColors(obj)    → persist + apply
//   applyCardColors(obj?)  → push the tokens onto <html>
//   initWordSettings()     → wire the sidebar button (once) + apply cards
//   openWordSettings()     → open the modal
//   closeWordSettings()    → close the modal
// ============================================================

import { t, getLang } from './i18n.js';
import { showStatus } from './design-system.js';

const STORAGE_KEY = 'dacum_word_settings';

/* Word's own point scale. docx stores half-points, so the export
   layer multiplies by 2 — the numbers stored here are the ones the
   user sees in Word's font-size box. */
export const SIZE_MIN = 11;
export const SIZE_MAX = 18;

/* The defaults reproduce the CURRENT exported file byte-for-byte in
   appearance: 14pt titles, 12pt headings, 12pt body, black heading
   text, and the light grey E8E8E8 that the table header shading has
   always used. "Reset to default" therefore restores exactly the
   look the tool shipped with. */
export const WORD_DEFAULTS = Object.freeze({
    titleSize:       14,          // main title level
    headingSize:     12,          // secondary heading level
    bodySize:        12,          // table cells + general content
    headingColor:    '000000',    // all heading levels
    tableHeaderFill: 'E8E8E8'     // shaded header cells
});

/* Eight professional colours plus the light grey that is the factory
   default for the table header. Free colour picking is deliberately
   not offered — a fixed palette is what keeps exported charts looking
   consistent across a team. */
export const SWATCHES = Object.freeze([
    { hex: '0070C0', key: 'settings.color.blue'      },
    { hex: '1F3864', key: 'settings.color.navy'      },
    { hex: '375623', key: 'settings.color.green'     },
    { hex: '7B241C', key: 'settings.color.maroon'    },
    { hex: '5B2C6F', key: 'settings.color.purple'    },
    { hex: '3F464D', key: 'settings.color.darkGray'  },
    { hex: '0F6674', key: 'settings.color.teal'      },
    { hex: '000000', key: 'settings.color.black'     },
    { hex: 'E8E8E8', key: 'settings.color.lightGray' }
]);

const _HEX_RE = /^[0-9A-Fa-f]{6}$/;
const _validHex = (v, fallback) =>
    (typeof v === 'string' && _HEX_RE.test(v)) ? v.toUpperCase() : fallback;
const _validSize = (v, fallback) => {
    const n = Number(v);
    return (Number.isFinite(n) && n >= SIZE_MIN && n <= SIZE_MAX)
        ? Math.round(n) : fallback;
};

// ══════════════════════════════════════════════════════════════
//  contrastText() — black or white text over a given fill
//
//  WCAG relative luminance. This is what stops a dark navy table
//  header from being printed with black text on it. The exported
//  header cells always use this value, never the heading colour —
//  a heading colour chosen for a white page has no reason to be
//  readable on a coloured fill.
// ══════════════════════════════════════════════════════════════
export function contrastText(hex) {
    const h = _validHex(hex, 'E8E8E8');
    const chan = (i) => {
        const c = parseInt(h.substr(i, 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * chan(0) + 0.7152 * chan(2) + 0.0722 * chan(4);
    return L > 0.4 ? '000000' : 'FFFFFF';
}

// ══════════════════════════════════════════════════════════════
//  hexToRgb / tintHex
//
//  jsPDF takes colours as three 0–255 channels, not hex, so the
//  PDF export needs the split form. tintHex composites a colour
//  over white at the given alpha — jsPDF has no alpha channel, so
//  a lighter shade has to be computed rather than requested.
// ══════════════════════════════════════════════════════════════
export function hexToRgb(hex) {
    const h = _validHex(hex, '000000');
    return {
        r: parseInt(h.substr(0, 2), 16),
        g: parseInt(h.substr(2, 2), 16),
        b: parseInt(h.substr(4, 2), 16)
    };
}

export function tintHex(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    const mix = (c) => Math.round(c * alpha + 255 * (1 - alpha));
    return [mix(r), mix(g), mix(b)]
        .map(c => c.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

/* The duties banner in the PDF is drawn at this alpha over white so
   it reads as a lighter relative of the duty header bands beneath
   it, rather than a second solid block of the same colour. */
export const BANNER_ALPHA = 0.7;

// ══════════════════════════════════════════════════════════════
//  Read / write
//
//  Every field is validated on the way out, not on the way in, so
//  a hand-edited or half-written localStorage value degrades to
//  the default for that one field instead of breaking the export.
// ══════════════════════════════════════════════════════════════
export function getWordSettings() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch (e) { raw = null; }
    const s = (raw && typeof raw === 'object') ? raw : {};
    return {
        titleSize:       _validSize(s.titleSize,   WORD_DEFAULTS.titleSize),
        headingSize:     _validSize(s.headingSize, WORD_DEFAULTS.headingSize),
        bodySize:        _validSize(s.bodySize,    WORD_DEFAULTS.bodySize),
        headingColor:    _validHex(s.headingColor,    WORD_DEFAULTS.headingColor),
        tableHeaderFill: _validHex(s.tableHeaderFill, WORD_DEFAULTS.tableHeaderFill)
    };
}

export function saveWordSettings(patch) {
    const next = { ...getWordSettings(), ...(patch || {}) };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
        console.warn('[WordSettings] could not persist:', e);
    }
    return next;
}

export function resetWordSettings() {
    try { localStorage.removeItem(STORAGE_KEY); }
    catch (e) { console.warn('[WordSettings] could not clear:', e); }
    return { ...WORD_DEFAULTS };
}

// ══════════════════════════════════════════════════════════════
//  CARD COLOURS  (v4.12.0) — interface only
// ══════════════════════════════════════════════════════════════
const CARD_STORAGE_KEY = 'dacum_card_colors';

/* 'theme' = follow the active colour theme (factory behaviour). */
export const CARD_THEME = 'theme';
export const CARD_DEFAULTS = Object.freeze({ duty: CARD_THEME, task: CARD_THEME });

/* Eight mid-depth colours. Chosen so that:
     • the Wall View duty card keeps legible WHITE text on a
       gradient from the colour's deep shade to the colour itself;
     • the task card, drawn as a 22% tint with the colour as its
       border, stays a light card with dark readable text.
   Pure yellow/light tones are left out on purpose: they fail the
   first rule. */
export const CARD_SWATCHES = Object.freeze([
    { hex: '2563EB', name: 'blue'   },
    { hex: '0D9488', name: 'teal'   },
    { hex: '16A34A', name: 'green'  },
    { hex: 'D97706', name: 'amber'  },
    { hex: 'EA580C', name: 'orange' },
    { hex: 'E11D48', name: 'rose'   },
    { hex: '7C3AED', name: 'purple' },
    { hex: '475569', name: 'slate'  }
]);

const _CARD_HEXES = CARD_SWATCHES.map(s => s.hex);
const _validCard = (v) => {
    if (typeof v !== 'string') return CARD_THEME;
    const h = v.replace('#', '').toUpperCase();
    return _CARD_HEXES.includes(h) ? h : CARD_THEME;
};

/* Card-colour strings live here rather than in translations.js so
   the feature is self-contained: a stale cached translations.js
   during an update can never leave the section showing raw keys. */
const _CC_TEXT = {
    en: {
        group:      'Card colours',
        badge:      'Interface',
        note:       'Colours the duty and task cards in the Duties & Tasks tab. Works with any theme and does not change the exported files.',
        duty:       'Duty cards',
        task:       'Task cards',
        theme:      'Theme colour (default)',
        preview:    'Card preview',
        prevCard:   'Card view',
        prevWall:   'Wall view',
        dutyLabel:  'Duty A',
        dutyText:   'Plan the work',
        task1:      'Read the drawings',
        task2:      'Prepare the tools',
        exportNote: 'Export settings',
        saved:      'Settings saved ✓',
        blue: 'Blue', teal: 'Teal', green: 'Green', amber: 'Amber',
        orange: 'Orange', rose: 'Rose', purple: 'Purple', slate: 'Slate grey'
    },
    fr: {
        group:      'Couleurs des cartes',
        badge:      'Interface',
        note:       'Colore les cartes des fonctions et des tâches dans l\'onglet Fonctions et tâches. Fonctionne avec tous les thèmes et ne modifie pas les fichiers exportés.',
        duty:       'Cartes des fonctions',
        task:       'Cartes des tâches',
        theme:      'Couleur du thème (par défaut)',
        preview:    'Aperçu des cartes',
        prevCard:   'Vue en cartes',
        prevWall:   'Vue murale',
        dutyLabel:  'Fonction A',
        dutyText:   'Planifier le travail',
        task1:      'Lire les plans',
        task2:      'Préparer les outils',
        exportNote: 'Paramètres d\'export',
        saved:      'Paramètres enregistrés ✓',
        blue: 'Bleu', teal: 'Sarcelle', green: 'Vert', amber: 'Ambre',
        orange: 'Orange', rose: 'Rose', purple: 'Violet', slate: 'Gris ardoise'
    },
    ar: {
        group:      'ألوان البطاقات',
        badge:      'الواجهة',
        note:       'تلوّن بطاقات الواجبات والمهام في تبويب الواجبات والمهام. تعمل مع أي ثيم، ولا تغيّر الملفات المُصدَّرة.',
        duty:       'بطاقات الواجبات',
        task:       'بطاقات المهام',
        theme:      'لون الثيم (الافتراضي)',
        preview:    'معاينة البطاقات',
        prevCard:   'عرض البطاقات',
        prevWall:   'عرض الجدار',
        dutyLabel:  'الواجب A',
        dutyText:   'تخطيط العمل',
        task1:      'قراءة المخططات',
        task2:      'تجهيز الأدوات',
        exportNote: 'إعدادات التصدير',
        saved:      'تم حفظ الإعدادات ✓',
        blue: 'أزرق', teal: 'فيروزي', green: 'أخضر', amber: 'كهرماني',
        orange: 'برتقالي', rose: 'وردي', purple: 'بنفسجي', slate: 'رمادي أردوازي'
    }
};

function _cc(key) {
    let lang = 'en';
    try { lang = (typeof getLang === 'function' && getLang()) || 'en'; } catch (e) { /* default */ }
    const dict = _CC_TEXT[lang] || _CC_TEXT.en;
    return dict[key] ?? _CC_TEXT.en[key] ?? key;
}

export function getCardColors() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(CARD_STORAGE_KEY) || 'null'); }
    catch (e) { raw = null; }
    const s = (raw && typeof raw === 'object') ? raw : {};
    return { duty: _validCard(s.duty), task: _validCard(s.task) };
}

/* Token values for one choice. Theme → the theme's own tokens, so
   the preview can use the same function for both cases. */
function _cardTokens(c) {
    const d = c.duty === CARD_THEME ? null : '#' + c.duty;
    const k = c.task === CARD_THEME ? null : '#' + c.task;
    return {
        duty:     d || 'var(--brand-primary)',
        dutyDeep: d ? `color-mix(in srgb, ${d} 72%, black)` : 'var(--brand-primary-deep)',
        task:     k || 'var(--brand-accent)',
        taskDark: k ? `color-mix(in srgb, ${k} 62%, black)` : 'var(--brand-accent-dark)',
        taskInk:  k ? `color-mix(in srgb, ${k} 62%, black)` : 'var(--brand-primary-deep)'
    };
}

const _CARD_PROPS = ['--card-duty', '--card-duty-deep', '--card-task', '--card-task-dark', '--card-task-ink'];

export function applyCardColors(colors) {
    const c = colors ? { duty: _validCard(colors.duty), task: _validCard(colors.task) }
                     : getCardColors();
    const root = document.documentElement;
    if (!root) return c;
    const tk = _cardTokens(c);

    /* Only a real pick is written inline. For 'theme' the inline
       property is REMOVED — writing var(--brand-…) inline would also
       work, but removal leaves <html> exactly as it was before this
       feature existed. */
    if (c.duty === CARD_THEME) {
        root.style.removeProperty('--card-duty');
        root.style.removeProperty('--card-duty-deep');
    } else {
        root.style.setProperty('--card-duty',      tk.duty);
        root.style.setProperty('--card-duty-deep', tk.dutyDeep);
    }
    if (c.task === CARD_THEME) {
        root.style.removeProperty('--card-task');
        root.style.removeProperty('--card-task-dark');
        root.style.removeProperty('--card-task-ink');
    } else {
        root.style.setProperty('--card-task',      tk.task);
        root.style.setProperty('--card-task-dark', tk.taskDark);
        root.style.setProperty('--card-task-ink',  tk.taskInk);
    }
    return c;
}

export function saveCardColors(colors) {
    const next = { duty: _validCard(colors?.duty), task: _validCard(colors?.task) };
    try {
        if (next.duty === CARD_THEME && next.task === CARD_THEME) {
            localStorage.removeItem(CARD_STORAGE_KEY);
        } else {
            localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(next));
        }
    } catch (e) {
        console.warn('[CardColors] could not persist:', e);
    }
    applyCardColors(next);
    return next;
}

/* Exported for completeness (self-check / console use). */
export { _CARD_PROPS as CARD_CSS_PROPS };

// ══════════════════════════════════════════════════════════════
//  Modal
//
//  Built fresh on every open rather than kept in index.html, so it
//  always renders in the language that is active at that moment —
//  no re-translation wiring, and no dead markup in the page.
// ══════════════════════════════════════════════════════════════
const MODAL_ID = 'wordSettingsModal';

/* Working copies — the modal edits these and only writes to storage
   when the user presses Save, so Close discards. */
let _draft = null;
let _cardDraft = null;

function _sizeSelect(id, value) {
    let opts = '';
    for (let n = SIZE_MIN; n <= SIZE_MAX; n++) {
        opts += `<option value="${n}"${n === value ? ' selected' : ''}>${n} pt</option>`;
    }
    return `<select id="${id}" class="ws-select">${opts}</select>`;
}

function _swatchRow(group, selected) {
    return SWATCHES.map(sw => {
        const on = sw.hex === selected;
        return `<button type="button" class="ws-swatch${on ? ' ws-swatch--on' : ''}"
                        data-group="${group}" data-hex="${sw.hex}"
                        style="background:#${sw.hex}"
                        title="${t(sw.key)}" aria-label="${t(sw.key)}"
                        aria-pressed="${on ? 'true' : 'false'}"></button>`;
    }).join('');
}

/* Card swatches: one "Theme" chip first (painted with the live theme
   token, so it always shows what "default" means right now), then the
   eight colours. Separate data attribute from the export swatches so
   the two click handlers can never cross-write. */
function _cardSwatchRow(group, selected) {
    const themeToken = group === 'duty' ? 'var(--brand-primary)' : 'var(--brand-accent)';
    const themeOn = selected === CARD_THEME;
    const themeBtn = `<button type="button" class="ws-swatch ws-swatch--theme${themeOn ? ' ws-swatch--on' : ''}"
                        data-card-group="${group}" data-card-hex="${CARD_THEME}"
                        style="--ws-theme-chip:${themeToken}"
                        title="${_cc('theme')}" aria-label="${_cc('theme')}"
                        aria-pressed="${themeOn ? 'true' : 'false'}"></button>`;
    const colours = CARD_SWATCHES.map(sw => {
        const on = sw.hex === selected;
        return `<button type="button" class="ws-swatch${on ? ' ws-swatch--on' : ''}"
                        data-card-group="${group}" data-card-hex="${sw.hex}"
                        style="background:#${sw.hex}"
                        title="${_cc(sw.name)}" aria-label="${_cc(sw.name)}"
                        aria-pressed="${on ? 'true' : 'false'}"></button>`;
    }).join('');
    return themeBtn + '<span class="ws-swatch-sep" aria-hidden="true"></span>' + colours;
}

function _badges(list) {
    return '<span class="ws-badges">' +
        list.map(b => {
            const label = b === 'word' ? 'Word' : b === 'pdf' ? 'PDF' : _cc('badge');
            return `<span class="ws-badge ws-badge--${b}">${label}</span>`;
        }).join('') +
        '</span>';
}

/* Mini preview of the cards, drawn with the draft's own tokens as
   local custom properties — so it previews the pick without touching
   the live cards until Save. The markup mirrors the real card view
   (duty column + task cards) and the wall view (gradient duty card
   + light task note) at reduced scale. */
function _cardPreview(c) {
    const tk = _cardTokens(c);
    const vars = `--pv-duty:${tk.duty};--pv-duty-deep:${tk.dutyDeep};` +
                 `--pv-task:${tk.task};--pv-task-dark:${tk.taskDark};--pv-task-ink:${tk.taskInk}`;
    return `
        <div class="ws-cc-preview" style="${vars}">
            <div class="ws-cc-tag">${_cc('prevCard')}</div>
            <div class="ws-cc-row ws-cc-row--card">
                <div class="ws-cc-duty">
                    <span class="ws-cc-duty-label">${_cc('dutyLabel')}</span>
                    <span class="ws-cc-duty-text">${_cc('dutyText')}</span>
                </div>
                <div class="ws-cc-task">
                    <span class="ws-cc-task-label">A1</span>
                    <span class="ws-cc-task-text">${_cc('task1')}</span>
                </div>
                <div class="ws-cc-task">
                    <span class="ws-cc-task-label">A2</span>
                    <span class="ws-cc-task-text">${_cc('task2')}</span>
                </div>
            </div>

            <div class="ws-cc-tag">${_cc('prevWall')}</div>
            <div class="ws-cc-row ws-cc-row--wall">
                <div class="ws-cc-wduty">
                    <span class="ws-cc-wduty-label">${_cc('dutyLabel')}</span>
                    <span class="ws-cc-wduty-text">${_cc('dutyText')}</span>
                </div>
                <div class="ws-cc-wtask">
                    <span class="ws-cc-wtask-label">A1</span>
                    <span class="ws-cc-wtask-text">${_cc('task1')}</span>
                </div>
                <div class="ws-cc-wtask">
                    <span class="ws-cc-wtask-label">A2</span>
                    <span class="ws-cc-wtask-text">${_cc('task2')}</span>
                </div>
            </div>
        </div>`;
}

function _render() {
    const el = document.getElementById(MODAL_ID);
    if (!el) return;
    const s = _draft;
    const c = _cardDraft;
    const bannerHex = tintHex(s.tableHeaderFill, BANNER_ALPHA);

    /* Keep the scroll position: every swatch click re-renders the
       body, and jumping back to the top would hide the preview the
       user is looking at. */
    const body = el.querySelector('.ws-body');
    const keepScroll = body.scrollTop;

    body.innerHTML = `
        <!-- ── Card colours: interface only (v4.12.0) ───────── -->
        <section class="ws-section ws-section--cards">
            <h4 class="ws-section-title">
                <span>${_cc('group')}</span>
                ${_badges(['ui'])}
            </h4>
            <p class="ws-hint ws-hint--lead">${_cc('note')}</p>

            <div class="ws-group">
                <div class="ws-label">${_cc('duty')}</div>
                <div class="ws-swatches">${_cardSwatchRow('duty', c.duty)}</div>
            </div>

            <div class="ws-group">
                <div class="ws-label">${_cc('task')}</div>
                <div class="ws-swatches">${_cardSwatchRow('task', c.task)}</div>
            </div>

            ${_cardPreview(c)}
        </section>

        <p class="ws-note">${t('settings.scopeNote')}</p>

        <!-- ── Colours: both formats ──────────────────────── -->
        <section class="ws-section">
            <h4 class="ws-section-title">
                <span>${t('settings.groupColors')}</span>
                ${_badges(['word', 'pdf'])}
            </h4>

            <div class="ws-group">
                <div class="ws-label">${t('settings.headingColor')}</div>
                <div class="ws-swatches">${_swatchRow('headingColor', s.headingColor)}</div>
            </div>

            <div class="ws-group">
                <div class="ws-label">${t('settings.tableHeaderFill')}</div>
                <div class="ws-swatches">${_swatchRow('tableHeaderFill', s.tableHeaderFill)}</div>
                <p class="ws-hint">${t('settings.contrastNote')}</p>
                <p class="ws-hint">${t('settings.bannerNote')}</p>
            </div>
        </section>

        <!-- ── Sizes: Word only ───────────────────────────── -->
        <section class="ws-section">
            <h4 class="ws-section-title">
                <span>${t('settings.groupSizes')}</span>
                ${_badges(['word'])}
            </h4>

            <div class="ws-field">
                <label class="ws-label" for="wsTitleSize">${t('settings.titleSize')}</label>
                ${_sizeSelect('wsTitleSize', s.titleSize)}
            </div>
            <div class="ws-field">
                <label class="ws-label" for="wsHeadingSize">${t('settings.headingSize')}</label>
                ${_sizeSelect('wsHeadingSize', s.headingSize)}
            </div>
            <div class="ws-field">
                <label class="ws-label" for="wsBodySize">${t('settings.bodySize')}</label>
                ${_sizeSelect('wsBodySize', s.bodySize)}
            </div>
            <p class="ws-hint ws-hint--why">${t('settings.sizeScopeNote')}</p>
        </section>

        <!-- ── Preview ────────────────────────────────────── -->
        <section class="ws-section">
            <h4 class="ws-section-title"><span>${t('settings.preview')}</span></h4>

            <div class="ws-preview">
                <div class="ws-preview-tag">Word</div>
                <div class="ws-preview-title"
                     style="color:#${s.headingColor};font-size:${s.titleSize}pt">${t('settings.previewTitle')}</div>
                <div class="ws-preview-heading"
                     style="color:#${s.headingColor};font-size:${s.headingSize}pt">${t('settings.previewHeading')}</div>
                <div class="ws-preview-th"
                     style="background:#${s.tableHeaderFill};color:#${contrastText(s.tableHeaderFill)};font-size:${s.headingSize}pt">${t('settings.previewTableHeader')}</div>
                <div class="ws-preview-body"
                     style="font-size:${s.bodySize}pt">${t('settings.previewBody')}</div>
            </div>

            <div class="ws-preview">
                <div class="ws-preview-tag">PDF</div>
                <div class="ws-preview-banner"
                     style="background:#${bannerHex};color:#${contrastText(bannerHex)}">${t('settings.previewHeading2')}</div>
                <div class="ws-preview-th"
                     style="background:#${s.tableHeaderFill};color:#${contrastText(s.tableHeaderFill)}">${t('settings.previewTableHeader')}</div>
                <div class="ws-preview-body">${t('settings.previewBody')}</div>
                <div class="ws-preview-heading" style="color:#${s.headingColor};margin-top:8px">${t('settings.previewHeading')}</div>
            </div>
        </section>
    `;

    body.scrollTop = keepScroll;

    el.querySelectorAll('.ws-select').forEach(sel => {
        sel.addEventListener('change', () => {
            if (sel.id === 'wsTitleSize')   _draft.titleSize   = Number(sel.value);
            if (sel.id === 'wsHeadingSize') _draft.headingSize = Number(sel.value);
            if (sel.id === 'wsBodySize')    _draft.bodySize    = Number(sel.value);
            _render();
        });
    });

    /* Export swatches only — the card swatches carry data-card-group
       instead of data-group, so this selector never matches them. */
    el.querySelectorAll('.ws-swatch[data-group]').forEach(btn => {
        btn.addEventListener('click', () => {
            _draft[btn.dataset.group] = btn.dataset.hex;
            _render();
        });
    });

    el.querySelectorAll('.ws-swatch[data-card-group]').forEach(btn => {
        btn.addEventListener('click', () => {
            _cardDraft[btn.dataset.cardGroup] = _validCard(btn.dataset.cardHex);
            _render();
            /* Return focus to the same chip so keyboard users are not
               thrown back to the top of the modal after each pick. */
            el.querySelector(
                `.ws-swatch[data-card-group="${btn.dataset.cardGroup}"][data-card-hex="${btn.dataset.cardHex}"]`
            )?.focus();
        });
    });
}

function _buildShell() {
    const wrap = document.createElement('div');
    wrap.id = MODAL_ID;
    wrap.className = 'ws-overlay';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML = `
        <div class="ws-panel" role="document">
            <div class="ws-head">
                <span class="ws-title">${t('settings.modalTitle')}</span>
                <button type="button" class="ws-x" data-ws-close
                        title="${t('settings.close')}" aria-label="${t('settings.close')}">✕</button>
            </div>
            <div class="ws-body"></div>
            <div class="ws-foot">
                <button type="button" class="ws-btn ws-btn--ghost" data-ws-reset>${t('settings.reset')}</button>
                <span class="ws-foot-spacer"></span>
                <button type="button" class="ws-btn ws-btn--ghost" data-ws-close>${t('settings.close')}</button>
                <button type="button" class="ws-btn ws-btn--primary" data-ws-save>${t('settings.save')}</button>
            </div>
        </div>
    `;

    wrap.addEventListener('click', (e) => {
        if (e.target === wrap) closeWordSettings();
    });
    wrap.querySelectorAll('[data-ws-close]').forEach(b =>
        b.addEventListener('click', closeWordSettings));
    wrap.querySelector('[data-ws-reset]').addEventListener('click', () => {
        _draft = { ...WORD_DEFAULTS };
        _cardDraft = { ...CARD_DEFAULTS };
        _render();
    });
    wrap.querySelector('[data-ws-save]').addEventListener('click', () => {
        saveWordSettings(_draft);
        saveCardColors(_cardDraft);
        closeWordSettings();
        showStatus(_cc('saved'), 'success');
    });

    document.body.appendChild(wrap);
    return wrap;
}

function _onKey(e) {
    if (e.key === 'Escape') closeWordSettings();
}

export function openWordSettings() {
    closeWordSettings();
    _draft = getWordSettings();
    _cardDraft = getCardColors();
    _buildShell();
    _render();
    document.addEventListener('keydown', _onKey);
    document.getElementById(MODAL_ID)?.querySelector('.ws-x')?.focus();
}

export function closeWordSettings() {
    document.removeEventListener('keydown', _onKey);
    document.getElementById(MODAL_ID)?.remove();
    _draft = null;
    _cardDraft = null;
}

// ══════════════════════════════════════════════════════════════
//  initWordSettings() — wire the sidebar button + apply card colours
//
//  The button carries no data-tab, so it is deliberately NOT a
//  .sb-nav-item: the nav handler in events.js reads data-tab and
//  would clear the active tab if this were one of them.
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  Word export pre-flight  (v4.12.5)
//
//  exportToPDF() stops with alert() when the Occupation Title or Job
//  Title is empty. exportToWord() checked the same two fields but
//  reported through showStatus() — the in-page #status bar, which sits
//  near the bottom of the page and is usually off-screen when the user
//  presses the toolbar button. The Word click therefore looked like it
//  did nothing at all.
//
//  This guard runs in the CAPTURE phase on document, i.e. before the
//  button's inline onclick="exportToWord()". When a field is missing
//  it shows the SAME alert, with the SAME translated text and the SAME
//  test as the PDF path, and stops the click from reaching the export.
//  When both fields are filled it does nothing, so the export itself
//  is untouched. The field whose value is missing receives focus after
//  the alert is dismissed.
// ══════════════════════════════════════════════════════════════
function _wordExportGuard(e) {
    const btn = e.target && e.target.closest && e.target.closest('#btnExportWord');
    if (!btn || btn.disabled) return;
    const occ = document.getElementById('occupationTitle');
    const job = document.getElementById('jobTitle');
    if (!occ || !job) return;                       // let the export decide
    if (occ.value && job.value) return;             // same test as exportToPDF()
    e.preventDefault();
    e.stopImmediatePropagation();
    alert(t('status.pdfMissingFields'));
    (occ.value ? job : occ).focus?.();
}

export function initWordSettings() {
    applyCardColors();
    if (!document.documentElement.dataset.wordGuard) {
        document.documentElement.dataset.wordGuard = '1';
        document.addEventListener('click', _wordExportGuard, true);
    }
    const btn = document.getElementById('sbWordSettingsBtn');
    if (btn && !btn.dataset.wsBound) {
        btn.dataset.wsBound = '1';
        btn.addEventListener('click', openWordSettings);
    }
}

/* Apply the stored card colours as soon as this module is evaluated
   — before app.js renders a single card — so a saved colour never
   flashes the theme colour first. Guarded: a failure here must not
   stop the module from loading. */
try { if (typeof document !== 'undefined') applyCardColors(); }
catch (e) { console.warn('[CardColors] early apply failed:', e); }
