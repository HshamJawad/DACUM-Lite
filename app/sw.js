// ============================================================
// sw.js — DACUM Lite Service Worker (PWA)
// Strategy: NETWORK-FIRST for the app shell, cache is only the
// offline fallback.
//
// v3.2.0 change log:
//   • Switched app-shell strategy from cache-first to
//     network-first. Cache-first was serving stale files to
//     returning visitors indefinitely (only a hard-reload, which
//     bypasses the service worker entirely, ever showed updates).
//     Network-first fixes this permanently: online visitors
//     always get the latest deployed files, and the cache is
//     used only as a fallback when the network is unavailable.
//   • Bumped CACHE_NAME so the activate step purges the old
//     v3.1.0 cache on next load for every existing visitor.
//   • Added i18n.js and translations.js to the pre-cache list
//     (they were missing, so a first-ever offline visit could
//     fail to load them).
//   • Removed './version.js' — not part of the current file set.
//
// v3.2.1 change log:
//   • Added './fonts/Cairo.woff2' to the pre-cache list so the
//     self-hosted Arabic font is available offline (it replaces
//     the external Google Fonts request).
//   • Bumped CACHE_NAME accordingly.
//
// v4.2.0 change log:
//   • CACHE_NAME is no longer hard-coded. It is derived from the
//     ?v= query string that index.html appends when registering
//     this worker, so version.js is the single source of truth.
//     A version bump also changes this script's URL, which by
//     itself forces the browser to run an update check.
//   • REMOVED self.skipWaiting() from install. This is the core
//     behavioural fix: the previous code activated the new worker
//     immediately and claimed open pages, which is exactly what a
//     live workshop must never experience. The new worker now
//     stays in the "waiting" state until the user presses
//     "Update now", which posts a SKIP_WAITING message.
//   • Added a SW_UPDATED broadcast after activation so the page
//     can offer the switch (see update-notifier.js).
//   • Re-added './version.js' and added './update-notifier.js' to
//     the pre-cache list — both are part of the shell again.
//
// v4.2.2 change log:
//   • Added './arabic-font.js' to the shell. It was missing, so an
//     offline Arabic PDF export failed at the point the module was
//     first imported.
//   • Added OPTIONAL_ASSETS for the jsPDF Arabic TTF candidates.
//     Caching the loader without the font it fetches would only have
//     moved the offline failure one step later.
// ============================================================

// ── Version, derived from the registration URL ───────────────
// index.html registers  ./sw.js?v=4.2.0  — see version.js.
// The '0.0.0' fallback only applies to an old cached page that
// still registers the plain URL; it self-heals on the next visit.
const APP_VERSION = new URL(self.location.href).searchParams.get('v') || '0.0.0';
const CACHE_NAME  = `dacum-lite-v${APP_VERSION}`;
const CACHE_PREFIX = 'dacum-lite-v';

const SHELL_ASSETS  = [
    './',
    './index.html',
    './app.js',
    './arabic-font.js',
    './base.css',
    './layout.css',
    './components.css',
    './design-system.js',
    './events.js',
    './fileEngine.js',
    './history.js',
    './i18n.js',
    './translations.js',
    './project-manager.js',
    './renderer.js',
    './state.js',
    './storage.js',
    './version.js',
    './update-notifier.js',
    './manifest.json',
    './fonts/Cairo.woff2'
];

// ── Optional assets: cached if present, ignored if not ───────
// arabic-font.js fetches ONE of these TTFs from the repo root at
// the first Arabic PDF export and registers it with jsPDF. Caching
// the module alone would not be enough — offline it would load and
// then fail on the fetch, producing a PDF with no Arabic glyphs.
//
// These are TTFs, not the woff2 above: that one styles the web UI,
// while jsPDF's addFileToVFS needs a TTF. They are separate files
// serving separate purposes, and both have to be cached.
//
// Listed separately because only one is expected to exist in any
// given deployment. A 404 here is normal and is swallowed by the
// per-asset catch in install, exactly as a missing optional asset
// should be.
const OPTIONAL_ASSETS = [
    './Tajawal-Regular.ttf',
    './Cairo-Regular.ttf',
    './Calibri.ttf'
];

// ── Install: pre-cache the app shell ─────────────────────────
// NOTE: deliberately NO skipWaiting() here. The new worker must
// stay in the waiting state until the user consents.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Use individual requests so one failure doesn't block all
            return Promise.allSettled(
                SHELL_ASSETS.concat(OPTIONAL_ASSETS).map(url =>
                    cache.add(url).catch(err =>
                        console.warn('[SW] Failed to cache:', url, err)
                    )
                )
            );
        })
    );
});

// ── Activate: purge old caches, claim, then announce ─────────
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys  = await caches.keys();
        const stale = keys.filter(key => key !== CACHE_NAME);

        // If a previous DACUM cache existed, this activation is an
        // UPDATE rather than a first-ever install.
        const isUpdate = stale.some(key => key.startsWith(CACHE_PREFIX));

        await Promise.all(stale.map(key => caches.delete(key)));
        await self.clients.claim();

        if (isUpdate) {
            const windows = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });
            windows.forEach(client =>
                client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION })
            );
        }
    })());
});

// ── Message: the page asks us to take over (user pressed
//    "Update now") ─────────────────────────────────────────────
self.addEventListener('message', event => {
    const data = event.data;
    if (!data) return;

    if (data === 'SKIP_WAITING' || data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }

    // Lets the page ask which version this worker is.
    if (data.type === 'GET_VERSION' && event.source) {
        event.source.postMessage({
            type: 'SW_VERSION',
            version: APP_VERSION,
            cache: CACHE_NAME
        });
    }
});

// ── Fetch: network-first for the app shell, cache is the
//    offline-only fallback ──────────────────────────────────
self.addEventListener('fetch', event => {
    // Only handle GET requests, skip cross-origin CDN requests (jspdf, docx)
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Let CDN requests (jspdf, docx) go straight to network — never cached
    if (url.origin !== self.location.origin) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response('Network unavailable', { status: 503 })
            )
        );
        return;
    }

    // App shell: try the network first so every online visit gets the
    // latest deployed files; only fall back to whatever is cached if
    // the network request fails (offline, or a flaky connection).
    event.respondWith(
        fetch(event.request).then(response => {
            if (response && response.status === 200) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache =>
                    cache.put(event.request, clone)
                );
            }
            return response;
        }).catch(() =>
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                // Offline fallback: serve index.html for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return new Response('Offline', { status: 503 });
            })
        )
    );
});
