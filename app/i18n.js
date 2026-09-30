// ============================================================
// i18n.js — Internationalisation Engine
// DACUM Lite v3.2  (adds French — EN / FR / AR)
//
// Public API:
//   getLang()           → 'en' | 'fr' | 'ar'
//   t(key, vars?)       → translated string with {{token}} replaced
//   setLang(lang)       → switch language, persist, update DOM
//   toggleLang()        → cycle EN → FR → AR → EN
//   initI18n()          → call once in DOMContentLoaded
//   applyTranslations() → re-apply all data-i18n* attributes
//
// HTML attribute conventions:
//   data-i18n="key"              → el.textContent = t(key)
//   data-i18n="key"
//     data-i18n-html="true"      → el.innerHTML   = t(key)   (for <strong> etc.)
//   data-i18n-placeholder="key"  → el.placeholder = t(key)
//   data-i18n-title="key"        → el.title       = t(key)
//   data-i18n-aria="key"         → el.ariaLabel   = t(key)
// ============================================================

import { translations } from './translations.js';
import { initToolbarFit } from './toolbar-fit.js';

// ── Persistence key ───────────────────────────────────────────
const LANG_KEY = 'dacum_lang';

// ── Supported languages & cycle order ──────────────────────────
// toggleLang()/the sidebar button step through this list in order.
// Only languages listed here are considered valid — an unrecognised
// or stale localStorage value silently falls back to 'en'.
const LANG_ORDER = ['en', 'fr', 'ar'];

// Languages that should render right-to-left. French, like English,
// is left-to-right, so only Arabic needs the 'rtl' treatment.
const RTL_LANGS = ['ar'];

// ── Active language (module-level) ────────────────────────────
// Initialised from localStorage so the stored preference
// is applied before the first applyTranslations() call.
let _lang = localStorage.getItem(LANG_KEY) || 'en';
if (!LANG_ORDER.includes(_lang)) _lang = 'en';   // guard against stale/unknown values

// ── Public: read current language ────────────────────────────
export function getLang() { return _lang; }

// ══════════════════════════════════════════════════════════════
//  t() — translate a key with optional interpolation
//
//  Lookup order:
//    1. translations[currentLang][key]
//    2. translations['en'][key]   ← silent fallback
//    3. key itself               ← last resort (never blank)
//
//  Interpolation: replace every {{token}} with vars[token].
//  Missing tokens are replaced with an empty string.
// ══════════════════════════════════════════════════════════════
export function t(key, vars = {}) {
    const dict = translations[_lang] ?? translations['en'];
    const str  = dict?.[key] ?? translations['en']?.[key] ?? key;
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? ''));
}

// ══════════════════════════════════════════════════════════════
//  applyTranslations() — walk the DOM and translate in place
//
//  Called after every language switch AND once at startup.
//  Touches only elements that carry a data-i18n* attribute —
//  user-entered content is never modified.
// ══════════════════════════════════════════════════════════════
export function applyTranslations() {

    // 1. Text content  (data-i18n)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.getAttribute('data-i18n-html') === 'true') {
            el.innerHTML = t(key);
        } else {
            el.textContent = t(key);
        }
    });

    // 2. Placeholder  (data-i18n-placeholder)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });

    // 3. Title tooltip  (data-i18n-title)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });

    // 4. Aria-label  (data-i18n-aria)
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });

    // 5. Smart section headings  (data-i18n-section)
    // These are contenteditable h3 elements — only translate if the user
    // has NOT renamed them (i.e. the current text still matches a known
    // default in ANY of the supported languages). If the user renamed
    // the heading, we leave it untouched.
    document.querySelectorAll('[data-i18n-section]').forEach(el => {
        const key = el.getAttribute('data-i18n-section');
        const cur = el.textContent.trim();
        const isStillDefault = LANG_ORDER.some(
            lang => (translations[lang]?.[key] ?? '') === cur
        );
        if (isStillDefault) {
            el.textContent = t(key);
        }
    });
}

