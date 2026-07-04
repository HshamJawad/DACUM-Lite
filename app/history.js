// ============================================================
// history.js — Command-Based Undo / Redo System
// ============================================================
import { t }                        from './i18n.js';
import { AppState, StateManager }   from './state.js';
import { saveToLocalStorage }       from './storage.js';
import { showStatus }               from './design-system.js';

// ── Utilities ────────────────────────────────────────────────
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;');
}

// ── Render injection (set by app.js to avoid circular dep) ───
let _renderFn = null;
export function setHistoryRender(fn) { _renderFn = fn; }

// ── Core: push a fully-formed command ────────────────────────
export function pushCommand(cmd) {
    StateManager.undoStack.push(cmd);
    if (StateManager.undoStack.length > StateManager.MAX_HISTORY) {
        StateManager.undoStack.shift();
    }
    StateManager.redoStack = [];
    saveToLocalStorage();
    updateHistoryButtons();
}

// ── Undo ─────────────────────────────────────────────────────
export function undo() {
    if (StateManager.undoStack.length === 0) return;
    const cmd = StateManager.undoStack.pop();
    cmd.undo();
    StateManager.redoStack.push(cmd);
    saveToLocalStorage();
    updateHistoryButtons();
    if (_renderFn) _renderFn(StateManager.state);
    showStatus(t('status.undone', { type: cmd.type }), 'success');
}

// ── Redo ─────────────────────────────────────────────────────
export function redo() {
    if (StateManager.redoStack.length === 0) return;
    const cmd = StateManager.redoStack.pop();
    cmd.execute();
    StateManager.undoStack.push(cmd);
    saveToLocalStorage();
    updateHistoryButtons();
    if (_renderFn) _renderFn(StateManager.state);
    showStatus(t('status.redone', { type: cmd.type }), 'success');
}

// ── Update UI button states ───────────────────────────────────
export function updateHistoryButtons() {
    const canUndo = StateManager.undoStack.length > 0;
    const canRedo = StateManager.redoStack.length > 0;
    ['floatUndoBtn', 'undoBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !canUndo;
    });
    ['floatRedoBtn', 'redoBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !canRedo;
    });
}

// ══════════════════════════════════════════════════════════════
//  COMMAND FACTORIES
//  Each returns { type, payload, execute(), undo() }
// ══════════════════════════════════════════════════════════════

/** ADD_DUTY */
export function makeAddDutyCmd(dutyObj) {
    return {
        type: 'ADD_DUTY',
        payload: { dutyId: dutyObj.id },
        execute() {
            AppState.taskCounts[dutyObj.id] = AppState.taskCounts[dutyObj.id] || 0;
            AppState.duties.push(deepClone(dutyObj));
        },
        undo() {
            AppState.duties = AppState.duties.filter(d => d.id !== dutyObj.id);
        }
    };
}

/** DELETE_DUTY — stores index so undo re-inserts at exact position */
export function makeDeleteDutyCmd(dutyId) {
    const idx   = AppState.duties.findIndex(d => d.id === dutyId);
    const saved = deepClone(AppState.duties[idx]);
    return {
        type: 'DELETE_DUTY',
        payload: { dutyId, index: idx },
        execute() {
            AppState.duties = AppState.duties.filter(d => d.id !== dutyId);
        },
        undo() {
            AppState.duties.splice(
                saved._insertIdx !== undefined ? saved._insertIdx : idx,
                0,
                deepClone(saved)
            );
        }
    };
}

/** EDIT_DUTY */
export function makeEditDutyCmd(dutyId, oldVal, newVal) {
    return {
        type: 'EDIT_DUTY',
        payload: { dutyId, oldVal, newVal },
        execute() {
            const d = AppState.duties.find(d => d.id === dutyId);
            if (d) d.title = newVal;
        },
        undo() {
            const d = AppState.duties.find(d => d.id === dutyId);
            if (d) d.title = oldVal;
        }
    };
}

/** ADD_TASK */
export function makeAddTaskCmd(dutyId, taskObj) {
    return {
        type: 'ADD_TASK',
        payload: { dutyId, taskId: taskObj.id },
        execute() {
            const duty = AppState.duties.find(d => d.id === dutyId);
            if (duty) duty.tasks.push(deepClone(taskObj));
        },
        undo() {
            const duty = AppState.duties.find(d => d.id === dutyId);
            if (duty) duty.tasks = duty.tasks.filter(t => t.id !== taskObj.id);
        }
    };
}

