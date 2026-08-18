// ============================================================
// update-notifier.js — DACUM Lite Update Notification Bar
// ============================================================
//
// CORE RULE: this module NEVER reloads the page on its own.
//
// The reason is operational, not technical. DACUM Lite is used in
// live workshops: the facilitator may be typing while participants
// watch the screen. A surprise reload at that moment costs far more
// than running a slightly older build for a few more minutes.
// So the new service worker is installed and left WAITING, we offer
// the switch, and the user picks the moment.
//
// Responsibilities:
//   1. Toolbar version badge  (#versionBadge)
//   2. Help-tab version footer (#helpVersionFooter)
//   3. Copyright line          (#copyrightMain)
//   4. The update bar itself   (#updateBanner)
//
// Update detection listens to FOUR signals, because browsers do
// not agree on which one they fire — and on some devices none of
// the service-worker ones fire at all:
//   • 'SW_UPDATED' message posted by sw.js after activation
//   • 'updatefound' on the registration → worker state 'installed'
//   • 'controllerchange' on navigator.serviceWorker
//   • a VERSION POLL: ./version.js is fetched directly and its
//     APP_VERSION compared with the one this page was built from
//
// v4.4.2 — why the bar did not appear on the last release:
//   1. The registration was wired on 'load', by which time the new
//      worker could already be INSTALLING. 'updatefound' had fired
//      before the listener existed, and only reg.waiting was
//      checked, so a worker caught mid-install was never noticed.
//   2. Every remaining signal depends on the service worker
//      actually reaching 'installed'. On an installed PWA on
//      Android that can be deferred for a long time, so the user
//      sees nothing at all.
//   The version poll fixes both: it is independent of the service
//   worker, and because sw.js is network-first, a plain reload is
//   already enough to land on the new build.
// ============================================================

import { APP_VERSION, APP_RELEASED, CACHE_VERSION } from './version.js';
import { t, getLang } from './i18n.js';

// ── Constants ────────────────────────────────────────────────
const BANNER_ID   = 'updateBanner';
const RELOAD_KEY  = 'dacum_update_reload';   // sessionStorage
const RELOAD_GUARD_MS = 20000;               // 20s anti-loop window

// ── Version poll ─────────────────────────────────────────────
// A FIXED query string, never Date.now(): sw.js is network-first,
// so the response is always fresh anyway, and a changing URL would
// add a new cache entry on every single poll.
const VERSION_URL   = './version.js?vcheck=1';
const POLL_FIRST_MS = 8000;              // first check, after settle
const POLL_EVERY_MS = 5 * 60 * 1000;     // then every 5 minutes

// ── Module state ─────────────────────────────────────────────
let _registration   = null;   // ServiceWorkerRegistration | null
let _updateReady    = false;  // an update is available right now
let _userTriggered  = false;  // user pressed "Update now"
let _hadController  = false;  // page was controlled at load time
let _remoteVersion  = null;   // newest APP_VERSION seen on the server
let _pollTimer      = null;   // setInterval handle

// ══════════════════════════════════════════════════════════════
//  Reload guard — prevents an endless update loop
//
//  Without this, a page that reloads on controllerchange can be
//  re-notified by the fresh worker and reload again, forever.
//  One reload per version per 20 seconds, maximum.
// ══════════════════════════════════════════════════════════════
function canReload() {
    try {
        const raw = sessionStorage.getItem(RELOAD_KEY);
        if (raw) {
            const rec = JSON.parse(raw);
            if (rec && rec.version === APP_VERSION &&
                (Date.now() - rec.ts) < RELOAD_GUARD_MS) {
                console.warn('[Update] Reload suppressed — guard window active.');
                return false;
            }
        }
    } catch (e) { /* sessionStorage unavailable — allow the reload */ }
    return true;
}

function markReloaded() {
    try {
        sessionStorage.setItem(RELOAD_KEY, JSON.stringify({
            version: APP_VERSION,
            ts: Date.now()
        }));
    } catch (e) { /* ignore */ }
}

function safeReload() {
    if (!canReload()) return;
    markReloaded();
    window.location.reload();
}

// ══════════════════════════════════════════════════════════════
//  Toolbar version badge  +  Help footer  +  copyright
// ══════════════════════════════════════════════════════════════
function paintVersionBadge() {
    const badge = document.getElementById('versionBadge');
    if (!badge) return;

    badge.dir = (getLang() === 'ar') ? 'rtl' : 'ltr';

    if (_updateReady) {
        // "Later" never cancels the offer — it downgrades it to this.
        badge.classList.add('tb-version--update');
        badge.textContent = t('update.badgeAction');
        badge.title       = t('update.available');
        badge.setAttribute('aria-label', t('update.available'));
        badge.disabled    = false;
    } else {
        badge.classList.remove('tb-version--update');
        badge.textContent = `v${APP_VERSION}`;
        badge.title       = t('update.badgeTitle', {
            v: APP_VERSION,
            d: APP_RELEASED,
            c: CACHE_VERSION
        });
        badge.setAttribute('aria-label', `v${APP_VERSION}`);
        badge.disabled    = true;
    }
}

