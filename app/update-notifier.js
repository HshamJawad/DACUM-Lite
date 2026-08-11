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
// Update detection listens to THREE signals, because browsers do
// not agree on which one they fire:
//   • 'SW_UPDATED' message posted by sw.js after activation
//   • 'updatefound' on the registration → worker state 'installed'
//   • 'controllerchange' on navigator.serviceWorker
// Relying on any single one means some users never see the bar.
// ============================================================

import { APP_VERSION, APP_RELEASED, CACHE_VERSION } from './version.js';
import { t, getLang } from './i18n.js';

// ── Constants ────────────────────────────────────────────────
const BANNER_ID   = 'updateBanner';
const RELOAD_KEY  = 'dacum_update_reload';   // sessionStorage
const RELOAD_GUARD_MS = 20000;               // 20s anti-loop window

// ── Module state ─────────────────────────────────────────────
let _registration   = null;   // ServiceWorkerRegistration | null
let _updateReady    = false;  // an update is available right now
let _userTriggered  = false;  // user pressed "Update now"
let _hadController  = false;  // page was controlled at load time

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

function paintVersionText() {
    const footer = document.getElementById('helpVersionFooter');
    if (footer) {
        footer.dir = (getLang() === 'ar') ? 'rtl' : 'ltr';
        footer.textContent = t('help.versionFooter', {
            v: APP_VERSION,
            d: APP_RELEASED
        });
    }

    // The copyright line carries {{version}}; applyTranslations() calls
    // t() without variables, so this element deliberately has NO
    // data-i18n attribute and is rendered here instead.
    const cr = document.getElementById('copyrightMain');
    if (cr) cr.textContent = t('copyright.main', { version: APP_VERSION });
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

    if (msg)  msg.textContent  = t('update.available');
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
    paintVersionBadge();
    showBanner();
}

function wireRegistration(reg) {
    if (!reg) return;
    _registration = reg;

    // Signal 2 — a new worker is being installed right now.
    if (reg.waiting && _hadController) onUpdateAvailable(null);

    reg.addEventListener('updatefound', () => {
        const incoming = reg.installing;
        if (!incoming) return;
        incoming.addEventListener('statechange', () => {
            // 'installed' + an existing controller = update, not first install.
            if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
                onUpdateAvailable(null);
            }
        });
    });
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