/** DELETE_TASK — stores original index for correct re-insertion */
export function makeDeleteTaskCmd(taskId) {
    let foundDuty = null, savedTask = null, savedIdx = -1;
    AppState.duties.forEach(d => {
        const ti = d.tasks.findIndex(t => t.id === taskId);
        if (ti !== -1) { foundDuty = d.id; savedTask = deepClone(d.tasks[ti]); savedIdx = ti; }
    });
    return {
        type: 'DELETE_TASK',
        payload: { dutyId: foundDuty, taskId, index: savedIdx },
        execute() {
            const d = AppState.duties.find(d => d.id === foundDuty);
            if (d) d.tasks = d.tasks.filter(t => t.id !== taskId);
        },
        undo() {
            const d = AppState.duties.find(d => d.id === foundDuty);
            if (d) d.tasks.splice(savedIdx, 0, deepClone(savedTask));
        }
    };
}

/** EDIT_TASK */
export function makeEditTaskCmd(dutyId, taskId, oldVal, newVal) {
    return {
        type: 'EDIT_TASK',
        payload: { dutyId, taskId, oldVal, newVal },
        execute() {
            const d = AppState.duties.find(d => d.id === dutyId);
            if (d) { const t = d.tasks.find(t => t.id === taskId); if (t) t.text = newVal; }
        },
        undo() {
            const d = AppState.duties.find(d => d.id === dutyId);
            if (d) { const t = d.tasks.find(t => t.id === taskId); if (t) t.text = oldVal; }
        }
    };
}

/** CLEAR_ALL — stores entire prior state for single-step undo */
export function makeClearAllCmd(priorDuties, priorDutyCount, priorTaskCounts) {
    return {
        type: 'CLEAR_ALL',
        payload: {},
        execute() {
            AppState.duties     = [];
            AppState.taskCounts = {};
            AppState.dutyCount  = 0;
        },
        undo() {
            AppState.duties     = deepClone(priorDuties);
            AppState.taskCounts = deepClone(priorTaskCounts);
            AppState.dutyCount  = priorDutyCount;
        }
    };
}

// ══════════════════════════════════════════════════════════════
//  DRAG-AND-DROP COMMANDS  (v3.1)
// ══════════════════════════════════════════════════════════════

/**
 * MOVE_DUTY — reorders a duty row.
 *
 * @param {number} fromIdx  - current position in AppState.duties
 * @param {number} finalIdx - desired position AFTER the item has been removed
 *
 * Computing finalIdx (call this before creating the command):
 *   const insertIdx    = insertBefore ? targetIdx : targetIdx + 1;
 *   const finalIdx     = fromIdx < insertIdx ? insertIdx - 1 : insertIdx;
 */
export function makeMoveDutyCmd(fromIdx, finalIdx) {
    return {
        type: 'MOVE_DUTY',
        payload: { fromIdx, finalIdx },
        execute() {
            const [item] = AppState.duties.splice(fromIdx, 1);
            AppState.duties.splice(finalIdx, 0, item);
        },
        undo() {
            const [item] = AppState.duties.splice(finalIdx, 1);
            AppState.duties.splice(fromIdx, 0, item);
        }
    };
}

/**
 * MOVE_TASK — moves a task within the same duty or across duties.
 *
 * @param {string} taskId       - id of the task to move
 * @param {string} fromDutyId   - source duty id
 * @param {number} fromTaskIdx  - source index within source duty
 * @param {string} toDutyId     - target duty id (may equal fromDutyId)
 * @param {number} toInsertIdx  - raw insertion index in the TARGET duty
 *                                (before any adjustment for same-list removal)
 */
export function makeMoveTaskCmd(taskId, fromDutyId, fromTaskIdx, toDutyId, toInsertIdx) {
    const sameList = fromDutyId === toDutyId;
    // When moving within the same list, removing the item from a lower index
    // shifts all higher indices down by 1.
    const finalInsertIdx = (sameList && fromTaskIdx < toInsertIdx)
        ? toInsertIdx - 1
        : toInsertIdx;

    return {
        type: 'MOVE_TASK',
        payload: { taskId, fromDutyId, fromTaskIdx, toDutyId, toInsertIdx, finalInsertIdx },
        execute() {
            const srcDuty = AppState.duties.find(d => d.id === fromDutyId);
            const tgtDuty = AppState.duties.find(d => d.id === toDutyId);
            if (!srcDuty || !tgtDuty) return;
            const [task] = srcDuty.tasks.splice(fromTaskIdx, 1);
            tgtDuty.tasks.splice(finalInsertIdx, 0, task);
        },
        undo() {
            const srcDuty = AppState.duties.find(d => d.id === fromDutyId);
            const tgtDuty = AppState.duties.find(d => d.id === toDutyId);
            if (!srcDuty || !tgtDuty) return;
            const [task] = tgtDuty.tasks.splice(finalInsertIdx, 1);
            srcDuty.tasks.splice(fromTaskIdx, 0, task);
        }
    };
}

