// ============================================================
// project-manager.js — Multi-Project Data Layer
// PURE DATA: no rendering, no DOM, no imports from other modules.
// All sync between live AppState and project records is handled
// by the save hook wired in app.js.
// ============================================================

const STORAGE_KEY  = 'dacum_projects_v1';
const LEGACY_KEY   = 'dacumAppState';   // Phase 1 migration source

// ── Private helpers ───────────────────────────────────────────
function _id() {
    return 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}
function _clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function _defaultState() {
    return { duties: [], taskCounts: {}, dutyCount: 0, isCardView: false };
}
function _now() {
    return new Date().toISOString();
}

// ── Internal store ─────────────────────────────────────────────
// { activeProjectId: string, projects: { [id]: ProjectRecord } }
let _store = { activeProjectId: null, projects: {} };

// ══════════════════════════════════════════════════════════════
//  PUBLIC API — data management only
// ══════════════════════════════════════════════════════════════

/**
 * Create a new project record and add it to the store.
 * Does NOT switch the active project — caller decides.
 * Returns the new project record.
 */
export function createProject(name = 'Untitled Project') {
    const id  = _id();
    const now = _now();
    const proj = {
        id,
        name:          (name || 'Untitled Project').trim(),
        createdAt:     now,
        updatedAt:     now,
        state:         _defaultState(),
        snapshots:     [],
        chartInfo:     null,
        additionalInfo:null
    };
    _store.projects[id] = proj;
    return proj;
}

/**
 * Delete a project.
 * Refuses when it is the last remaining project (never zero).
 * If the deleted project was active, auto-selects the first remaining one.
 * Returns true on success, false if refused or not found.
 */
export function deleteProject(projectId) {
    if (!_store.projects[projectId]) return false;
    if (Object.keys(_store.projects).length <= 1) {
        console.warn('[PM] Cannot delete the only project.');
        return false;
    }
    delete _store.projects[projectId];
    // Auto-fix orphaned activeProjectId
    if (_store.activeProjectId === projectId) {
        _store.activeProjectId = Object.keys(_store.projects)[0];
    }
    return true;
}

/**
 * Rename a project.
 * Returns true on success.
 */
export function renameProject(projectId, newName) {
    const proj = _store.projects[projectId];
    if (!proj) return false;
    const trimmed = (newName || '').trim();
    if (!trimmed) return false;
    proj.name      = trimmed;
    proj.updatedAt = _now();
    return true;
}

/**
 * Set the active project by id.
 * Does NOT load state into AppState — caller handles that.
 * Returns true on success.
 */
export function setActiveProject(projectId) {
    if (!_store.projects[projectId]) return false;
    _store.activeProjectId = projectId;
    return true;
}

/**
 * Return the current active project record, or null.
 */
export function getActiveProject() {
    return _store.projects[_store.activeProjectId] || null;
}

/**
 * Return all project records as an array.
 */
export function getAllProjects() {
    return Object.values(_store.projects);
}

// ══════════════════════════════════════════════════════════════
//  PERSISTENCE FAILURE REPORTING
//  ------------------------------------------------------------
//  This module stays PURE DATA (see header): it must not import
//  i18n, touch the DOM, or raise an alert itself. The consumer
//  injects a handler instead, exactly like StateManager.configure
//  and initFileEngine do elsewhere in this app.
//
//  Why this matters more than it looks:
//  persistProjects() runs after EVERY state change via the save
//  hook in app.js. A naive alert() inside it would fire on almost
//  every keystroke once storage is full, freezing the app behind
//  a modal — worse than the silent loss it was meant to fix.
//
//  Hence _persistBroken: the handler is called ONCE on the first
//  failure and stays silent until a save succeeds again, at which
//  point the latch resets and a future failure can report anew.
// ══════════════════════════════════════════════════════════════

let _onPersistError = null;   // injected by app.js
let _persistBroken  = false;  // latch — prevents alert storms

/**
 * Wire a failure handler. Call once at startup, before any save.
 * @param {{onError?: (info:{quota:boolean, bytes:number, projects:number, error:Error}) => void}} hooks
 */
export function configurePersistence({ onError } = {}) {
    _onPersistError = typeof onError === 'function' ? onError : null;
}

// النسبة وحدها ("33% مستهلك") لا تخبر المستخدم بشيء قابل للتنفيذ.
// التفصيل يخبره: إن كانت اللقطات تشغل ضعف ما تشغله الشعارات،
// فحذف لقطات مشروع منتهٍ يحرّر أكثر — وهو آمن، لأن اللقطات تاريخ
// تراجع لا بيانات مخطط.
const QUOTA_BYTES = 5 * 1024 * 1024;   // سقف localStorage التقريبي

/**
 * حجم المتجر مفصّلاً حسب ما يستهلك المساحة فعلاً.
 * @returns {{bytes:number, kb:number, pct:number, projects:number,
 *            breakdown:{charts:number, snapshots:number, logos:number, meta:number},
 *            heaviest:{id:string, name:string, bytes:number, snapshots:number}|null}}
 */