// ══════════════════════════════════════════════════════════════
//  Language dropdown helper
//  The toolbar now uses a plain <select id="langSelect"> instead
//  of a cycling button — this just keeps its displayed value in
//  sync with the active language.
// ══════════════════════════════════════════════════════════════
function _syncLangSelect() {
    const sel = document.getElementById('langSelect');
    if (sel && sel.value !== _lang) sel.value = _lang;
    _syncLangDropdown();
}

// ══════════════════════════════════════════════════════════════
//  Custom language dropdown  (v4.12.4)
//
//  WHY the native <select> was replaced:
//    1. It carried .tb-btn, whose :hover lifts the control 1px with a
//       transform transition. The OS popup is anchored to the select,
//       so when the pointer moved from the select into the popup the
//       hover state dropped, the select slid back down, and the popup
//       was re-laid out — the visible shaking, plus a stale blank frame
//       left where the popup had been.
//    2. Chrome positions native <select> popups unreliably under
//       dir="rtl": the list opened offset to the side of the button.
//  A native popup cannot be styled or positioned, so neither problem
//  can be fixed with CSS.
//
//  The replacement is a button + listbox that WE position: the menu is
//  position:fixed and computed from the button's rectangle, aligned to
//  the button's start edge (right edge in Arabic, left edge otherwise),
//  clamped to the viewport. position:fixed also escapes the toolbar's
//  overflow-x:auto on phones, which would clip an absolute menu.
//
//  The original <select id="langSelect"> stays in the DOM (hidden) and
//  is kept in sync, so self-check and any other code that reads it keep
//  working.
// ══════════════════════════════════════════════════════════════
const LANG_NAMES = { en: 'English', fr: 'Français', ar: 'العربية' };
const LANG_SHORT = { en: 'EN',      fr: 'FR',       ar: 'ع'       };

let _dd = null;          // { root, btn, menu, items[] }

function _syncLangDropdown() {
    if (!_dd) return;
    _dd.btn.querySelector('.lang-dd-label').textContent = LANG_NAMES[_lang];
    _dd.btn.querySelector('.lang-dd-short').textContent = LANG_SHORT[_lang];
    _dd.items.forEach(li => {
        const on = li.dataset.lang === _lang;
        li.setAttribute('aria-selected', on ? 'true' : 'false');
        li.classList.toggle('lang-dd-opt--on', on);
    });
}

function _placeMenu() {
    const { btn, menu } = _dd;
    const r   = btn.getBoundingClientRect();
    const rtl = document.documentElement.dir === 'rtl';
    const vw  = document.documentElement.clientWidth;
    const w   = Math.max(r.width, menu.offsetWidth);

    menu.style.top      = Math.round(r.bottom + 4) + 'px';
    menu.style.minWidth = Math.round(r.width) + 'px';
    // Start-edge alignment, clamped inside an 8px viewport margin.
    let left = rtl ? r.right - w : r.left;
    left = Math.min(Math.max(8, left), vw - w - 8);
    menu.style.left  = Math.round(left) + 'px';
    menu.style.right = 'auto';
}

function _isOpen() { return !!_dd && !_dd.menu.hidden; }

function _openMenu(focusItem = true) {
    if (!_dd || _isOpen()) return;
    const { btn, menu, items } = _dd;
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    _dd.root.classList.add('lang-dd--open');
    _placeMenu();
    if (focusItem) (items.find(li => li.dataset.lang === _lang) || items[0]).focus();
    document.addEventListener('pointerdown', _onOutside, true);
    window.addEventListener('resize', _closeMenuQuiet);
    window.addEventListener('scroll', _closeMenuQuiet, true);
}

