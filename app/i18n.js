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
//  Toggle-button label helper
//  The sidebar button shows the code of the NEXT language in the
//  cycle (e.g. while in English it shows "FR" — "press to switch
//  to French"), matching the previous EN⇄AR behaviour, now
//  extended to three languages.
// ══════════════════════════════════════════════════════════════
function _nextLangCode() {
    const idx  = LANG_ORDER.indexOf(_lang);
    const next = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    return next.toUpperCase();
}

function _updateToggleBtnLabel() {
    const btn = document.getElementById('langToggleBtn');
    if (btn) btn.textContent = _nextLangCode();
}

// ══════════════════════════════════════════════════════════════
//  setLang() — switch language, persist, update DOM
// ══════════════════════════════════════════════════════════════
export function setLang(lang) {
    if (!LANG_ORDER.includes(lang)) return;   // guard
    _lang = lang;
    localStorage.setItem(LANG_KEY, lang);

    // Update <html> attributes for RTL support and browser accessibility
    const html = document.documentElement;
    html.lang = lang;
    html.dir  = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

    // Translate every data-i18n* element in the DOM
    applyTranslations();

    // Update the toggle button label
    _updateToggleBtnLabel();

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
//  3. Sets the toggle button label
//  4. Wires the toggle button click handler
// ══════════════════════════════════════════════════════════════
export function initI18n() {
    // Apply <html> attributes immediately (before paint if possible)
    const html = document.documentElement;
    html.lang  = _lang;
    html.dir   = RTL_LANGS.includes(_lang) ? 'rtl' : 'ltr';

    // Translate static DOM
    applyTranslations();

    // Wire toggle button
    const btn = document.getElementById('langToggleBtn');
    if (btn) {
        _updateToggleBtnLabel();
        btn.addEventListener('click', toggleLang);
    }
}
