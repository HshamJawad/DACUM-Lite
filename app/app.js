// NOTE: the former `const APP_VERSION = "3.0.0"` that sat here has been
// removed. It was never read anywhere in this file, and it had drifted
// three major versions behind the real number. version.js is the single
// source of truth (update-notifier.js and sw.js both read it); a second,
// silent copy of a version string is a bug waiting to be believed.
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
    toggleEditHeading, clearSection,
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
    // Project serialisation helpers (chart info + additional info)
    getChartInfoData, applyChartInfoData,
    getAdditionalInfoData, applyAdditionalInfoData,
} from './events.js';
import { isDrawerMode, onViewportModeChange,
         initViewportMode }                     from './viewport-mode.js';
import {
    createProject, deleteProject, renameProject,
    setActiveProject, getActiveProject, getAllProjects,
    persistProjects, loadProjects,
    updateActiveProjectData, injectProject,
    configurePersistence, getStorageStats
} from './project-manager.js';

// ══════════════════════════════════════════════════════════════
//  COLOR THEME TOGGLE (Default → Palette 1 → Palette 2 → …)
//  Self-contained: no imports needed. The bootstrap <script> in
//  index.html already applies the stored theme to <html> before
//  first paint (to avoid a flash) — this section just wires the
//  toolbar button, keeps its label in sync, and updates the PWA
//  theme-color meta tag. Shares the same localStorage key used
//  by the landing page so the preference carries over between
//  the two pages.
// ══════════════════════════════════════════════════════════════
const THEME_KEY    = 'dacum_theme_palette';
const THEME_ORDER  = ['default', 'palette1', 'palette2'];
const THEME_SWATCH = { default: '#6366f1', palette1: '#6595BF', palette2: '#639A87' };
const THEME_LABEL  = {
    default:  'Theme 1',
    palette1: 'Theme 2',
    palette2: 'Theme 3',
};

function _applyThemeUI(theme) {
    const fullLabel = document.getElementById('themeLabelFull');
    const mobileLabel = document.getElementById('themeLabelMobile');
    const label = THEME_LABEL[theme] || THEME_LABEL.default;
    if (fullLabel)   fullLabel.textContent = ' ' + label;
    if (mobileLabel) mobileLabel.textContent = label;

    const meta = document.getElementById('metaThemeColor');
    if (meta) meta.setAttribute('content', THEME_SWATCH[theme] || THEME_SWATCH.default);
}

function cycleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'default';
    const idx     = THEME_ORDER.indexOf(current);
    const next    = THEME_ORDER[(idx + 1) % THEME_ORDER.length];

    if (next === 'default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);

    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable */ }
    _applyThemeUI(next);
}

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

