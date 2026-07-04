const APP_VERSION = "3.0.0";
// ============================================================
// app.js — Application Bootstrap
// Connects all modules, initialises project manager, renders
// the sidebar, and bootstraps the app on DOMContentLoaded.
// ============================================================
import { t }                                                                from './i18n.js';
import { AppState, StateManager, applyProjectState, extractProjectState } from './state.js';
import { showStatus }                                                       from './design-system.js';
import {
    undo, redo, updateHistoryButtons, setHistoryRender,
    promptSnapshot, toggleSnapshotPanel, restoreSnapshot,
    SnapshotManager, refreshSnapshotList, escapeHtml
} from './history.js';
import { saveToLocalStorage, setSaveHook }   from './storage.js';
import { initFileEngine }                    from './fileEngine.js';
import { Renderer, setRendererActions }      from './renderer.js';
import {
    EventBinder,
    addDuty, removeDuty, addTask, removeTask,
    clearDuty, cvAddDuty, clearAll, toggleCardView,
    handleImageUpload, removeImage,
    toggleInfoBox, toggleEditHeading, clearSection,
    addCustomSection, removeCustomSection,
    saveToJSON, loadFromJSON,
    exportToWord, exportToPDF,
    exportProjectFile, importProjectFile,
    getActiveTabId, setActiveTabId, restoreActiveTab,
    _applyCardViewDOM,
    // Wall View (v3.1)
    showWallView, exitWallView, wallViewZoom, resetWallZoom,
    printWallView, toggleWallFullscreen,
    showTableView, showCardView,
    // Project serialisation helpers (chart info + additional info + images)
    getChartInfoData, applyChartInfoData,
    getAdditionalInfoData, applyAdditionalInfoData,
    applyChartImages,
} from './events.js';
import {
    createProject, deleteProject, renameProject,
    setActiveProject, getActiveProject, getAllProjects,
    persistProjects, loadProjects,
    updateActiveProjectData, injectProject
} from './project-manager.js';

// ── Wire cross-module render reference ────────────────────────
// Extended to sync card/table DOM visibility so that undo, redo,
// and snapshot restore all land in the correct visual state.
setHistoryRender(state => {
    _applyCardViewDOM(state.isCardView);   // sync containers first
    Renderer.renderAll(state);             // then paint content
});

// ── Wire action callbacks into Renderer ───────────────────────
setRendererActions({ addDuty, removeDuty, addTask, removeTask, clearDuty });

// ── Wire StateManager callbacks ───────────────────────────────
StateManager.configure({
    save:   saveToLocalStorage,
    render: state => Renderer.renderAll(state)
});

// ── Wire save hook ─────────────────────────────────────────────
// Every call to saveToLocalStorage() (from history, events, etc.)
// ends up here: sync live state → active project record → disk.
// extractProjectState() now includes AppState.snapshots, so no
// separate wiring is needed.
setSaveHook(() => {
    updateActiveProjectData({
        state: extractProjectState()
    });
    persistProjects();
});

// ── Wire file engine ───────────────────────────────────────────
// initFileEngine is called at module level (not inside
// DOMContentLoaded) because _switchToProject and renderSidebar
// are function declarations and are therefore hoisted — they are
// safely referenceable here before DOMContentLoaded fires.
initFileEngine({
    // Look up one project record by id
    getProject:      (id) => getAllProjects().find(p => p.id === id),

    // Return all project records
    getAllProjects:   getAllProjects,

    // Insert a fully-formed record into the project store
    injectProject:   injectProject,

    // Flush in-memory store to localStorage
    persistProjects: persistProjects,

    // After a successful import: switch context + refresh sidebar
    onImportSuccess: (project) => {
        _switchToProject(project.id);
        showStatus(t('status.projectImported', { name: escapeHtml(project.name) }), 'success');
    },
});

// ══════════════════════════════════════════════════════════════
//  SIDEBAR — internal helpers
// ══════════════════════════════════════════════════════════════

let _sidebarOpen   = true;
let _sidebarFilter = '';

// ── View mode preference ───────────────────────────────────────
// Key stored in localStorage independently of project state so
// the preference persists across project switches and reloads.
const PREF_VIEW_KEY = 'preferredView';