function _closeMenu(returnFocus = true) {
    if (!_isOpen()) return;
    const { btn, menu } = _dd;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    _dd.root.classList.remove('lang-dd--open');
    document.removeEventListener('pointerdown', _onOutside, true);
    window.removeEventListener('resize', _closeMenuQuiet);
    window.removeEventListener('scroll', _closeMenuQuiet, true);
    if (returnFocus) btn.focus();
}

function _closeMenuQuiet(e) {
    // Scrolling inside the menu itself must not close it.
    if (e && e.type === 'scroll' && _dd && _dd.menu.contains(e.target)) return;
    _closeMenu(false);
}

function _onOutside(e) {
    if (_dd && !_dd.root.contains(e.target) && !_dd.menu.contains(e.target)) _closeMenu(false);
}

function _choose(lang) {
    _closeMenu(true);
    if (lang !== _lang) {
        const sel = document.getElementById('langSelect');
        if (sel) sel.value = lang;
        setLang(lang);
    }
}

function _buildLangDropdown(sel) {
    if (!sel || document.getElementById('langDropdown')) return;

    const root = document.createElement('div');
    root.className = 'lang-dd';
    root.id = 'langDropdown';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tb-btn tb-btn--neutral lang-dd-btn';
    btn.title = sel.title || 'Interface language';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
        '<span class="lang-dd-label"></span>' +
        '<span class="lang-dd-short"></span>' +
        '<svg class="lang-dd-chev" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">' +
        '<path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    // The menu lives on <body>: position:fixed inside the toolbar would
    // still be clipped on browsers that treat a transformed ancestor as
    // the containing block, and body is never transformed.
    const menu = document.createElement('ul');
    menu.className = 'lang-dd-menu';
    menu.id = 'langDropdownMenu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    btn.setAttribute('aria-controls', menu.id);

    const items = LANG_ORDER.map(code => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.tabIndex = -1;
        li.dataset.lang = code;
        li.lang = code;
        li.dir  = RTL_LANGS.includes(code) ? 'rtl' : 'ltr';
        li.className = 'lang-dd-opt';
        li.textContent = LANG_NAMES[code];
        li.addEventListener('click', () => _choose(code));
        menu.appendChild(li);
        return li;
    });

    btn.addEventListener('click', () => (_isOpen() ? _closeMenu() : _openMenu()));
    btn.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); _openMenu(); }
    });

    menu.addEventListener('keydown', e => {
        const i = items.indexOf(document.activeElement);
        const move = n => { e.preventDefault(); items[(n + items.length) % items.length].focus(); };
        switch (e.key) {
            case 'ArrowDown': move(i + 1); break;
            case 'ArrowUp':   move(i - 1); break;
            case 'Home':      move(0); break;
            case 'End':       move(items.length - 1); break;
            case 'Enter':
            case ' ':         e.preventDefault(); if (i >= 0) _choose(items[i].dataset.lang); break;
            case 'Escape':    e.preventDefault(); _closeMenu(true); break;
            case 'Tab':       _closeMenu(false); break;
        }
    });

    root.appendChild(btn);
    sel.insertAdjacentElement('afterend', root);
    document.body.appendChild(menu);

    // Hide the native control but keep it for compatibility.
    sel.classList.add('lang-native-hidden');
    sel.setAttribute('aria-hidden', 'true');
    sel.tabIndex = -1;

    _dd = { root, btn, menu, items };
    _syncLangDropdown();
}

// ══════════════════════════════════════════════════════════════
//  No-animation window around a direction flip  (v4.12.3)
//
//  Flipping <html dir> changes properties that are ANIMATED for the
//  sidebar open/close (#appWrapper margin-left, .top-toolbar left,
//  #sidebar width, the phone drawer's transform). Left alone, the
//  page slid and squeezed for ~0.3s on every switch, and on phones
//  the closed drawer flew across the screen. .i18n-switching (see
//  the end of components.css) suspends transitions until the new
//  layout has been painted — two frames: one to apply the new
//  styles, one to paint them — then normal animations resume.
// ══════════════════════════════════════════════════════════════
let _switchTimer = null;

