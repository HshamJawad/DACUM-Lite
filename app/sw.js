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
// ============================================================

const CACHE_NAME    = 'dacum-lite-v3.2.0';   // bump this on every deploy that changes shell files
const SHELL_ASSETS  = [
    './',
    './index.html',
    './app.js',
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
    './manifest.json'
];

// ── Install: pre-cache the app shell ─────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Use individual requests so one failure doesn't block all
            return Promise.allSettled(
                SHELL_ASSETS.map(url =>
                    cache.add(url).catch(err =>
                        console.warn('[SW] Failed to cache:', url, err)
                    )
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// ── Activate: delete old caches (purges the stale v3.1.0 cache) ─
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
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
