// ============================================================
// analytics.js — anonymous usage counts (GoatCounter)
// Sends only an event NAME (e.g. "export_pdf"). Never any project
// content, names or personal data. Active on the live site only:
// localhost and the automated tests send nothing.
// ============================================================
const LIVE_HOST = 'hshamjawad.github.io';
const ALLOWED = new Set([
    'new_project', 'export_pdf', 'export_word', 'export_json',
    'language_ar', 'language_en', 'language_fr', 'wall_view', 'agree'
]);

export function trackEvent(name) {
    try {
        if (location.hostname !== LIVE_HOST || !ALLOWED.has(name)) return;
        if (window.goatcounter && typeof window.goatcounter.count === 'function') {
            window.goatcounter.count({ path: 'event/' + name, title: name, event: true });
        }
    } catch (_) { /* counting must never break the app */ }
}
