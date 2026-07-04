// ============================================================
// sw.js — DACUM Lite Service Worker (PWA)
// Strategy: Cache-first for app shell, network-first for data
// ============================================================

const CACHE_NAME    = 'dacum-lite-v3.1.0';
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
    './project-manager.js',
    './renderer.js',
    './state.js',
    './storage.js',
    './version.js',
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

// ── Activate: delete old caches ───────────────────────────────
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

// ── Fetch: cache-first with network fallback ──────────────────
self.addEventListener('fetch', event => {
    // Only handle GET requests, skip cross-origin CDN requests (jspdf, docx)
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Let CDN requests (jspdf, docx) go straight to network
    if (url.origin !== self.location.origin) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response('Network unavailable', { status: 503 })
            )
        );
        return;
    }

    // App shell: cache-first strategy
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                // Cache valid responses
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache =>
                        cache.put(event.request, clone)
                    );
                }
                return response;
            }).catch(() => {
                // Offline fallback: serve index.html for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return new Response('Offline', { status: 503 });
            });
        })
    );
});
