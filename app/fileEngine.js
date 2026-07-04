// ============================================================
// fileEngine.js — Professional File Engine v1.0
//
// Handles versioned export and import of DACUM project records.
//
// Design principles:
//   • Zero app-module imports at load time — all dependencies
//     are injected via initFileEngine() to mirror the callback-
//     injection pattern used by storage.js and renderer.js.
//     i18n.js is imported here because it has no dependency on
//     any app module, so there is no circular-dep risk.
//   • All public functions are wrapped in try/catch so a bad
//     file never crashes the running app.
//   • Schema validation is strict but forward-extensible.
//
// File format (v1.0.0):
//   {
//     app:           "DACUM Professional Tool",
//     version:       "1.0.0",
//     schemaVersion: "1.0.0",
//     exportedAt:    <ISO 8601 timestamp>,
//     project:       { ...full ProjectRecord }
//   }
// ============================================================

import { t } from './i18n.js';

// ── Schema identity constants ─────────────────────────────────
const APP_NAME       = 'DACUM Professional Tool';
const VERSION        = '1.0.0';
const SCHEMA_VERSION = '1.0.0';

// ══════════════════════════════════════════════════════════════
//  DEPENDENCY INJECTION
//  Called once during app bootstrap in app.js.
//  Keeps this module decoupled from project-manager.js and
//  app.js at import time — no circular dependency risk.
// ══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} FileEngineCallbacks
 * @property {function(string): (Object|undefined)} getProject
 * @property {function(): Object[]} getAllProjects
 * @property {function(Object): boolean} injectProject
 * @property {function(): void} persistProjects
 * @property {function(Object): void} onImportSuccess
 */

/** @type {FileEngineCallbacks} */
let _cb = {
    getProject:      null,
    getAllProjects:   null,
    injectProject:   null,
    persistProjects: null,
    onImportSuccess: null,
};

/**
 * Wire the external callbacks before calling exportProject or
 * importProject. Called once at module level in app.js.
 *
 * @param {Partial<FileEngineCallbacks>} callbacks
 */
export function initFileEngine(callbacks) {
    _cb = { ..._cb, ...callbacks };
}

// ══════════════════════════════════════════════════════════════
//  PART 1 — EXPORT ENGINE
// ══════════════════════════════════════════════════════════════

/**
 * Serialise a project record into a versioned JSON envelope and
 * trigger a safe browser download.
 *
 * @param {string} projectId — id of the project to export
 */
export function exportProject(projectId) {
    try {
        const project = _cb.getProject(projectId);
        if (!project) {
            throw new Error(`Project not found: "${projectId}"`);
        }

        const envelope = {
            app:           APP_NAME,
            version:       VERSION,
            schemaVersion: SCHEMA_VERSION,
            exportedAt:    new Date().toISOString(),
            project:       _deepClone(project),
        };

        const json     = JSON.stringify(envelope, null, 2);
        const blob     = new Blob([json], { type: 'application/json' });
        const url      = URL.createObjectURL(blob);
        const fileName = _toFileName(project.name) + '_dacum.json';

        _download(url, fileName);
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error('[FileEngine] exportProject failed:', err);
        alert(t('fileEngine.exportFailed', { msg: err.message }));
    }
}