// ══════════════════════════════════════════════════════════════
//  SNAPSHOT VERSIONING
//  Single source of truth: AppState.snapshots
// ══════════════════════════════════════════════════════════════

export const SnapshotManager = {
    get snapshots() { return AppState.snapshots; },
    set snapshots(v) { AppState.snapshots = v; }
};

export function createSnapshot(label) {
    label = label || t('snapshot.autoName', { n: AppState.snapshots.length + 1 });
    AppState.snapshots.push({
        label,
        timestamp: new Date().toISOString(),
        state: deepClone(AppState)
    });
    if (AppState.snapshots.length > 20) AppState.snapshots.shift();
    saveToLocalStorage();
    refreshSnapshotList();
    showStatus(t('status.snapshotSaved', { label }), 'success');
}

export function restoreSnapshot(index) {
    const snap = AppState.snapshots[index];
    if (!snap) return;

    const prior = deepClone(AppState);
    const currentIsCardView = AppState.isCardView;
    const currentSnapshots  = deepClone(AppState.snapshots);

    const cmd = {
        type: 'RESTORE_SNAPSHOT',
        payload: { label: snap.label },
        execute() {
            Object.assign(AppState, deepClone(snap.state));
            AppState.isCardView = currentIsCardView;
            AppState.snapshots  = currentSnapshots;
        },
        undo() { Object.assign(AppState, prior); }
    };
    cmd.execute();
    pushCommand(cmd);
    saveToLocalStorage();
    refreshSnapshotList();
    if (_renderFn) _renderFn(StateManager.state);
    showStatus(t('status.snapshotRestored', { label: snap.label }), 'success');
}

export function promptSnapshot() {
    const label = prompt(t('snapshot.prompt'), '');
    if (label === null) return;
    createSnapshot(label.trim() || undefined);
}

export function refreshSnapshotList() {
    const list = document.getElementById('snapshotList');
    if (!list) return;
    const snaps = AppState.snapshots;
    if (!snaps || snaps.length === 0) {
        list.innerHTML = '<div class="snap-empty">' + t('snapshot.empty') + '</div>';
        return;
    }
    list.innerHTML = '';
    const reversed = snaps.slice().reverse();
    reversed.forEach((snap, i) => {
        const realIdx = snaps.length - 1 - i;
        const d       = new Date(snap.timestamp);
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const dutyLen = (snap.state && Array.isArray(snap.state.duties))
                        ? snap.state.duties.length : 0;
        const dutyStr = dutyLen === 1
            ? t('snapshot.dutyCount.one')
            : t('snapshot.dutyCount.other', { n: dutyLen });
        const item = document.createElement('div');
        item.className = 'snap-item';
        item.innerHTML =
            '<div>' +
                '<div class="snap-item-label">' + escapeHtml(snap.label) + '</div>' +
                '<div class="snap-item-time">' + dateStr + ' ' + timeStr + ' · ' + dutyStr + '</div>' +
            '</div>' +
            '<button class="snap-restore-btn" onclick="window.restoreSnapshot(' + realIdx + '); window.toggleSnapshotPanel();">' +
                t('snapshot.restore') +
            '</button>';
        list.appendChild(item);
    });
}

export function toggleSnapshotPanel() {
    const panel = document.getElementById('snapshotPanel');
    if (!panel) return;
    if (panel.style.display === 'none' || panel.style.display === '') {
        refreshSnapshotList();
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
    openStateInspector();
}

// ── Debug console inspector ───────────────────────────────────
export function openStateInspector() {
    console.group('%c DACUM Lite — State Inspector', 'color:#667eea;font-weight:bold;font-size:14px');
    console.log('%cAppState', 'color:#10b981;font-weight:bold', deepClone(StateManager.state));
    console.log('%cUndo Stack (' + StateManager.undoStack.length + ')', 'color:#f59e0b;font-weight:bold',
        StateManager.undoStack.map(c => c.type));
    console.log('%cRedo Stack (' + StateManager.redoStack.length + ')', 'color:#ef4444;font-weight:bold',
        StateManager.redoStack.map(c => c.type));
    console.log('%cSnapshots (' + AppState.snapshots.length + ')', 'color:#0ea5e9;font-weight:bold',
        AppState.snapshots.map(s => s.label));
    console.groupEnd();
}