// ── Wire persistence failure reporting ─────────────────────────
// project-manager.js is a pure data layer and cannot show anything
// itself, so it hands the failure back here.
//
// A silent write failure is the worst outcome this app can produce:
// the user keeps typing, every card looks saved, and the whole
// session is gone on the next reload. So this path is deliberately
// loud — a blocking alert, not a toast that can scroll past.
//
// It fires at most once per broken streak (the latch lives in
// project-manager.js), so a full disk cannot turn every keystroke
// into a modal.
configurePersistence({
    onError: ({ quota, bytes, projects }) => {
        const kb  = Math.round(bytes / 1024);
        const msg = quota
            ? t('status.storageFull', { kb, projects })
            : t('status.storageError');

        showStatus(msg, 'error');

        // The toast alone is not enough here: the user must not be
        // able to keep working in the belief that the work is safe.
        setTimeout(() => alert(msg), 50);

        if (window.DacumErrors) {
            window.DacumErrors.report(new Error('persistProjects failed'),
                { quota, bytes, projects });
        }
    }
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

    // 4. Restore Chart Info + Additional Info DOM fields
    //    (stored at proj.chartInfo / proj.additionalInfo since this fix)
    //    Backward-compatible: old records without these keys → DOM stays blank
    applyChartInfoData(proj.chartInfo || null);
    applyAdditionalInfoData(proj.additionalInfo || null);

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

// ══════════════════════════════════════════════════════════════
//  SIDEBAR STATE
//  ------------------------------------------------------------
//  Single source of truth for the sidebar. The governing rule is
//  that the two modes are MUTUALLY EXCLUSIVE: the drawer class and
//  the desktop mini-rail class must never coexist on the page.
//
//  That is precisely what used to break. Rotating a phone to
//  landscape crossed the old 768px line into desktop mode, which
//  added `sb-sidebar-closed`. Rotating back to portrait never
//  removed it, and in RTL the leftover class translated the panel
//  -260px from `right:0` — INTO the screen instead of out of it.
//  With no `sb-mobile-open` there was no backdrop either, so it
//  could not be dismissed by tapping. Hence the stranded panel.
//
//  isDrawerMode() reads --sb-mode straight out of CSS rather than
//  recomputing a threshold here, so the two can no longer drift.
// ══════════════════════════════════════════════════════════════
const isMobileView = isDrawerMode;   // نفس الاسم القديم للتوافق

function _setSidebarState(open) {
    _sidebarOpen = open;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const body    = document.body;
    const drawer  = isDrawerMode();

    if (drawer) {
        // إزالة فئة سطح المكتب هي الإصلاح الجوهري — بدونها يبقى
        // الشريط عالقاً في منتصف الشاشة بعد أي دورة تدوير.
        body.classList.remove('sb-sidebar-closed');
        sidebar?.classList.toggle('sb-mobile-open',     open);
        overlay?.classList.toggle('sb-overlay-visible', open);
    } else {
        sidebar?.classList.remove('sb-mobile-open');
        overlay?.classList.remove('sb-overlay-visible');
        body.classList.toggle('sb-sidebar-closed', !open);
    }

    body.classList.toggle('sb-mobile-locked', drawer && open);
    sidebar?.setAttribute('aria-hidden', String(drawer && !open));
}

/**
 * إعادة مزامنة الشريط مع المقاس والاتجاه الحاليين.
 * تُستدعى عند كل حدث قد يغيّر السياق: تبدّل وضع العرض، تبديل
 * اللغة (يقلب dir فيقفز الشريط من يمين لِيسار)، أو العودة من
 * الخلفية. آمنة للاستدعاء المتكرر.
 */
function _syncSidebar() {
    if (isDrawerMode()) {
        // الافتراضي على الدرج: مغلق — إلا إن كان المستخدم فتحه للتوّ
        const stillOpen = !!document.getElementById('sidebar')
                              ?.classList.contains('sb-mobile-open');
        _setSidebarState(stillOpen);
    } else {
        _setSidebarState(_sidebarOpen);
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

    // ── 0. Sync theme toggle label with whatever the bootstrap
    //       script already applied to <html> before first paint ──
    _applyThemeUI(document.documentElement.getAttribute('data-theme') || 'default');

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

    // ── 5. Sidebar initial state (الدرج يبدأ مغلقاً) ───────────
    initViewportMode();
    _setSidebarState(!isDrawerMode());

    // ── 6. مزامنة الشريط مع كل تبدّل في وضع العرض ──────────────
    //   الكود القديم كان يستمع لـ resize وينظّف عند الانتقال إلى
    //   سطح المكتب فقط — لا فرع للاتجاه المعاكس، وهو ما ترك فئة
    //   sb-sidebar-closed عالقة على الموبايل.
    //
    //   onViewportModeChange يصفّي الضجيج أيضاً: لا يُطلق عند ظهور
    //   لوحة مفاتيح أندرويد ولا عند إخفاء شريط عنوان المتصفح —
    //   وكلاهما يغيّر innerHeight ويُطلق resize بلا داعٍ.
    onViewportModeChange(() => _syncSidebar());

    // تبديل اللغة يقلب dir، فينتقل الشريط من حافة إلى أخرى
    document.addEventListener('dacum:langchange', _syncSidebar);

    // ── 7. Swipe gesture (mobile) ─────────────────────────────
    (function initSwipe() {
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping   = false;
        const EDGE_ZONE  = 28;   // px from the opening edge
        const THRESHOLD  = 60;   // min horizontal swipe distance
        const ANGLE_LIMIT = 30;  // max vertical angle (degrees)

        document.addEventListener('touchstart', e => {
            if (!isDrawerMode()) return;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            // في RTL يخرج الدرج من الحافة اليمنى، فالمنطقة الحسّاسة
            // تنقلب معه. الكود القديم كان يفترض اليسار دائماً، فكان
            // فتح الدرج بالسحب متعذّراً في الواجهة العربية.
            const sidebar = document.getElementById('sidebar');
            const isOpen  = !!sidebar?.classList.contains('sb-mobile-open');
            const rtl     = document.documentElement.getAttribute('dir') === 'rtl';
            const atEdge  = rtl
                ? touchStartX >= (window.innerWidth - EDGE_ZONE)
                : touchStartX <= EDGE_ZONE;
            isSwiping = (atEdge && !isOpen) || isOpen;
        }, { passive: true });

        document.addEventListener('touchend', e => {
            if (!isSwiping || !isDrawerMode()) return;
            isSwiping = false;
            const touch  = e.changedTouches[0];
            const dx     = touch.clientX - touchStartX;
            const dy     = touch.clientY - touchStartY;
            const angle  = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
            // Only count near-horizontal swipes
            if (angle > ANGLE_LIMIT && angle < (180 - ANGLE_LIMIT)) return;

            const sidebar = document.getElementById('sidebar');
            const isOpen  = !!sidebar?.classList.contains('sb-mobile-open');
            const rtl     = document.documentElement.getAttribute('dir') === 'rtl';
            // «نحو الداخل» يعتمد على الاتجاه: يميناً في LTR، يساراً في RTL
            const openDx  = rtl ? -dx : dx;

            if (!isOpen && openDx > THRESHOLD)      _setSidebarState(true);
            else if (isOpen && openDx < -THRESHOLD) _setSidebarState(false);
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
            const sidebar = document.getElementById('sidebar');
            const isOpen  = isDrawerMode()
                ? !!sidebar?.classList.contains('sb-mobile-open')
                : _sidebarOpen;
            _setSidebarState(!isOpen);
        },
        // مخرج طوارئ: إن عاد الشريط للتعلّق لأي سبب مستقبلي،
        // نادِ pmResetSidebar() من الطرفية.
        pmResetSidebar: () => {
            document.body.classList.remove('sb-sidebar-closed', 'sb-mobile-locked');
            document.getElementById('sidebar')?.classList.remove('sb-mobile-open');
            document.getElementById('sidebarOverlay')?.classList.remove('sb-overlay-visible');
            _syncSidebar();
        },
        pmFilterProjects: (text) => renderSidebar(text),

        // ── Color Theme Toggle ────────────────────────────────────
        cycleTheme,
    });

    // كل الدوالّ صارت على window الآن. أعلِم boot-bridge.js ليشغّل
    // أي ضغطة وقعت قبل هذه اللحظة — وسوم <script type="module">
    // مؤجَّلة، فالأزرار تظهر وتُضغط قبل تنفيذ الكتلة أعلاه.
    window.__dacumReady?.();
});
