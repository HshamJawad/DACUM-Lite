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
export const APP_VERSION  = '4.4.1';        // Semantic Versioning
export const APP_RELEASED = '2026-08-16';   // ISO 8601 (YYYY-MM-DD)

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
            version: '4.4.1',
            date: '2026-08-16',
            changes: [
                'Table view on a portrait phone: the task text field is now the widest element in the row instead of the narrowest',
                'The drag grip became a narrow column, the label sizes to its own text, and the delete button is a 38px square icon button',
                'The 20px list indent is dropped on small screens, and it uses a logical property so Arabic mirrors correctly',
                'Root cause of the stuck width: a flex item will not shrink past its intrinsic size, and for an input that is its default character width — min-width: 0 releases it',
                'The same rules apply to the Knowledge & Skills and Behaviour rows, which share the identical row structure',
                'Desktop and tablet layout is unchanged — every rule sits inside the 600px and 380px queries',
            ]
        },
        {
            version: '4.4.0',
            date: '2026-08-13',
            changes: [
                'Arabic PDF is correct — verified by generating a real PDF against the actual Cairo file and rendering it, not by reading console output',
                'Root cause: jsPDF runs TWO text processors, not one. Detaching the Arabic shaper left the BidiEngine on postProcessText still reordering every finished line back to logical order',
                'The BidiEngine is now told the truth about our input through its own documented options — visual in, visual out, same direction — so it returns the string untouched',
                'Cairo remains the export font; Arabic, Latin, numbers and mixed lines all render and wrap correctly, and the text stays selectable and copyable',
            ]
        },
        {
            version: '4.3.3',
            date: '2026-08-13',
            changes: [
                'The copyright line no longer sits under every tab — it now appears in the Help tab only, in all three languages',
                'Frees a strip of vertical space on the Info, Duties and Additional Information tabs',
            ]
        },
        {
            version: '4.3.2',
            date: '2026-08-13',
            changes: [
                'Arabic PDF: fixed the real cause — jsPDF 2.5.1 carries its own Arabic parser and re-shaped every line a second time, against the already-reversed letters',
                'Arabic PDF: that parser is now detached from the preProcessText event and from the width-measuring path for the duration of the export, then restored',
                'Arabic PDF: shaping, bidi and line wrapping are handled solely by arabic-font.js, so the output finally matches the Word export',
                'Arabic PDF: Cairo is the first font tried again — verified against the real Cairo file, every shaped character it produces has a drawable glyph',
                'Amiri stays as the automatic fallback for any font that lacks a form',
            ]
        },
        {
            version: '4.3.1',
            date: '2026-08-13',
            changes: [
                'Arabic PDF: letters no longer vanish — Cairo omits the isolated presentation forms, and jsPDF was silently dropping every character it could not map',
                'Arabic PDF: the font loader now reads the cmap out of the TTF it fetched and records exactly which glyphs that font can draw',
                'Arabic PDF: the shaper degrades gracefully against that list — medial to final, initial to isolated, isolated to the base letter — so no character is ever lost, whichever font is installed',
                'Arabic PDF: lam-alef falls back to two separate letters when a font carries no ligature glyph',
            ]
        },
        {
            version: '4.3.0',
            date: '2026-08-13',
            changes: [
                'PDF export: Arabic letters are now joined and read right-to-left — shaping and bidi are done in the app instead of relying on the PDF viewer',
                'PDF export: Latin words, acronyms and numbers stay left-to-right inside Arabic lines, and brackets are mirrored correctly',
                'PDF export: lam-alef ligatures and harakat are handled, and line wrapping is measured on the shaped text so cells no longer overflow',
                'PDF export: the chart is now laid out horizontally — one duty band per row with its task cells underneath, in all three languages',
                'PDF export: duty headers repeat after a page break, and a duty header is never left stranded at the foot of a page',
                'PDF export: Arabic pages mirror their columns and anchor every heading, list and cell to the right edge',
                'PDF export: the Arabic font loader now looks for Amiri, Cairo or Tajawal in ./fonts/ as well as the repo root',
            ]
        },
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
                'Sidebar: the collapse button now stays on the title row instead of dropping to a second line when collapsed',
                'Sidebar: removed the icon tile beside the app name',
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