// Any x.y.z sequence — used to correct a LEGACY translation string
// that still carries a hardcoded version number instead of the
// {{version}} token (this is what pinned the footer at 3.1.0).
const VERSION_RE = /\b\d+\.\d+(?:\.\d+)?\b/;

let _crObserver = null;   // guards the copyright line, see below
let _crPainting = false;  // re-entrancy guard for that observer

function paintVersionText() {
    const footer = document.getElementById('helpVersionFooter');
    if (footer) {
        footer.dir = (getLang() === 'ar') ? 'rtl' : 'ltr';
        footer.textContent = t('help.versionFooter', {
            v: APP_VERSION,
            d: APP_RELEASED
        });
    }

    paintCopyright();
}

// ══════════════════════════════════════════════════════════════
//  The copyright line — made version-proof
//
//  Three separate things could leave a stale number on screen, and
//  all three are handled here rather than assumed away:
//
//   1. The element may be found by id (#copyrightMain) OR, in an
//      older build, only by class (.copyright-main).
//   2. The translation may still be the LEGACY string with the
//      version baked in ("… Version 3.1.0 …") instead of the
//      {{version}} token. The regex above rewrites whatever number
//      it finds to APP_VERSION, so the line is correct either way.
//   3. applyTranslations() may overwrite this element afterwards if
//      it still carries data-i18n="copyright.main" — that call has
//      no variables, so it would restore the stale text. The
//      attribute is removed, and a MutationObserver repaints the
//      line if anything else ever changes it.
// ══════════════════════════════════════════════════════════════
function paintCopyright() {
    const cr = document.getElementById('copyrightMain') ||
               document.querySelector('.copyright-main');
    if (!cr) return;

    // Stop applyTranslations() from re-writing this element.
    if (cr.hasAttribute('data-i18n')) cr.removeAttribute('data-i18n');

    let text = t('copyright.main', { version: APP_VERSION });

    // Token left unresolved (t() called without vars somewhere).
    text = text.replace(/\{\{\s*version\s*\}\}/g, APP_VERSION);

    // Legacy string with the number baked in.
    if (!text.includes(APP_VERSION)) text = text.replace(VERSION_RE, APP_VERSION);

    _crPainting = true;
    if (cr.textContent !== text) cr.textContent = text;
    _crPainting = false;

    watchCopyright(cr);
}

function watchCopyright(cr) {
    if (_crObserver || !('MutationObserver' in window)) return;
    _crObserver = new MutationObserver(() => {
        if (_crPainting) return;
        paintCopyright();
    });
    _crObserver.observe(cr, {
        childList: true,
        characterData: true,
        subtree: true
    });
}

