// ============================================================
// storage.js — Persistence Delegation Layer
//
// The actual save/load logic now lives in project-manager.js.
// This module provides the same saveToLocalStorage /
// loadFromLocalStorage interface that history.js, events.js
// and renderer.js already call, so none of those files need
// any changes.
//
// app.js calls setSaveHook() once at startup to wire in the
// function that syncs AppState → active project → localStorage.
// ============================================================

// ── Save hook (injected by app.js) ────────────────────────────
let _saveHook = null;

/**
 * Register the save callback.
 * Called once during bootstrap in app.js.
 * The hook is responsible for:
 *   1. Calling updateActiveProjectData({ state, snapshots })
 *   2. Calling persistProjects()
 */
export function setSaveHook(fn) {
    _saveHook = fn;
}

/**
 * Trigger a full project persist.
 * Called by: pushCommand, undo, redo, clearDuty, clearAll,
 *            saveToJSON (indirectly), loadFromJSON, EventBinder tab init.
 * All callers are unchanged — they still call this function.
 */
export function saveToLocalStorage() {
    try {
        if (_saveHook) _saveHook();
    } catch (e) {
        console.warn('[Storage] Save failed:', e);
    }
}

/**
 * Stub kept for backward compatibility.
 * Loading is now handled by ProjectManager.loadProjects() in app.js.
 * Returns false so any caller falls through to their own defaults.
 */
export function loadFromLocalStorage() {
    return false;
}