export function getStorageStats() {
    const size = o => { try { return JSON.stringify(o ?? null).length; } catch { return 0; } };

    let charts = 0, snapshots = 0, logos = 0;
    let heaviest = null;

    for (const [id, p] of Object.entries(_store.projects || {})) {
        const snapBytes = size(p.snapshots);

        // الشعارات base64 داخل state.chartImages — تُحسب منفصلة
        // لأنها العنصر الأسهل تحريراً بلا فقدان بيانات.
        const logoBytes = size(p.state?.chartImages);

        // ما تبقّى من المشروع: الواجبات والمهام والمعلومات
        const chartBytes = size(p) - snapBytes - logoBytes;

        charts    += Math.max(0, chartBytes);
        snapshots += snapBytes;
        logos     += logoBytes;

        const total = size(p);
        if (!heaviest || total > heaviest.bytes) {
            heaviest = {
                id,
                name:      p.name || '—',
                bytes:     total,
                snapshots: Array.isArray(p.snapshots) ? p.snapshots.length : 0
            };
        }
    }

    const bytes = size(_store);
    return {
        bytes,
        kb:        Math.round(bytes / 1024),
        pct:       Math.min(100, Math.round(bytes / QUOTA_BYTES * 100)),
        quota:     QUOTA_BYTES,
        projects:  Object.keys(_store.projects || {}).length,
        breakdown: {
            charts,
            snapshots,
            logos,
            meta: Math.max(0, bytes - charts - snapshots - logos)
        },
        heaviest
    };
}

/**
 * حذف لقطات التراجع لكل المشاريع عدا النشط.
 * أكبر مساحة يمكن تحريرها بلا فقدان أي بيانات مخطط.
 * @returns {{freed:number, projects:number}} البايتات المحرّرة
 */
export function pruneInactiveSnapshots() {
    let freed = 0, touched = 0;
    for (const [id, p] of Object.entries(_store.projects || {})) {
        if (id === _store.activeProjectId) continue;
        if (!Array.isArray(p.snapshots) || !p.snapshots.length) continue;
        try { freed += JSON.stringify(p.snapshots).length; } catch { /* ignore */ }
        p.snapshots = [];
        touched++;
    }
    return { freed, projects: touched };
}

/**
 * Persist the full in-memory store to localStorage.
 *
 * Returns TRUE on success and FALSE on failure. Previously this
 * swallowed every error with a console.warn, so a full quota meant
 * the user kept working against a store that was no longer being
 * written — and lost everything on the next reload, with nothing
 * on screen having hinted at it.
 *
 * @returns {boolean} whether the write actually landed
 */
export function persistProjects() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_store));
        _persistBroken = false;      // a good save clears the latch
        return true;
    } catch (e) {
        // Quota is reported under three different names/codes across
        // browsers; Safari in private mode throws code 22 with a
        // generic name, so test all three.
        const quota = !!e && (
            e.name === 'QuotaExceededError' ||
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            e.code === 22
        );

        console.error('[PM] Persist FAILED — data is NOT saved:', e);

        if (!_persistBroken && _onPersistError) {
            _persistBroken = true;
            const stats = getStorageStats();
            try {
                _onPersistError({
                    quota,
                    bytes:    stats.bytes,
                    projects: stats.projects,
                    error:    e
                });
            } catch (hookErr) {
                // A broken handler must never mask the original failure
                console.error('[PM] onError handler threw:', hookErr);
            }
        }
        return false;
    }
}

/**
 * Load store from localStorage.
 * Migration path: if new key absent, tries the legacy 'dacumAppState' key.
 * If nothing found, creates a default "Untitled Project".
 * Returns true if existing data was restored, false if fresh/defaulted.
 */
export function loadProjects() {
    // ── Try new multi-project key ─────────────────────────────
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.projects && Object.keys(parsed.projects).length > 0) {
                _store = parsed;
                // Guard against a stale activeProjectId (project was deleted externally)
                if (!_store.projects[_store.activeProjectId]) {
                    _store.activeProjectId = Object.keys(_store.projects)[0];
                }
                return true;
            }
        }
    } catch (e) {
        console.warn('[PM] Load failed, trying legacy migration:', e);
    }

    // ── Migrate legacy single-state key ───────────────────────
    try {
        const legacyRaw = localStorage.getItem(LEGACY_KEY);
        if (legacyRaw) {
            const legacyState = JSON.parse(legacyRaw);
            if (legacyState && Array.isArray(legacyState.duties)) {
                const proj               = createProject('Migrated Project');
                proj.state               = _clone(legacyState);
                proj.state.isCardView    = false; // always open in table view
                _store.activeProjectId   = proj.id;
                console.info('[PM] Migrated legacy data → project id:', proj.id);
                return true;
            }
        }
    } catch (e) {
        console.warn('[PM] Legacy migration failed:', e);
    }

    // ── Fresh start ────────────────────────────────────────────
    const proj = createProject('Untitled Project');
    _store.activeProjectId = proj.id;
    return false;
}

/**
 * Overwrite stored state/snapshots for the currently active project.
 * Called by the save hook in app.js before every persistProjects().
 * Any key can be omitted to leave that field unchanged.
 */
export function updateActiveProjectData({ state, snapshots, chartInfo, additionalInfo } = {}) {
    const proj = getActiveProject();
    if (!proj) return;
    if (state          !== undefined) proj.state          = _clone(state);
    if (snapshots      !== undefined) proj.snapshots      = _clone(snapshots);
    if (chartInfo      !== undefined) proj.chartInfo      = _clone(chartInfo);
    if (additionalInfo !== undefined) proj.additionalInfo = _clone(additionalInfo);
    proj.updatedAt = _now();
}

/**
 * Insert a fully-formed ProjectRecord directly into the store.
 * Used by fileEngine.js after import schema validation and ID
 * de-duplication — the record is import-ready at call time.
 *
 * Does NOT change activeProjectId — caller (app.js via
 * onImportSuccess callback) handles the context switch.
 *
 * @param {Object} record — a complete, validated ProjectRecord
 * @returns {boolean} true on success, false if record is invalid
 */
export function injectProject(record) {
    if (!record || !record.id || typeof record.id !== 'string') {
        console.warn('[PM] injectProject: invalid record — must have a string id');
        return false;
    }
    _store.projects[record.id] = record;
    return true;
}