// ══════════════════════════════════════════════════════════════
//  The update bar
// ══════════════════════════════════════════════════════════════
function prefersReducedMotion() {
    return window.matchMedia &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function bannerTexts(el) {
    // The bar is built with innerHTML and appended to <body>, so it is
    // NOT covered by applyTranslations() at build time. Texts are set
    // through t() here, and re-set on every 'dacum:langchange'.
    const isRTL = (getLang() === 'ar');
    el.dir = isRTL ? 'rtl' : 'ltr';

    const msg  = el.querySelector('[data-ub="msg"]');
    const now  = el.querySelector('[data-ub="now"]');
    const late = el.querySelector('[data-ub="later"]');

    // The version number is appended outside t(): it needs no
    // translation, and it turns a vague notice into a concrete one.
    if (msg)  msg.textContent  = t('update.available') +
                                 (_remoteVersion ? ` · v${_remoteVersion}` : '');
    if (now)  now.textContent  = _userTriggered ? t('update.updating') : t('update.now');
    if (late) late.textContent = t('update.later');
    if (late) late.setAttribute('aria-label', t('update.later'));
}

function showBanner() {
    // No duplicates — if it is already on screen, do nothing.
    if (document.getElementById(BANNER_ID)) {
        bannerTexts(document.getElementById(BANNER_ID));
        return;
    }

    const reduced = prefersReducedMotion();
    const el = document.createElement('div');
    el.id = BANNER_ID;
    el.setAttribute('role', 'status');        // announced, never interrupts
    el.setAttribute('aria-live', 'polite');
    el.style.cssText = [
        'position:fixed',
        'left:50%',
        'bottom:18px',
        'transform:translateX(-50%)',
        'z-index:5000',
        'display:flex',
        'align-items:center',
        'gap:14px',
        'max-width:calc(100vw - 24px)',
        'padding:12px 18px',
        'border-radius:14px',
        'background:linear-gradient(135deg,#6366f1,#8b5cf6)',
        'color:#fff',
        'box-shadow:0 10px 32px rgba(15,23,42,.34)',
        'font-family:inherit',
        'font-size:.92em',
        'line-height:1.4',
        reduced ? '' : 'animation:dacumUpdateIn .28s ease-out',
    ].filter(Boolean).join(';');

    el.innerHTML =
        '<span data-ub="icon" aria-hidden="true" style="font-size:1.15em;flex-shrink:0;">⟳</span>' +
        '<span data-ub="msg" style="flex:1;min-width:0;font-weight:600;"></span>' +
        '<button type="button" data-ub="now" style="' +
            'flex-shrink:0;border:none;border-radius:9px;padding:8px 16px;' +
            'background:#fff;color:#4f46e5;font-family:inherit;font-size:.95em;' +
            'font-weight:700;cursor:pointer;"></button>' +
        '<button type="button" data-ub="later" style="' +
            'flex-shrink:0;border:none;border-radius:9px;padding:8px 12px;' +
            'background:transparent;color:#e9e6ff;font-family:inherit;' +
            'font-size:.92em;font-weight:600;cursor:pointer;' +
            'text-decoration:underline;"></button>';

    bannerTexts(el);
    document.body.appendChild(el);

    const btnNow   = el.querySelector('[data-ub="now"]');
    const btnLater = el.querySelector('[data-ub="later"]');

    // Keyboard accessible with a visible focus ring.
    [btnNow, btnLater].forEach(b => {
        b.addEventListener('focus', () => {
            b.style.outline = '3px solid #fde047';
            b.style.outlineOffset = '2px';
        });
        b.addEventListener('blur', () => { b.style.outline = 'none'; });
    });

    btnNow.addEventListener('click', applyUpdate);
    btnLater.addEventListener('click', () => {
        // "Later" postpones — it does not cancel. The offer moves to
        // the toolbar badge, which becomes a clickable update button.
        hideBanner();
        paintVersionBadge();
    });

    // Move focus to the primary action for keyboard users, without
    // stealing it from someone actively typing.
    const active = document.activeElement;
    const typing = active && /^(INPUT|TEXTAREA)$/.test(active.tagName);
    if (!typing) btnNow.focus({ preventScroll: true });
}

function hideBanner() {
    const el = document.getElementById(BANNER_ID);
    if (el) el.remove();
}

// ══════════════════════════════════════════════════════════════
//  Apply the update — the ONLY place a reload can happen
// ══════════════════════════════════════════════════════════════
function applyUpdate() {
    _userTriggered = true;

    const el = document.getElementById(BANNER_ID);
    if (el) {
        bannerTexts(el);
        const btnNow = el.querySelector('[data-ub="now"]');
        if (btnNow) {
            btnNow.disabled = true;
            btnNow.style.opacity = '.7';
            btnNow.style.cursor = 'default';
        }
    }

    const worker = (_registration && (_registration.waiting || _registration.installing))
                 || null;

    if (worker) {
        // Ask the waiting worker to take over. The controllerchange
        // handler below performs the (guarded) reload.
        worker.postMessage({ type: 'SKIP_WAITING' });
        // Safety net: if controllerchange never fires, reload anyway.
        setTimeout(safeReload, 2500);
    } else {
        // No worker waiting — the poll found the new release first.
        // sw.js is network-first, so a plain reload already lands on
        // the new build; ask for a worker update on the way out so
        // the next launch is offline-correct too.
        if (_registration) _registration.update().catch(() => {});
        safeReload();
    }
}

// ══════════════════════════════════════════════════════════════
//  Signal handling — three independent sources
// ══════════════════════════════════════════════════════════════
function onUpdateAvailable(reportedVersion) {
    // A worker reporting OUR version means this page is already the
    // new build (e.g. a plain first install, or a post-reload
    // activation) — nothing to offer.
    if (reportedVersion && reportedVersion === APP_VERSION) return;

    if (_updateReady) { showBanner(); return; }   // no duplicates
    _updateReady = true;
    stopPolling();               // the offer is on screen; stop asking
    paintVersionBadge();
    showBanner();
}

function wireRegistration(reg) {
    if (!reg) return;
    _registration = reg;

    // Signal 2a — a new worker finished installing before this
    // module got a chance to listen. Very common: index.html
    // registers on 'load' and we wire up on 'load' too.
    if (reg.waiting && _hadController) onUpdateAvailable(null);

    // Signal 2b — a new worker is installing RIGHT NOW. This case
    // was missing, and it is the one that silently swallowed the
    // notification: 'updatefound' had already fired, so attaching
    // the listener below caught nothing.
    if (reg.installing && _hadController) _watchWorker(reg.installing);

    reg.addEventListener('updatefound', () => {
        _watchWorker(reg.installing);
    });
}

/** Watch one incoming worker until it reaches 'installed'. */
function _watchWorker(worker) {
    if (!worker) return;
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        onUpdateAvailable(null);
        return;
    }
    worker.addEventListener('statechange', () => {
        // 'installed' + an existing controller = update, not first install.
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdateAvailable(null);
        }
    });
}