// ── Private: download trigger ─────────────────────────────────
function _download(url, name) {
    const a    = document.createElement('a');
    a.href     = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Convert a project name into a safe, cross-platform file-name
 * segment.
 *
 * @param {string} name
 * @returns {string}
 */
function _toFileName(name) {
    return (name || 'project')
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')  // strip OS-illegal chars
        .trim()
        .replace(/\s+/g, '_')                    // spaces → underscores
        .slice(0, 60)                            // 60-char cap
        || 'project';
}

// ══════════════════════════════════════════════════════════════
//  PART 2 — IMPORT ENGINE
// ══════════════════════════════════════════════════════════════

/**
 * Import a project from a user-selected .json File object.
 * Reads the file asynchronously so the UI stays responsive.
 *
 * @param {File} file — from an <input type="file"> change event
 */
export function importProject(file) {
    if (!file) return;

    const reader = new FileReader();

    // Disk / permission failure
    reader.onerror = () => {
        console.error('[FileEngine] FileReader could not read:', file.name);
        alert(t('fileEngine.readFailed'));
    };

    reader.onload = (e) => {
        try {
            // ── Step 1: Parse JSON ────────────────────────────
            let data;
            try {
                data = JSON.parse(e.target.result);
            } catch (parseErr) {
                throw new Error(t('fileEngine.importInvalidJson'));
            }

            // ── Step 2: Schema validation ─────────────────────
            const validation = validateImportSchema(data);
            if (!validation.valid) {
                alert(t('fileEngine.importFailed', { reason: validation.error }));
                return;
            }

            // ── Step 3: Duplicate ID protection ───────────────
            let project = _deepClone(data.project);

            const existingIds = (_cb.getAllProjects() || []).map(p => p.id);
            if (existingIds.includes(project.id)) {
                const originalId = project.id;
                project.id   = _generateId();
                project.name = project.name + t('fileEngine.importedSuffix');
                console.info(
                    `[FileEngine] Duplicate ID "${originalId}" resolved → ` +
                    `new id "${project.id}", name "${project.name}"`
                );
            }

            // ── Step 4: Normalise optional fields ─────────────
            project.createdAt           = project.createdAt           || new Date().toISOString();
            project.updatedAt           = new Date().toISOString();
            project.snapshots           = Array.isArray(project.snapshots) ? project.snapshots : [];
            project.state               = project.state               || {};
            project.state.duties        = project.state.duties        || [];
            project.state.taskCounts    = project.state.taskCounts    || {};
            project.state.dutyCount     = project.state.dutyCount     || 0;
            project.state.isCardView    = false;
            // chartInfo and additionalInfo are optional (absent in files
            // exported before v3.1 i18n update). Preserve if present,
            // default to null so _loadProjectIntoUI skips gracefully.
            project.chartInfo      = project.chartInfo      || null;
            project.additionalInfo = project.additionalInfo || null;

            // ── Step 5: Insert into project store ─────────────
            _cb.injectProject(project);

            // ── Step 6: Persist to localStorage ───────────────
            _cb.persistProjects();

            // ── Step 7: Notify app.js ─────────────────────────
            if (_cb.onImportSuccess) {
                _cb.onImportSuccess(project);
            }

        } catch (err) {
            console.error('[FileEngine] importProject failed:', err);
            alert(t('fileEngine.importError', { msg: err.message }));
        }
    };

    reader.readAsText(file);
}

// ── Private: project ID generator ────────────────────────────
function _generateId() {
    return 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ── Private: deep clone ───────────────────────────────────────
function _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ══════════════════════════════════════════════════════════════
//  PART 3 — SCHEMA VALIDATION (internal, not exported)
// ══════════════════════════════════════════════════════════════

/**
 * Validate a parsed import value against the DACUM v1.0.0
 * schema. Returns a result object — never throws.
 *
 * @param {*} data
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
function validateImportSchema(data) {

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {
            valid: false,
            error: 'File root must be a JSON object, not an array or primitive.'
        };
    }

    if (data.app !== APP_NAME) {
        return {
            valid: false,
            error:
                `Unrecognised application identifier.\n` +
                `Expected: "${APP_NAME}"\n` +
                `Received: "${data.app}"`
        };
    }

    if (!data.version || typeof data.version !== 'string') {
        return {
            valid: false,
            error: '"version" field is missing or is not a string.'
        };
    }

    if (!data.schemaVersion || typeof data.schemaVersion !== 'string') {
        return {
            valid: false,
            error: '"schemaVersion" field is missing or is not a string.'
        };
    }

    if (!data.project || typeof data.project !== 'object' || Array.isArray(data.project)) {
        return {
            valid: false,
            error: '"project" field is missing or is not an object.'
        };
    }

    const p = data.project;

    if (!p.id || typeof p.id !== 'string' || !p.id.trim()) {
        return {
            valid: false,
            error: 'Project record is missing a valid "id" string.'
        };
    }

    if (!p.name || typeof p.name !== 'string' || !p.name.trim()) {
        return {
            valid: false,
            error: 'Project record is missing a valid "name" string.'
        };
    }

    if (!p.state || typeof p.state !== 'object' || Array.isArray(p.state)) {
        return {
            valid: false,
            error: 'Project record is missing a valid "state" object.'
        };
    }

    if (!Array.isArray(p.state.duties)) {
        return {
            valid: false,
            error: 'Project state is missing the required "duties" array.'
        };
    }

    return { valid: true };
}