/**
 * Read the user's stored view preference.
 * Falls back to 'card' (default) if nothing has been saved yet.
 * @returns {'card'|'table'}
 */
function _getPreferredView() {
    const stored = localStorage.getItem(PREF_VIEW_KEY);
    return (stored === 'table') ? 'table' : 'card';
}

/**
 * Apply a view mode to the DOM without triggering a render.
 * Called during project load / project switch so the preferred
 * view is set before the single renderAll in step 6.
 *
 * Only touches #cardViewContainer / #tableViewArea — the .tabs
 * bar and sibling .tab-content panels are never manipulated.
 *
 * @param {'card'|'table'} mode
 */
function _applyViewMode(mode) {
    AppState.isCardView = (mode === 'card');
    _applyCardViewDOM(AppState.isCardView);
}

/** Format a date as a human-readable relative string */
function _relDate(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const m    = Math.floor(diff / 60000);
    if (m < 1)  return t('time.justNow');
    if (m < 60) return t('time.minutesAgo', { n: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t('time.hoursAgo', { n: h });
    const d = Math.floor(h / 24);
    if (d < 7)  return t('time.daysAgo', { n: d });
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Save current project data before switching away */
function _saveCurrentProject() {
    // extractProjectState() captures AppState (duties/tasks/snapshots).
    // chartInfo and additionalInfo live in the DOM — we read them here
    // and store them alongside state in the ProjectRecord so they are
    // included in file exports and survive project switching.
    updateActiveProjectData({
        state:          extractProjectState(),
        chartInfo:      getChartInfoData(),
        additionalInfo: getAdditionalInfoData(),
    });
}

/** Load a project record into all live objects and re-render */
function _loadProjectIntoUI(proj) {
    if (!proj) return;

    // 1. Apply stored state to AppState (mutates in-place)
    const hasData = proj.state && Array.isArray(proj.state.duties) && proj.state.duties.length > 0;
    applyProjectState(hasData ? proj.state : { duties: [], taskCounts: {}, dutyCount: 0, isCardView: false });

    // 2. Seed a blank duty when the project is genuinely empty
    if (AppState.duties.length === 0) {
        AppState.dutyCount++;
        const dutyId = 'duty_' + AppState.dutyCount;
        AppState.taskCounts[dutyId] = 1;
        AppState.duties.push({ id: dutyId, title: '', tasks: [{ id: 'task_' + dutyId + '_1', text: '' }] });
    }

    // 3. Restore per-project snapshots
    if (AppState.snapshots.length === 0 && Array.isArray(proj.snapshots) && proj.snapshots.length > 0) {
        AppState.snapshots = JSON.parse(JSON.stringify(proj.snapshots));
    }

    // 4a. Restore Chart Info text fields + Additional Info sections
    //     Backward-compatible: old records without these keys → DOM stays blank
    applyChartInfoData(proj.chartInfo || null);
    applyAdditionalInfoData(proj.additionalInfo || null);

    // 4b. Restore logo images from AppState.chartImages
    //     applyProjectState() already loaded them into AppState.chartImages above.
    //     Now sync the module-level variables and DOM previews in events.js.
    applyChartImages(AppState.chartImages);

    // 5. Clear undo/redo — command closures cannot be serialised
    StateManager.undoStack = [];
    StateManager.redoStack = [];

    // 6. Reset tab state → Chart Info, table view
    setActiveTabId('info-tab');
    restoreActiveTab();

    // 6b. Apply the user's stored view preference (no render yet — step 7 does it).
    _applyViewMode(_getPreferredView());

    // 7. Re-render everything
    updateHistoryButtons();
    Renderer.renderAll(StateManager.state);
    refreshSnapshotList();
}

// ── Project switching (public, exposed to window) ─────────────
function _switchToProject(id) {
    const currentId = getActiveProject()?.id;

    // Save current project state before leaving it
    if (currentId) _saveCurrentProject();

    setActiveProject(id);
    persistProjects();

    const proj = getActiveProject();
    _loadProjectIntoUI(proj);
    renderSidebar();

    if (currentId !== id) showStatus(t('status.projectSwitched', { name: escapeHtml(proj.name) }), 'success');
}

// ── Sidebar open/close ─────────────────────────────────────────
function _setSidebarState(open) {
    _sidebarOpen = open;
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebarOverlay');
    const body     = document.body;
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // Mobile: slide in over content + show overlay
        if (open) {
            sidebar?.classList.add('sb-mobile-open');
            overlay?.classList.add('sb-overlay-visible');
        } else {
            sidebar?.classList.remove('sb-mobile-open');
            overlay?.classList.remove('sb-overlay-visible');
        }
    } else {
        // Desktop: toggle mini (60px icons) vs full (260px)
        if (open) {
            body.classList.remove('sb-sidebar-closed');
        } else {
            body.classList.add('sb-sidebar-closed');
        }
    }
}

// ══════════════════════════════════════════════════════════════
//  SIDEBAR RENDER
// ══════════════════════════════════════════════════════════════
export function renderSidebar(filterText) {
    if (filterText !== undefined) _sidebarFilter = filterText;

    const list    = document.getElementById('sidebarProjectList');
    const countEl = document.getElementById('sbProjectCount');
    if (!list) return;

    const all      = getAllProjects();
    const active   = getActiveProject();
    const filter   = _sidebarFilter.toLowerCase().trim();

    // Update footer count
    if (countEl) {
        const n = all.length;
        countEl.textContent = n === 1
            ? t('sidebar.projectCount.one')
            : t('sidebar.projectCount.other', { n });
    }

    // Filter + sort newest-updated first
    const visible = all
        .filter(p => !filter || p.name.toLowerCase().includes(filter))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    if (visible.length === 0) {
        list.innerHTML = '<div class="sb-empty">' + t('sidebar.noProjects') + '</div>';
        return;
    }

    list.innerHTML = '';
    visible.forEach(proj => {
        const isActive  = proj.id === active?.id;
        const dutyCount = proj.state?.duties?.length || 0;
        const dutyStr   = dutyCount === 1
            ? t('sidebar.dutyCount.one')
            : t('sidebar.dutyCount.other', { n: dutyCount });
        const dateStr   = _relDate(proj.updatedAt);

        // ── Editing-mode flag ─────────────────────────────────
        // Scoped per card. Toggled only by the rename button.
        // All other click paths check this before acting.
        let _editing = false;

        // ── Card root ─────────────────────────────────────────
        const card = document.createElement('div');
        card.className   = 'sb-project-card' + (isActive ? ' sb-active' : '');
        card.dataset.pid = proj.id;

        // ── Project name (display only by default) ────────────
        const nameEl = document.createElement('div');
        nameEl.className       = 'sb-card-name';
        nameEl.textContent     = proj.name;
        nameEl.title           = proj.name;
        nameEl.contentEditable = 'false';

        // Commit or cancel depending on key pressed
        nameEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameEl.blur();          // triggers the blur → save path
            }
            if (e.key === 'Escape') {
                nameEl.textContent     = proj.name;   // discard changes
                nameEl.contentEditable = 'false';
                nameEl.classList.remove('sb-name-editing');
                _editing = false;
            }
        });

        // Save on blur (fires after Enter-blur and after clicking away)
        nameEl.addEventListener('blur', () => {
            if (!_editing) return;      // blur can fire spuriously; guard it
            nameEl.contentEditable = 'false';
            nameEl.classList.remove('sb-name-editing');
            _editing = false;

            const newName = nameEl.textContent.trim();
            if (!newName) {
                // Revert to last-known good name
                nameEl.textContent = proj.name || t('project.untitled');
                return;
            }
            if (newName !== proj.name) {
                renameProject(proj.id, newName);
                persistProjects();
                proj.name      = newName;
                nameEl.title   = newName;
            }
        });

        // ── Meta row ──────────────────────────────────────────
        const metaEl = document.createElement('div');
        metaEl.className = 'sb-card-meta';
        metaEl.innerHTML =
            `<span class="sb-meta-item">🕐 ${dateStr}</span>` +
            `<span class="sb-meta-item">📋 ${dutyStr}</span>`;

        // ── Card body (switches project on click) ─────────────
        const cardBody = document.createElement('div');
        cardBody.className = 'sb-card-body';
        cardBody.appendChild(nameEl);
        cardBody.appendChild(metaEl);

        cardBody.addEventListener('click', () => {
            if (_editing) return;       // block switching while renaming
            _switchToProject(proj.id);
        });

        // ── Rename button (✎) — ONLY trigger for edit mode ───
        const renameBtn = document.createElement('button');
        renameBtn.type      = 'button';
        renameBtn.className = 'sb-rename-btn';
        renameBtn.title     = t('project.renameTip');
        renameBtn.textContent = '✎';

        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();        // never switches project
            if (_editing) return;       // already editing, ignore

            _editing               = true;
            nameEl.contentEditable = 'true';
            nameEl.classList.add('sb-name-editing');
            nameEl.focus();

            // Select all text so user can type immediately
            const range = document.createRange();
            range.selectNodeContents(nameEl);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });

        // ── Delete button (×) ─────────────────────────────────
        const deleteBtn = document.createElement('button');
        deleteBtn.type      = 'button';
        deleteBtn.className = 'sb-delete-btn';
        deleteBtn.title     = t('project.deleteTip');
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.pmDeleteProject(proj.id);
        });

        // ── Actions column ────────────────────────────────────
        const cardActions = document.createElement('div');
        cardActions.className = 'sb-card-actions';
        cardActions.appendChild(renameBtn);
        cardActions.appendChild(deleteBtn);

        card.appendChild(cardBody);
        card.appendChild(cardActions);
        list.appendChild(card);
    });
}