// ══════════════════════════════════════════════════════════════
//  Signal 4 — the version poll
//
//  Independent of the service worker on purpose. version.js is
//  fetched and its APP_VERSION read with a regex — no import(),
//  because a module URL is resolved once per session and would
//  hand back the build already in memory.
// ══════════════════════════════════════════════════════════════
function _isNewer(remote, local) {
    const a = String(remote).split('.').map(Number);
    const b = String(local).split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        const x = a[i] || 0, y = b[i] || 0;
        if (x !== y) return x > y;
    }
    return false;
}

async function checkRemoteVersion() {
    if (_updateReady) return;                 // already offered
    if (document.hidden) return;              // do not poll a hidden tab
    if (navigator.onLine === false) return;   // offline: nothing to find

    try {
        const res = await fetch(VERSION_URL, { cache: 'no-store' });
        if (!res.ok) return;

        const text  = await res.text();
        const match = text.match(/APP_VERSION\s*=\s*['"]([0-9]+(?:\.[0-9]+)*)['"]/);
        if (!match) return;

        const remote = match[1];
        if (_isNewer(remote, APP_VERSION)) {
            _remoteVersion = remote;
            console.log('[Update] Newer version on server:', remote, '(running', APP_VERSION + ')');

            // Nudge the service worker as well, so that by the time
            // the user presses "Update now" the new shell is usually
            // already cached and the switch is instant.
            if (_registration) _registration.update().catch(() => {});

            onUpdateAvailable(remote);
        }
    } catch (e) {
        /* Network hiccup — the next poll tries again. Never noisy. */
    }
}

function startPolling() {
    if (_pollTimer) return;
    setTimeout(checkRemoteVersion, POLL_FIRST_MS);
    _pollTimer = setInterval(checkRemoteVersion, POLL_EVERY_MS);

    // A PWA is usually resumed rather than reopened, so these two
    // events are the realistic moment a user meets a new release.
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) checkRemoteVersion();
    });
    window.addEventListener('focus',  checkRemoteVersion);
    window.addEventListener('online', checkRemoteVersion);
}

function stopPolling() {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
}

export function initUpdateNotifier() {
    // Version surfaces first — they must work even without a worker
    // (preview mode, unsupported browser, file:// …).
    paintVersionBadge();
    paintVersionText();

    const badge = document.getElementById('versionBadge');
    if (badge) badge.addEventListener('click', () => {
        if (_updateReady) showBanner();
    });

    // Re-render on language switch: the bar lives outside the reach of
    // applyTranslations(), and dir must follow the interface language.
    document.addEventListener('dacum:langchange', () => {
        paintVersionBadge();
        paintVersionText();
        const el = document.getElementById(BANNER_ID);
        if (el) bannerTexts(el);
    });

    // The poll runs even with no service worker at all (a browser
    // tab, an unsupported browser, a refused registration), because
    // it is the one signal that does not depend on one.
    startPolling();

    if (!('serviceWorker' in navigator)) return;

    _hadController = !!navigator.serviceWorker.controller;

    // Signal 1 — explicit message from sw.js after it activates.
    navigator.serviceWorker.addEventListener('message', event => {
        const data = event.data;
        if (data && data.type === 'SW_UPDATED') onUpdateAvailable(data.version);
    });

    // Signal 3 — the controlling worker changed.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (_userTriggered) {
            safeReload();     // guarded: one reload per version per 20s
        } else if (_hadController) {
            onUpdateAvailable(null);   // offer it, never force it
        }
    });

    // index.html registers the worker on 'load' and stores the promise
    // on window.__dacumSWRegistration — which is AFTER DOMContentLoaded,
    // so we must wait for 'load' before reading it. If it is missing
    // (preview mode, registration refused), fall back to asking the
    // browser directly.
    const onLoaded = () => {
        const pending = window.__dacumSWRegistration ||
                        navigator.serviceWorker.getRegistration();

        Promise.resolve(pending)
            .then(reg => wireRegistration(reg || null))
            .catch(err => console.warn('[Update] No SW registration:', err));
    };

    if (document.readyState === 'complete') onLoaded();
    else window.addEventListener('load', onLoaded, { once: true });
}

export default initUpdateNotifier;
