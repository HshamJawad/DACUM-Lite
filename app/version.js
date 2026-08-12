// ============================================================
// version.js — DACUM Lite Version Registry
// SINGLE SOURCE OF TRUTH for the application version.
//
// Bump APP_VERSION here and NOWHERE else. Everything below is
// derived from it, and the following consumers read it:
//
//   • sw.js          → CACHE_NAME, via the ?v= query string that
//                      index.html appends when registering the
//                      service worker.
//   • index.html     → version badge in the top toolbar
//                      (#versionBadge) and the version footer in
//                      the Help tab (#helpVersionFooter).
//   • translations.js→ 'copyright.main' via the {{version}} token.
//
// ── VERSIONING RULE (Semantic Versioning) ───────────────────
//   PATCH  4.2.0 → 4.2.1  bug fix, text change, styling tweak
//   MINOR  4.2.0 → 4.3.0  new feature, new tab, notable behaviour change
//   MAJOR  4.2.0 → 5.0.0  breaking change — project data shape or
//                         export file format
//
// ── CRITICAL ────────────────────────────────────────────────
//   ANY bump, however small, changes CACHE_VERSION. That is the
//   whole point: if the cache name does not change, the browser
//   keeps serving the old shell and the update banner never
//   appears. Never edit a shell file without bumping APP_VERSION.
// ============================================================

// ── The two constants that drive everything ──────────────────
export const APP_VERSION  = '4.2.3';        // Semantic Versioning
export const APP_RELEASED = '2026-08-12';   // ISO 8601 (YYYY-MM-DD)

// ── Derived: service-worker cache name ───────────────────────
// index.html registers  ./sw.js?v=<APP_VERSION>  and sw.js rebuilds
// this exact string from its own URL. Keep the two formats identical.
export const CACHE_VERSION = `dacum-lite-v${APP_VERSION}`;

// ── Derived: numeric parts (kept for programmatic comparisons) ─
const [_major, _minor, _patch] = APP_VERSION.split('.').map(Number);

export const VERSION = {
    major: _major,
    minor: _minor,
    patch: _patch,

    name:     'DACUM Lite',
    author:   'Husham Jawad Kadhim',
    released: APP_RELEASED,
    cache:    CACHE_VERSION,

    get full()    { return APP_VERSION; },
    get display() { return `${this.name} v${this.full}`; },
    get copyright() {
        return `© 2026 ${this.name} | by ${this.author} | Version ${this.full} | All Rights Reserved`;
    },

    changelog: [
        {
            version: '4.2.3',
            date: '2026-08-12',
            changes: [
                'Word export: Arabic text is now tagged ar-IQ, so Word stops marking every word as a spelling error',
                'Word export: paragraphs and table columns follow the interface language instead of being locked left-to-right',
                'Word export: Arial is set as the document font so Arabic glyphs never fall back to boxes',
                'Word export: Arabic file names are preserved instead of being reduced to underscores',
                'Word export: the duty bar is light grey again — it was rendering as a solid black band',
                'Offline: the Arabic PDF font loader and its font files are now part of the cached shell',
            ]
        },
        {
            version: '4.2.1',
            date: '2026-08-11',
            changes: [
                'Added an update notification bar — the app never reloads on its own',
                'Centralised versioning: APP_VERSION drives the cache name, toolbar badge, Help footer and copyright',
                'Service worker now waits for explicit user consent before taking control',
                'Self-hosted Arabic font (Cairo) — no external font request',
            ]
        },
        {
            version: '4.1.0',
            date: '2026-05-05',
            changes: [
                'Renamed application to DACUM Lite',
                'Implemented DACUM standard numbering: Duty A, B, C… / Task A1, A2, B1, B2…',
                'Added drag-and-drop for task cards — move within same duty or across duties',
                'Added drag-and-drop for duty rows — reorder duties up/down',
                'Auto-renaming of duties and tasks after every reorder',
                'New version.js module for centralised version management',
            ]
        },
        {
            version: '4.0.0',
            date: '2026-07-25',
            changes: [
                'Initial public release as DACUM Chart Generator',
                'Multi-project support with sidebar',
                'Card view and table view',
                'PDF and Word export',
                'Undo / Redo with snapshot versioning',
            ]
        }
    ]
};

export default VERSION;