// ══════════════════════════════════════════════════════════════
//  DOMContentLoaded
// ══════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {

    // ── 1. Load project store ──────────────────────────────────
    loadProjects();

    // ── 2. Apply active project to live state ──────────────────
    _loadProjectIntoUI(getActiveProject());

    // ── 3. Save initial state to project record ────────────────
    //       (seeds the project if it was brand new / migrated)
    //       extractProjectState() now includes AppState.snapshots.
    updateActiveProjectData({
        state: extractProjectState()
    });
    persistProjects();

    // ── 4. Bind events and render UI ───────────────────────────
    EventBinder.init();
    renderSidebar();

    // ── 4b. Re-render sidebar + all views on language change ───────────────
    // applyTranslations() handles static DOM; dynamic content
    // (sidebar cards, renderer labels, snapshot list) needs a full re-render.
    document.addEventListener('dacum:langchange', () => {
        renderSidebar();
        Renderer.renderAll(StateManager.state);
    });

    // ── 5. Sidebar initial state (mobile starts closed) ────────
    if (window.innerWidth <= 768) {
        _setSidebarState(false);
    } else {
        _setSidebarState(true);
    }

    // ── 6. Handle resize: switch between mobile/desktop mode ───
    window.addEventListener('resize', () => {
        const isMobile = window.innerWidth <= 768;
        const sidebar  = document.getElementById('sidebar');
        const overlay  = document.getElementById('sidebarOverlay');
        if (!isMobile) {
            // Transitioning to desktop: clean up mobile classes
            sidebar?.classList.remove('sb-mobile-open');
            overlay?.classList.remove('sb-overlay-visible');
            // Re-apply desktop open state
            _setSidebarState(_sidebarOpen);
        }
    });

    // ── 7. Swipe gesture (mobile) ─────────────────────────────
    (function initSwipe() {
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping   = false;
        const EDGE_ZONE  = 28;   // px from left edge to trigger open
        const THRESHOLD  = 60;   // min horizontal swipe distance
        const ANGLE_LIMIT = 30;  // max vertical angle (degrees)

        document.addEventListener('touchstart', e => {
            if (window.innerWidth > 768) return;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            // Only start tracking if near left edge (open) or sidebar is open (close)
            const sidebar = document.getElementById('sidebar');
            const isOpen  = sidebar?.classList.contains('sb-mobile-open');
            isSwiping = (touchStartX <= EDGE_ZONE && !isOpen) || isOpen;
        }, { passive: true });

        document.addEventListener('touchend', e => {
            if (!isSwiping || window.innerWidth > 768) return;
            isSwiping = false;
            const touch  = e.changedTouches[0];
            const dx     = touch.clientX - touchStartX;
            const dy     = touch.clientY - touchStartY;
            const angle  = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
            // Only count near-horizontal swipes
            if (angle > ANGLE_LIMIT && angle < (180 - ANGLE_LIMIT)) return;

            const sidebar = document.getElementById('sidebar');
            const isOpen  = sidebar?.classList.contains('sb-mobile-open');

            if (!isOpen && dx > THRESHOLD) {
                // Swipe right → open
                _setSidebarState(true);
                _sidebarOpen = true;
            } else if (isOpen && dx < -THRESHOLD) {
                // Swipe left → close
                _setSidebarState(false);
                _sidebarOpen = false;
            }
        }, { passive: true });
    })();

    // ── 5. Expose all functions to window ──────────────────────
    //       Inline onclick="..." attributes in the HTML need globals.
    Object.assign(window, {
        // ── Duty / Task ──────────────────────────────────────────
        addDuty, removeDuty, addTask, removeTask, clearDuty, cvAddDuty,
        toggleCardView,

        // ── Wall View (v3.1) ─────────────────────────────────────
        showWallView, exitWallView, wallViewZoom, resetWallZoom,
        printWallView, toggleWallFullscreen,
        showTableView, showCardView,

        // ── Help tab ─────────────────────────────────────────────
        openUserGuide: () => {
            window.open('user-guide.html', '_blank');
        },

        // ── Undo / Redo ──────────────────────────────────────────
        undo, redo,

        // ── Snapshots ────────────────────────────────────────────
        promptSnapshot, toggleSnapshotPanel, restoreSnapshot,

        // ── Clear All ────────────────────────────────────────────
        clearAll,

        // ── Image upload ─────────────────────────────────────────
        handleImageUpload, removeImage,

        // ── Info box ─────────────────────────────────────────────
        toggleInfoBox,

        // ── Additional Info ──────────────────────────────────────
        toggleEditHeading, clearSection,
        addCustomSection, removeCustomSection,

        // ── Save / Load ──────────────────────────────────────────
        saveToJSON, loadFromJSON,

        // ── Export ───────────────────────────────────────────────
        exportToWord, exportToPDF,

        // ── File Engine: Project Export / Import ─────────────────
        // Save current DOM state FIRST so chartInfo + additionalInfo
        // are flushed into the ProjectRecord before fileEngine reads it.
        exportProjectFile: () => {
            _saveCurrentProject();
            exportProjectFile(getActiveProject()?.id);
        },
        importProjectFile,

        // ── Project Manager ──────────────────────────────────────
        pmSwitchProject: (id) => _switchToProject(id),

        pmNewProject: () => {
            const name = prompt(t('project.prompt.new'), t('project.prompt.newDefault'));
            if (name === null || !name.trim()) return;
            _saveCurrentProject();
            const proj = createProject(name.trim());
            setActiveProject(proj.id);
            persistProjects();
            _loadProjectIntoUI(proj);
            renderSidebar();
            showStatus(t('status.projectCreated', { name: escapeHtml(proj.name) }), 'success');
        },

        pmDeleteProject: (id) => {
            const all  = getAllProjects();
            if (all.length <= 1) { alert(t('project.alert.cannotDelete')); return; }
            const proj = all.find(p => p.id === id);
            if (!confirm(t('project.confirm.delete', { name: proj?.name || '' }))) return;
            const wasActive = getActiveProject()?.id === id;
            deleteProject(id);
            if (wasActive) {
                // deleteProject already set a new activeProjectId — load it
                _loadProjectIntoUI(getActiveProject());
            }
            persistProjects();
            renderSidebar();
            if (wasActive) showStatus(t('status.projectDeleted', { name: escapeHtml(getActiveProject()?.name) }), 'success');
        },

        pmRenameProject: (id) => {
            const proj = getAllProjects().find(p => p.id === id);
            const newName = prompt(t('project.prompt.rename'), proj?.name || '');
            if (newName === null || !newName.trim()) return;
            renameProject(id, newName.trim());
            persistProjects();
            renderSidebar();
        },

        pmToggleSidebar: () => {
            const isMobile = window.innerWidth <= 768;
            const sidebar  = document.getElementById('sidebar');
            if (isMobile) {
                const isOpen = sidebar?.classList.contains('sb-mobile-open');
                _setSidebarState(!isOpen);
                _sidebarOpen = !isOpen;
            } else {
                _setSidebarState(!_sidebarOpen);
            }
        },
        pmFilterProjects: (text) => renderSidebar(text),
    });
});
