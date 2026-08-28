// ============================================================
// word-settings.js — Word (.docx) Export Appearance Settings
//
// Scope: this module controls the LOOK OF THE EXPORTED FILES.
// It never touches the tool's own interface, project data, or
// any language-specific behaviour.
//
//   Colours → applied to BOTH the .docx and the .pdf export.
//   Sizes   → applied to the .docx export ONLY. The PDF is a
//             hand-laid-out landscape chart whose row heights,
//             cell padding and page-break maths are all derived
//             from a fixed 5.5mm line height; raising the font
//             there overlaps lines and spills text past the page
//             edge. Sizes stay Word-only until that geometry is
//             made size-aware, which is a separate job.
//
// The settings are global to the tool (one localStorage key),
// shared by all three languages, and applied identically to
// every export regardless of the language the file is produced
// in. They persist until the user changes them by hand.
//
// Public API:
//   getWordSettings()      → validated settings object
//   saveWordSettings(obj)  → merge + persist
//   resetWordSettings()    → back to WORD_DEFAULTS
//   contrastText(hex)      → '000000' | 'FFFFFF' for that fill
//   hexToRgb(hex)          → { r, g, b }
//   tintHex(hex, alpha)    → hex of that colour at `alpha` over white
//   initWordSettings()     → wire the sidebar button (once)
//   openWordSettings()     → open the modal
//   closeWordSettings()    → close the modal
// ============================================================

import { t } from './i18n.js';
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
//  Modal
//
//  Built fresh on every open rather than kept in index.html, so it
//  always renders in the language that is active at that moment —
//  no re-translation wiring, and no dead markup in the page.
// ══════════════════════════════════════════════════════════════
const MODAL_ID = 'wordSettingsModal';

/* Working copy — the modal edits this and only writes to storage
   when the user presses Save, so Close discards. */
let _draft = null;

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

function _badges(list) {
    return '<span class="ws-badges">' +
        list.map(b => `<span class="ws-badge ws-badge--${b}">${b === 'word' ? 'Word' : 'PDF'}</span>`).join('') +
        '</span>';
}

function _render() {
    const el = document.getElementById(MODAL_ID);
    if (!el) return;
    const s = _draft;
    const bannerHex = tintHex(s.tableHeaderFill, BANNER_ALPHA);

    el.querySelector('.ws-body').innerHTML = `
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

    el.querySelectorAll('.ws-select').forEach(sel => {
        sel.addEventListener('change', () => {
            if (sel.id === 'wsTitleSize')   _draft.titleSize   = Number(sel.value);
            if (sel.id === 'wsHeadingSize') _draft.headingSize = Number(sel.value);
            if (sel.id === 'wsBodySize')    _draft.bodySize    = Number(sel.value);
            _render();
        });
    });

    el.querySelectorAll('.ws-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
            _draft[btn.dataset.group] = btn.dataset.hex;
            _render();
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
        _render();
    });
    wrap.querySelector('[data-ws-save]').addEventListener('click', () => {
        saveWordSettings(_draft);
        closeWordSettings();
        showStatus(t('settings.saved'), 'success');
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
    _buildShell();
    _render();
    document.addEventListener('keydown', _onKey);
    document.getElementById(MODAL_ID)?.querySelector('.ws-x')?.focus();
}

export function closeWordSettings() {
    document.removeEventListener('keydown', _onKey);
    document.getElementById(MODAL_ID)?.remove();
    _draft = null;
}

// ══════════════════════════════════════════════════════════════
//  initWordSettings() — wire the sidebar button
//
//  The button carries no data-tab, so it is deliberately NOT a
//  .sb-nav-item: the nav handler in events.js reads data-tab and
//  would clear the active tab if this were one of them.
// ══════════════════════════════════════════════════════════════
export function initWordSettings() {
    const btn = document.getElementById('sbWordSettingsBtn');
    if (btn && !btn.dataset.wsBound) {
        btn.dataset.wsBound = '1';
        btn.addEventListener('click', openWordSettings);
    }
}
