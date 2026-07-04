// ============================================================
// state.js — Central State Layer
// ============================================================

/**
 * Single source of truth for all application data.
 * Never mutate directly from outside — use StateManager methods
 * or command factories in history.js.
 *
 * With multi-project support, app.js syncs this object FROM
 * the active project on startup and project switch, and syncs
 * it back TO the project record via the save hook in storage.js.
 */
export const AppState = {
    duties:      [],
    taskCounts:  {},
    dutyCount:   0,
    isCardView:  true,
    snapshots:   [],
    chartImages: { producedFor: null, producedBy: null }  // base64 logos
};

/**
 * StateManager — wraps AppState and owns the undo/redo stacks.
 * dispatch() is a convenience pipeline for execute → push → save → render.
 * Render and save callbacks are injected by app.js to avoid circular deps.
 */
export const StateManager = {
    state: AppState,
    undoStack: [],
    redoStack: [],
    MAX_HISTORY: 50,

    // ── Injected by app.js ──────────────────────────────────
    _saveCallback:   null,
    _renderCallback: null,

    /** Wire up storage and renderer (called once in app.js) */
    configure({ save, render }) {
        this._saveCallback   = save;
        this._renderCallback = render;
    },

    /** Read the current state object */
    getState() { return this.state; },

    /** Replace state wholesale (used by applyProjectState) */
    setState(newState) { this.state = newState; },

    /**
     * Full pipeline: execute command, record it, clear redo, save, re-render.
     * Callers that want fine-grained control use pushCommand() + render directly.
     */
    dispatch(command) {
        command.execute();
        this.undoStack.push(command);
        if (this.undoStack.length > this.MAX_HISTORY) this.undoStack.shift();
        this.redoStack = [];
        if (this._saveCallback)   this._saveCallback();
        if (this._renderCallback) this._renderCallback(this.state);
    },

    /** Export a plain snapshot of current state (for localStorage) */
    serialize() { return JSON.parse(JSON.stringify(this.state)); },

    /** Restore state from a deserialized snapshot */
    deserialize(data) { Object.assign(this.state, data); }
};

// ══════════════════════════════════════════════════════════════
//  PROJECT SYNC HELPERS
//  Called by app.js when switching active projects.
//  All command factory closures reference AppState by reference,
//  so mutating AppState in-place keeps them correct.
// ══════════════════════════════════════════════════════════════

/**
 * Load a stored project state record into the live AppState object.
 * Mutates AppState in-place so all existing closures stay valid.
 */
export function applyProjectState(projectState) {
    if (!projectState) return;
    AppState.duties      = JSON.parse(JSON.stringify(projectState.duties      || []));
    AppState.taskCounts  = JSON.parse(JSON.stringify(projectState.taskCounts  || {}));
    AppState.dutyCount   = typeof projectState.dutyCount === 'number' ? projectState.dutyCount : 0;
    AppState.isCardView  = false;
    AppState.snapshots   = JSON.parse(JSON.stringify(projectState.snapshots   || []));
    AppState.chartImages = JSON.parse(JSON.stringify(projectState.chartImages || { producedFor: null, producedBy: null }));
}

/**
 * Extract a serialisable snapshot of AppState for project storage.
 * Returns a new object — safe to pass to JSON.stringify.
 */
export function extractProjectState() {
    return JSON.parse(JSON.stringify({
        duties:      AppState.duties,
        taskCounts:  AppState.taskCounts,
        dutyCount:   AppState.dutyCount,
        isCardView:  AppState.isCardView,
        snapshots:   AppState.snapshots,
        chartImages: AppState.chartImages
    }));
}
