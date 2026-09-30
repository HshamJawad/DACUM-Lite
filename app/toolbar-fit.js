// ============================================================
// toolbar-fit.js — keep every toolbar button on screen   (v4.12.8)
//
// THE BUG
//   The desktop toolbar is a single non-wrapping flex row between the
//   sidebar and the right edge of the window. With the sidebar open
//   (260px) on a laptop-width screen, the buttons with their English or
//   French labels are wider than the space left, and the last group —
//   Undo / Redo / snapshots — was pushed past the window edge. It only
//   came back when the sidebar was collapsed to 60px.
//
// THE FIX — compact only as much as needed
//   A fixed breakpoint cannot get this right: the needed width depends
//   on the language (French labels are the longest), on whether the
//   sidebar is open or collapsed, and on whether the "Update" badge is
//   showing. So the toolbar measures itself and steps through levels,
//   stopping at the first one where nothing overflows:
//
//     0  normal
//     1  tighter spacing and button padding
//     2  icon-only for every button except Export Project and the
//        language menu (labels stay as tooltips / aria-label)
//     3  icon-only for everything; language menu shows EN / FR / ع
//     4  last resort: the row scrolls sideways instead of clipping
//
//   Re-measured whenever the toolbar changes size (sidebar open/close,
//   window resize), the language changes, fonts finish loading, or a
//   button's text changes (theme label, update badge).
//
//   Phones / drawer mode are left alone — they already have their own
//   icon-plus-caption toolbar in index.html.
// ============================================================

const LEVELS = ['tb-fit-1', 'tb-fit-2', 'tb-fit-3', 'tb-fit-4'];
let _bar = null;
let _raf = 0;

function _isDrawer() {
    try {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--sb-mode').trim() === 'drawer';
    } catch (e) { return false; }
}

function _overflows() {
    return _bar.scrollWidth > _bar.clientWidth + 1;
}

/* Icon-only buttons still need an accessible name and a tooltip in the
   current language: copy the visible label into aria-label/title. */
function _labelIconButtons() {
    _bar.querySelectorAll('.tb-btn').forEach(btn => {
        const lbl = btn.querySelector('.tb-label');
        if (!lbl) return;
        const text = lbl.textContent.trim();
        if (!text) return;
        btn.setAttribute('aria-label', text);
        if (!btn.dataset.fitTitle) btn.dataset.fitTitle = btn.title || '';
        btn.title = btn.dataset.fitTitle ? `${text} — ${btn.dataset.fitTitle}` : text;
    });
}

function fitToolbar() {
    _raf = 0;
    if (!_bar) return;
    _bar.classList.remove(...LEVELS);
    if (_isDrawer()) return;

    for (let i = 0; i < LEVELS.length && _overflows(); i++) {
        _bar.classList.add(LEVELS[i]);
    }
    _labelIconButtons();
}

function _schedule() {
    if (!_raf) _raf = requestAnimationFrame(fitToolbar);
}

export function initToolbarFit() {
    _bar = document.querySelector('.top-toolbar');
    if (!_bar || _bar.dataset.fitBound) return;
    _bar.dataset.fitBound = '1';

    if ('ResizeObserver' in window) new ResizeObserver(_schedule).observe(_bar);
    window.addEventListener('resize', _schedule);
    document.addEventListener('dacum:langchange', _schedule);

    // Text changes inside the bar (theme label, update badge, labels
    // re-translated). childList/characterData only — the level classes
    // are set on the bar itself as attributes, so this cannot loop.
    new MutationObserver(_schedule).observe(_bar, {
        subtree: true, childList: true, characterData: true
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(_schedule);
    _schedule();
}
