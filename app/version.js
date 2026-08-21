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
export const APP_VERSION  = '4.8.3';        // Semantic Versioning
export const APP_RELEASED = '2026-08-19';   // ISO 8601 (YYYY-MM-DD)

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
            version: '4.8.3',
            date: '2026-08-19',
            changes: [
                'Wall View toolbar now spreads across the full width instead of bunching at one end and leaving the other half empty above the cards',
                'Cause: margin-inline-start:auto sat on the view tabs inside a container carrying flex:1, so when the title is hidden in the narrow range the container held only the tabs and the auto margin swallowed its entire width, pushing tabs and controls together to one side',
                'The nav group no longer stretches, and the auto margin moved to the controls group, so tabs sit at the start of the bar above the cards and tools sit at the end',
                'Verified in both directions and with the title shown and hidden',
            ]
        },
        {
            version: '4.8.2',
            date: '2026-08-19',
            changes: [
                'Wall View toolbar now mirrors correctly in Arabic — there was not a single RTL rule for it, and the DOM order had been written left-to-right, so the sequence read backwards in Arabic',
                'Controls reordered by frequency then severity: zoom, reset, print, fullscreen, then exit last, with a separator isolating it',
                'Exit sits at the far end of the strip in both directions because the order is logical rather than positional — the browser mirrors it, so no left/right values are pinned',
                'Moving exit away from the repeatedly-pressed zoom buttons reduces accidental presses that drop the user out of the view',
                'The zoom group stays locked to LTR: minus, 100%, plus is a mathematical progression, not text, and flipping it would put + on the left in Arabic against the universal convention',
                'The separator is hidden on narrow screens where it could wrap onto its own line as a floating stray rule',
            ]
        },
        {
            version: '4.8.1',
            date: '2026-08-19',
            changes: [
                'Wall View toolbar collapses to a single row on wide screens, freeing ~44px of vertical space — height is the scarce resource in Wall View, especially in fullscreen',
                'The two rows were hard-coded via flex-direction:column, so this was a deliberate layout rather than wrapping caused by narrow space',
                'The breakpoint is computed, not guessed: the controls plus tabs measure ~1187px with full Arabic labels, so the merge starts at 1150px with compacted labels and full labels return at 1400px',
                'Between 1150 and 1399px the title is hidden and labels shrink — the active tab already shows where the user is, and "Exit fullscreen" alone costs ~160px',
                'Narrow screens keep the two-row layout: seven controls cannot fit on one line there, and merging would produce worse wrapping than two tidy rows',
            ]
        },
        {
            version: '4.8.0',
            date: '2026-08-19',
            changes: [
                'The error reporter is now completely silent for users — errors are logged in the background with no toast, no badge, and no DOM elements created at all',
                'Showing a code like ERR-A0BA to a trainer mid-workshop was the wrong call: they cannot act on it, and they assume their work is lost when in most cases the tool carries on working fine',
                'console.error is only intercepted in developer mode; a third-party library warning or a failed image request was producing log noise that buried the real failures',
                'Diagnostics surface only via ?debug in the URL or DacumErrors.open() from the console',
                'Added a Copy diagnostic report button in the Help tab that bundles the self-check results and the error log into one block of text, with an execCommand fallback so it works outside secure contexts',
                'The only interruption a user ever sees remains the storage-full warning, which is a real data-loss risk and is worded plainly rather than as an error code',
            ]
        },
        {
            version: '4.7.4',
            date: '2026-08-19',
            changes: [
                'Buttons pressed during boot no longer throw ReferenceError — <script type="module"> is deferred by nature, so all 64 inline onclick buttons are drawn and clickable before app.js defines their functions',
                'boot-bridge.js queues any such early click and replays it in order once app.js signals readiness, so the press is delayed by a fraction of a second instead of being lost',
                'The window is normally tiny but widens on a cold boot, a slow connection, or right after a cache purge and reload — which is exactly when it was hit',
                'The deferred list is explicit rather than a catch-all proxy: swallowing every undefined name would turn real typos and deleted functions into silence',
                'A function still missing after boot is reported as a genuine error, and a 12-second timeout flags an app.js that never finished initialising',
            ]
        },
        {
            version: '4.7.3',
            date: '2026-08-19',
            changes: [
                'Fixed the update loop at its root: index.html registered ./sw.js?v=${APP_VERSION} where APP_VERSION came from a CACHED version.js, so the old page registered the old worker, which rebuilt the old cache name and kept serving old files — an update could never succeed, and only Ctrl+Shift+R broke out because it bypasses the service worker entirely',
                'version.js is now fetched from the network before registration, so the version number comes from the server rather than from the cache it is supposed to refresh',
                'When the server version differs from the loaded page, DACUM caches are purged and the page reloads once, guarded by sessionStorage so it can never loop',
                'sw.js now serves index.html and version.js network-first with cache:reload, keeping the cached copies as an offline fallback only',
                'updateViaCache:none only ever protected sw.js itself, never index.html or version.js — which is why the loop survived it',
                'self-check.js gained a version.fresh check comparing the loaded page against what the server actually serves',
            ]
        },
        {
            version: '4.7.2',
            date: '2026-08-19',
            changes: [
                'Error cards now show the context passed with the report — it was being stored and never rendered, so a SelfCheck card said "1 broken link" without naming which link, which is exactly what the screenshot needs to be useful',
                'The toast now leads with the first failure instead of the bare count',
                'SelfCheck no longer raises a card for transient states during an incomplete update: a stale cached translations.js makes new keys look missing, and that is a reload away, not a broken link',
                'The Cairo check now waits for document.fonts.ready instead of judging at 800ms, which was producing a false card on slow boots',
                'update.guard downgraded to a warning — it reports an update problem, not a broken link in the code',
            ]
        },
        {
            version: '4.7.1',
            date: '2026-08-19',
            changes: [
                'Storage sizes now use the right units per language — KB/MB in English, Ko/Mo in French, ك.ب/م.ب in Arabic; they had been hard-coded in Arabic inside the formatter instead of going through the translation system like every other string',
                'The forced panel (DacumStorage.check) no longer claims storage is filling up when it is at 0% — it shows a neutral usage title, and the export and prune buttons only appear once the 75% threshold is actually crossed',
                'An empty breakdown box now says so instead of rendering as a blank rounded rectangle',
            ]
        },
        {
            version: '4.7.0',
            date: '2026-08-19',
            changes: [
                'Added a storage meter with two event-driven thresholds at 75% and 90% — nothing is shown below 75%, and each threshold notifies once per session so the warning never becomes furniture',
                'The threshold is 75% rather than 95% because a localStorage write is atomic: it does not fill gradually, so the jump from 94% to failure happens in a single operation and a 95% warning arrives one step too late',
                'The notice shows a breakdown rather than a bare percentage — measured on three realistic projects, undo snapshots took 94% of the space and logos 6%, so knowing the split is what makes the warning actionable',
                'Two concrete actions offered: export the project to a file, or clear the undo history of inactive projects, which frees the most and never touches chart data',
                'getStorageStats() now returns a per-category breakdown and identifies the heaviest project',
            ]
        },
        {
            version: '4.6.1',
            date: '2026-08-19',
            changes: [
                'The update banner no longer sticks on "Updating…" — canReload() compared the stored stamp against APP_VERSION, which is the CURRENTLY LOADED version and changes after every successful update, so the guard was inverted',
                'It allowed the reload loop it was written to prevent (stamp 4.5.9 vs page 4.6.0 never matched) and suppressed the legitimate retry (same version on a failed handover), leaving the button disabled with no way out',
                'The guard now counts attempts inside a time window instead of matching versions, and an explicit user tap bypasses it up to a hard limit of three',
                'The safety-net timeout is marked as user-initiated — it previously went through the guard as if it were an automatic update and was suppressed',
                'An 8-second timeout restores the banner to a usable state instead of leaving a dead button, with a new update.stuck message in all three languages',
                'self-check.js gained an update.guard check that flags a stale stamp from an incomplete update',
            ]
        },
        {
            version: '4.6.0',
            date: '2026-08-19',
            changes: [
                'Added self-check.js — a boot-time check of the links BETWEEN files, which is where every bug in this project actually lived: a shaping engine with no caller, a cached font with no @font-face, a translation key with no element, a CSS rule silently outweighing another',
                'None of those threw an exception, which is why they survived several releases unnoticed and needed a manual review to find',
                'Each check documents a failure that really happened; it is silent when everything is wired and raises an error card the moment a link breaks',
                'Warnings stay in the console and never raise a card, so the user does not learn to ignore them',
                'Open index.html?selfcheck for the full table, or call DacumSelfCheck.report() for a copyable summary',
            ]
        },
        {
            version: '4.5.9',
            date: '2026-08-19',
            changes: [
                'Cairo now applies inside text boxes and input fields — a leftover Segoe UI/Tahoma rule in the index.html <style> block tied on specificity with the Cairo rule and won by source order, since <style> comes after <link>',
                'That rule is deleted at source rather than out-weighed, and the input rules in arabic-ui.css are now explicit instead of wrapped in :where(), which contributed zero specificity',
                'Removed 6 KB of dead CSS: the old knowledge/skills and behaviour list styles, the retired button variants, the history bar, the info box and the collapsed-sidebar leftovers',
                'Dynamically-built classes (cv-*, btn-add, btn-remove, btn-clear-section) were verified as live and kept — a static scan reports them as unused because design-system.js builds their names by concatenation',
                'i18n-patch.js deleted: an orphan file, imported nowhere, whose six chartInfo keys were already merged into translations.js in all three languages',
            ]
        },
        {
            version: '4.5.8',
            date: '2026-08-19',
            changes: [
                'The stranded sidebar on Android is fixed — rotating to landscape crossed the old 768px line into desktop mode, which added sb-sidebar-closed, and rotating back never removed it; in RTL that leftover class translated the panel -260px from right:0, into the screen instead of out of it',
                'The breakpoint is now device-aware: a phone stays in drawer mode in BOTH orientations, so the crossing that caused the bug no longer happens at all',
                'CSS declares the mode in --sb-mode and app.js reads it, so the old drift between @media (max-width:768px) and window.innerWidth <= 768 is structurally impossible',
                'Edge-swipe now works in Arabic — the gesture assumed the left edge unconditionally, so opening the drawer by swiping was impossible in RTL',
                'Sidebar no longer reacts to the Android keyboard or to the browser address bar hiding, both of which fired spurious resize events',
                'Added window.pmResetSidebar() as a manual escape hatch',
                'Error reporter installed: every silent failure now surfaces as a card with a short code, device state and the last six taps, so a screenshot is enough to diagnose it',
                'Help tab version footer restored — the element and its translation key were both missing, so it failed silently',
                'Removed toggleInfoBox and its six translation keys: the feature was removed from the UI long ago but the function stayed exposed on window and threw on any call',
                'manifest.json: icons no longer declare any and maskable on the same asset, which was cropping the logo on Android; lang is now ar and an id is declared',
            ]
        },
        {
            version: '4.5.7',
            date: '2026-08-19',
            changes: [
                'Logos are downscaled to 400px on the longest edge and re-encoded before storage — a scanned 1600x1100 logo drops from 204 KB to 7 KB, and this is the root cause behind the storage-full failures fixed in 4.5.6',
                'The logo is drawn at 30x20 mm in the PDF, which is 354x236 px at 300 DPI, so nothing above 400px was ever reaching any output',
                'Transparency is flattened onto white because exportToPDF passes the format to jsPDF as a hard-coded JPEG — a PNG data URL under that label would break the export',
                'Compression is skipped whenever it would produce a larger file, which happens with small flat-colour logos that PNG already compresses well',
                'Any failure falls back to the original image: an oversized logo is better than a logo that cannot be uploaded',
                'Uploading a logo now triggers a save — the upload path bypasses the command system, so the logo previously lived in memory only until the next unrelated save',
            ]
        },
        {
            version: '4.5.6',
            date: '2026-08-19',
            changes: [
                'Silent data loss fixed — persistProjects() swallowed QuotaExceededError with a console.warn, so a full localStorage meant the user kept working against a store that was no longer being written, and lost the session on the next reload',
                'persistProjects() now returns true/false, and reports the failure through an injected handler so project-manager.js stays a pure data layer',
                'The alert fires once per broken streak, not once per save — the save hook runs after every state change, so an unlatched alert would have frozen the app behind a modal on every keystroke',
                'The latch resets after a successful write, so a later failure can report again',
                'New getStorageStats() exposes current usage for a future storage indicator',
            ]
        },
        {
            version: '4.5.5',
            date: '2026-08-19',
            changes: [
                'Arabic UI font restored — Cairo was cached by the service worker since 3.2.1 but no @font-face rule ever referenced it, so it was downloaded and never shown',
                'Arabic text direction fixed in duty and task cards — the contenteditable elements set neither direction nor text-align, so wrapped lines fell back to the left',
                'Latin terms and acronyms inside Arabic tasks now keep their own direction (unicode-bidi:plaintext), which matters for technical DACUM charts',
                'Card identifiers (A, B1, C3) are isolated LTR so they can never render reversed',
                'Arabic PDF export restored — the shaping layer had been lost when events.js regressed to a pre-4.3.0 copy',
                'All Arabic font and direction rules now live in one file, arabic-ui.css, so a partial loss during a manual merge becomes immediately visible instead of silent',
            ]
        },
        {
            version: '4.5.4',
            date: '2026-08-18',
            changes: [
                'Update bar on a phone: the label of the "Update now" button no longer breaks onto two lines — the button had flex-shrink but never white-space: nowrap',
                'The bar now uses an absolute font size instead of a relative one, because the installed PWA can inherit a smaller root size than a browser tab, which is why the same bar looked correct on the desktop',
                'On screens up to 560px the bar lays out as two lines: icon and message first, the two buttons underneath — no more squeezing four items into one narrow row',
                'On screens up to 360px "Update now" takes the full width of its line, and on landscape phones the bar stays a single compact row',
                'The bar keeps clear of the iOS home-indicator strip via env(safe-area-inset-bottom)',
                'All of this lives in components.css and overrides the inline styles of update-notifier.js — that file is untouched',
            ]
        },
        {
            version: '4.5.3',
            date: '2026-08-18',
            changes: [
                'The update bar works again — index.html had lost the line that loads update-notifier.js, so the whole module never ran',
                'Root cause of the stale footer: with that module absent, nothing ever replaced the version number written into the page, which is why it read 3.1.0 no matter how often the version was bumped',
                'The service worker is registered as sw.js?v=<version> again — the old plain URL never changed, so the browser had no reason to look for a new release',
                'Added the version badge back to the toolbar; it turns into an "Update" button when a release is waiting, so pressing "Later" does not lose the offer',
                'The notifier now carries its own English, French and Arabic texts as a fallback, so the bar reads correctly even against an older translations.js',
                'The copyright line no longer carries data-i18n, which was overwriting the rendered version on every language change',
            ]
        },
        {
            version: '4.5.2',
            date: '2026-08-18',
            changes: [
                'The copyright line in the Help tab now always shows the version actually running — it was stuck at 3.1.0',
                'Three causes were fixed at once: the line is found by id or by class, a translation that still has the number baked in is rewritten, and an unresolved {{version}} token is filled',
                'The line is also protected from being overwritten afterwards — its data-i18n attribute is removed and a small observer repaints it if anything else touches it',
            ]
        },
        {
            version: '4.5.1',
            date: '2026-08-18',
            changes: [
                'Restored the mobile task-row layout that was lost during the 4.5.0 edits — on a portrait phone the task field had collapsed to a few characters again',
                'The text field is once more the widest element in the row: the grip is a narrow column, the label sizes to its own text, and the delete button is a square icon',
                'The block is now marked DO-NOT-DELETE in components.css so a future edit does not drop it a second time',
            ]
        },
        {
            version: '4.5.0',
            date: '2026-08-18',
            changes: [
                'Additional Information: each section now has bullet-list and numbered-list buttons that format the whole box in one tap',
                'Both list buttons toggle \u2014 tap again to strip the markers, or tap the other one to switch between bullets and numbering',
                'Blank lines are left alone and never numbered, so the spacing between groups of items survives formatting',
                'Additional Information: the Clear and Rename buttons swapped places, matching the layout used in DACUM Live Pro',
                'Rename is now an icon-only button on the same quiet surface as the list buttons, so the four tools read as one row',
                'Clear is now a soft-red icon button instead of a solid red block \u2014 still the obvious destructive action, minus the shouting in every section header',
                'The Clear button keeps its soft-red look under Theme 1 and Theme 2 instead of picking up the palette accent',
                'The new list buttons are icon-only and stay square on narrow screens instead of stretching like the text buttons',
                'List button tooltips are translated in Arabic, English and French',
                'Copyright line moved inside the Help tab \u2014 it no longer repeats at the bottom of every other tab',
            ]
        },
        {
            version: '4.4.3',
            date: '2026-08-16',
            changes: [
                'Card view in Arabic: the duty title now types right-to-left like the task cards did — one hardcoded text-align: left was overriding the interface direction',
                'It is now text-align: start, a logical value that follows the language instead of fighting it, so no separate RTL rule is needed',
                'Card view in Arabic: the sticky duty column now pins to the right edge, where the duty card actually sits — it was pinned left and drifted out of view when scrolling a row with many tasks',
                'Card view in Arabic: the duty card\u2019s rounded corners and drop shadow mirror with it, so the column no longer faces the wrong way',
                'Removed a dead APP_VERSION constant from app.js that was never read and had drifted three major versions behind this file',
            ]
        },
        {
            version: '4.4.2',
            date: '2026-08-16',
            changes: [
                'The update bar is reliable again — it now appears whenever a newer version is on the server, not only when the browser happens to announce one',
                'Added a version poll: version.js is read straight from the server every few minutes and on every return to the app, independently of the service worker',
                'Fixed the case that hid the bar on the last release — a worker already installing when the page finished loading was never watched',
                'The bar now names the incoming version, e.g. "a new version is available · v4.4.2"',
                'Nothing reloads on its own: the bar still waits for "Update now", and "Later" moves the offer to the toolbar badge',
            ]
        },
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