function _suspendTransitions() {
    const html = document.documentElement;
    html.classList.add('i18n-switching');
    if (_switchTimer) cancelAnimationFrame(_switchTimer);
    _switchTimer = requestAnimationFrame(() => {
        _switchTimer = requestAnimationFrame(() => {
            html.classList.remove('i18n-switching');
            _switchTimer = null;
        });
    });
}

// ══════════════════════════════════════════════════════════════
//  Cairo warm-up  (v4.12.3)
//
//  Cairo is declared with an Arabic unicode-range, so the browser
//  only downloads it the first time Arabic text is on screen. The
//  first switch to Arabic therefore laid the page out twice: once
//  in the fallback face, again when Cairo arrived — a second jolt
//  after the switch. Loading it in the background at start-up (from
//  the service-worker cache, normally) removes that second pass.
//  Best-effort: any failure is ignored.
// ══════════════════════════════════════════════════════════════
function _warmArabicFont() {
    try {
        if (!document.fonts || typeof document.fonts.load !== 'function') return;
        const go = () => document.fonts.load('16px Cairo', 'عربي').catch(() => {});
        if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 3000 });
        else setTimeout(go, 1500);
    } catch (e) { /* cosmetic only */ }
}

// ══════════════════════════════════════════════════════════════
//  setLang() — switch language, persist, update DOM
// ══════════════════════════════════════════════════════════════
export function setLang(lang) {
    if (!LANG_ORDER.includes(lang)) return;   // guard
    _lang = lang;
    localStorage.setItem(LANG_KEY, lang);

    // Freeze animations BEFORE the direction flips (see above)
    _suspendTransitions();

    // Update <html> attributes for RTL support and browser accessibility
    const html = document.documentElement;
    html.lang = lang;
    html.dir  = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

    // Translate every data-i18n* element in the DOM
    applyTranslations();

    // Keep the toolbar language dropdown showing the active language
    _syncLangSelect();

    // Notify dynamic renderers (e.g. renderSidebar in app.js) to re-render
    document.dispatchEvent(new CustomEvent('dacum:langchange'));
}

// ══════════════════════════════════════════════════════════════
//  toggleLang() — cycle EN → FR → AR → EN → …
// ══════════════════════════════════════════════════════════════
export function toggleLang() {
    const idx  = LANG_ORDER.indexOf(_lang);
    const next = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    setLang(next);
}

// ══════════════════════════════════════════════════════════════
//  initI18n() — call once inside DOMContentLoaded in app.js
//
//  1. Applies the stored language to <html> lang + dir
//  2. Runs applyTranslations() to translate the initial DOM
//  3. Wires the language dropdown (custom menu over the native select)
//  4. Warms up the Arabic font in the background
// ══════════════════════════════════════════════════════════════
export function initI18n() {
    // Apply <html> attributes immediately (before paint if possible)
    const html = document.documentElement;
    html.lang  = _lang;
    html.dir   = RTL_LANGS.includes(_lang) ? 'rtl' : 'ltr';

    // Translate static DOM
    applyTranslations();

    // Wire the language dropdown
    const sel = document.getElementById('langSelect');
    if (sel) {
        sel.value = _lang;
        sel.addEventListener('change', () => setLang(sel.value));
        try { _buildLangDropdown(sel); }
        catch (e) {
            // Fall back to the native select rather than lose the control.
            console.warn('[i18n] custom language dropdown failed:', e);
            sel.classList.remove('lang-native-hidden');
        }
    }

    if (_lang !== 'ar') _warmArabicFont();

    // Keep every toolbar button on screen (v4.12.8) — runs after the
    // language menu is built, since that menu is part of the row.
    try { initToolbarFit(); } catch (e) { console.warn('[i18n] toolbar fit failed:', e); }
}
