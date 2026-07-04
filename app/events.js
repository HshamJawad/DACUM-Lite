// ============================================================
// events.js — Feature Functions & Event Binding Layer
// ============================================================
import { t, getLang }                           from './i18n.js';
// arabic-font.js no longer used for PDF export (html2canvas renders natively)
import { AppState, StateManager }               from './state.js';
import {
    pushCommand, undo, redo,
    makeAddDutyCmd, makeDeleteDutyCmd,
    makeAddTaskCmd, makeDeleteTaskCmd,
    makeClearAllCmd,
    updateHistoryButtons
} from './history.js';
import { saveToLocalStorage, loadFromLocalStorage } from './storage.js';
import { Renderer } from './renderer.js';
import { showStatus } from './design-system.js';
import { exportProject, importProject } from './fileEngine.js';

// ── Image state (module-level) ────────────────────────────────
export let producedForImage = null;
export let producedByImage  = null;
export function setProducedForImage(v) { producedForImage = v; }
export function setProducedByImage(v)  { producedByImage  = v; }

// ── Active tab tracking (Phase 1 — Tab Stability) ─────────────
// Single source of truth for which tab is currently active.
// Updated on every tab click; used by restoreActiveTab() to
// rebuild correct DOM state after any re-render or view toggle.
let _activeTabId = 'info-tab';

export function getActiveTabId()    { return _activeTabId; }
export function setActiveTabId(id)  { _activeTabId = id; }

/**
 * Restore the correct tab to "active" state in the DOM.
 * Safe to call any time the app is in table/tab view.
 * Does nothing when card view is active (tabs are hidden then).
 */
export function restoreActiveTab() {
    // Do not interfere while card view owns the screen
    const cardContainer = document.getElementById('cardViewContainer');
    if (cardContainer && cardContainer.style.display === 'block') return;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = '';          // let CSS .active rule control visibility
    });

    const tabBtn = document.querySelector(`[data-tab="${_activeTabId}"]`);
    const tabEl  = document.getElementById(_activeTabId);
    if (tabBtn) tabBtn.classList.add('active');
    if (tabEl)  tabEl.classList.add('active');

    // Sync sidebar nav active state
    document.querySelectorAll('.sb-nav-item').forEach(i => i.classList.remove('sb-nav-active'));
    const navItem = document.querySelector(`.sb-nav-item[data-tab="${_activeTabId}"]`);
    if (navItem) navItem.classList.add('sb-nav-active');
}

// ── Custom section counter ────────────────────────────────────
let customSectionCounter = 0;

// ══════════════════════════════════════════════════════════════
//  DUTY & TASK MANAGEMENT
// ══════════════════════════════════════════════════════════════

export function addDuty() {
    AppState.dutyCount++;
    const dutyId = 'duty_' + AppState.dutyCount;
    AppState.taskCounts[dutyId] = 1;   // start with 1 task
    const taskId = 'task_' + dutyId + '_1';
    const dutyObj = { id: dutyId, title: '', tasks: [{ id: taskId, text: '' }] };
    const cmd = makeAddDutyCmd(dutyObj);
    cmd.execute();
    pushCommand(cmd);
    Renderer.renderAll(StateManager.state);
}

export function removeDuty(dutyId) {
    const cmd = makeDeleteDutyCmd(dutyId);
    cmd.execute();
    pushCommand(cmd);
    Renderer.renderAll(StateManager.state);
}

export function addTask(dutyId) {
    AppState.taskCounts[dutyId] = (AppState.taskCounts[dutyId] || 0) + 1;
    const taskId = 'task_' + dutyId + '_' + AppState.taskCounts[dutyId];
    const taskObj = { id: taskId, text: '' };
    const cmd = makeAddTaskCmd(dutyId, taskObj);
    cmd.execute();
    pushCommand(cmd);
    Renderer.renderAll(StateManager.state);
}

export function removeTask(taskId) {
    const cmd = makeDeleteTaskCmd(taskId);
    cmd.execute();
    pushCommand(cmd);
    Renderer.renderAll(StateManager.state);
}

export function clearDuty(dutyId) {
    if (confirm(t('confirm.clearDuty'))) {
        const duty = AppState.duties.find(d => d.id === dutyId);
        if (duty) {
            duty.title = '';
            duty.tasks.forEach(t => { t.text = ''; });
        }
        saveToLocalStorage();
        updateHistoryButtons();
        Renderer.renderAll(StateManager.state);
        showStatus(t('status.dutyCleared'), 'success');
    }
}

export function cvAddDuty() { addDuty(); }

// ── View helpers ─────────────────────────────────────────────
export function showTableView() { if (AppState.isCardView) toggleCardView(); }
export function showCardView()  { if (!AppState.isCardView) toggleCardView(); }

// ══════════════════════════════════════════════════════════════
//  WALL VIEW  (v3.1)
// ══════════════════════════════════════════════════════════════

let _wallZoom = 100;

export function showWallView() {
    const container = document.getElementById('wallViewContainer');
    if (!container) return;
    Renderer.renderWallView(StateManager.state);
    _wallZoom = 100;
    _applyWallZoom();
    container.classList.add('wv-visible');
    document.body.style.overflow = 'hidden';
}

export function exitWallView() {
    const container = document.getElementById('wallViewContainer');
    if (!container) return;
    container.classList.remove('wv-visible');
    document.body.style.overflow = '';
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    const fsBtn = document.getElementById('wvFullscreenBtn');
    if (fsBtn) fsBtn.textContent = t('wall.fullscreen');
}

export function wallViewZoom(delta) {
    _wallZoom = Math.max(25, Math.min(200, _wallZoom + delta));
    _applyWallZoom();
}

export function resetWallZoom() {
    _wallZoom = 100;
    _applyWallZoom();
}

function _applyWallZoom() {
    const chart = document.getElementById('wvChart');
    const label = document.getElementById('wvZoomLevel');
    if (chart) chart.style.zoom = _wallZoom / 100;
    if (label) label.textContent = _wallZoom + '%';
}

export function printWallView() {
    const chart = document.getElementById('wvChart');
    const prev  = _wallZoom;
    if (chart) chart.style.zoom = 0.70;
    window.print();
    setTimeout(() => { if (chart) chart.style.zoom = prev / 100; }, 500);
}

export function toggleWallFullscreen() {
    const container = document.getElementById('wallViewContainer');
    const btn       = document.getElementById('wvFullscreenBtn');
    if (!container) return;
    if (!document.fullscreenElement) {
        container.requestFullscreen()
            .then(() => { if (btn) btn.textContent = t('wall.exitFullscreen'); })
            .catch(err => console.warn('[WallView] Fullscreen error:', err));
    } else {
        document.exitFullscreen()
            .then(() => { if (btn) btn.textContent = t('wall.fullscreen'); });
    }
}

// ── Card / Table view toggle ──────────────────────────────────
// Only shows/hides #cardViewContainer vs #tableViewArea.
// The .tabs bar and sibling .tab-content panels are NEVER touched.
export function toggleCardView() {
    AppState.isCardView = !AppState.isCardView;
    _applyCardViewDOM(AppState.isCardView);
    localStorage.setItem('preferredView', AppState.isCardView ? 'card' : 'table');
    // Render only the now-visible view, not both
    if (AppState.isCardView) {
        Renderer.renderCardView(StateManager.state);
    } else {
        Renderer.renderTableView(StateManager.state);
    }
}

/**
 * Sync card/table DOM visibility without triggering a render.
 * Called by toggleCardView and by app.js _syncViewDOM.
 * Exported so app.js can import and reuse the same logic.
 */
export function _applyCardViewDOM(isCardView) {
    const cardContainer  = document.getElementById('cardViewContainer');
    const tableViewArea  = document.getElementById('tableViewArea');
    if (isCardView) {
        if (tableViewArea)  tableViewArea.style.display  = 'none';
        if (cardContainer)  cardContainer.style.display  = 'block';
    } else {
        if (cardContainer)  cardContainer.style.display  = 'none';
        if (tableViewArea)  tableViewArea.style.display  = '';
    }
}

// ══════════════════════════════════════════════════════════════
//  CLEAR ALL
// ══════════════════════════════════════════════════════════════

export function clearAll() {
    if (!confirm(t('confirm.clearAll'))) return;

    // Clear Chart Info fields
    ['dacumDate', 'producedFor', 'producedBy', 'sector', 'occupationTitle', 'jobTitle']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    // Clear images
    producedForImage = null;
    producedByImage  = null;
    AppState.chartImages = { producedFor: null, producedBy: null };
    _clearImagePreview('producedFor');
    _clearImagePreview('producedBy');

    // Build and push CLEAR_ALL command
    const cmd = makeClearAllCmd(AppState.duties, AppState.dutyCount, AppState.taskCounts);
    cmd.execute();
    pushCommand(cmd);

    // Reset to table view if card view was active — use the same
    // inner-container toggle so the .tabs bar is never touched.
    if (AppState.isCardView) {
        AppState.isCardView = false;
        _applyCardViewDOM(false);
    }

    // Reset Additional Info headings to current-language defaults
    const headingDefaults = {
        knowledgeHeading:  t('section.knowledge'),
        skillsHeading:     t('section.skills'),
        behaviorsHeading:  t('section.behaviors'),
        toolsHeading:      t('section.tools'),
        trendsHeading:     t('section.trends'),
        acronymsHeading:   t('section.acronyms'),
        careerPathHeading: t('section.careerPath'),
    };
    Object.entries(headingDefaults).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });

    // Clear Additional Info textareas
    ['knowledgeInput','skillsInput','behaviorsInput','toolsInput',
     'trendsInput','acronymsInput','careerPathInput'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // Clear custom sections
    const csc = document.getElementById('customSectionsContainer');
    if (csc) csc.innerHTML = '';
    customSectionCounter = 0;

    // Switch to Chart Info tab
    _activeTabId = 'info-tab';                         // ← Phase 1 fix
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="info-tab"]').classList.add('active');
    document.getElementById('info-tab').classList.add('active');

    saveToLocalStorage();
    updateHistoryButtons();
    Renderer.renderAll(StateManager.state);
    showStatus(t('status.allCleared'), 'success');
}

function _clearImagePreview(type) {
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    const preview = document.getElementById(type + 'ImagePreview');
    const removeBtn = document.getElementById('remove' + cap + 'Image');
    const fileInput = document.getElementById(type + 'ImageInput');
    if (preview)   { preview.innerHTML = '<span class="image-preview-placeholder">' + t('chartInfo.noImage') + '</span>'; preview.classList.remove('has-image'); }
    if (removeBtn) removeBtn.style.display = 'none';
    if (fileInput) fileInput.value = '';
}

// ══════════════════════════════════════════════════════════════
//  IMAGE UPLOAD
// ══════════════════════════════════════════════════════════════

export function handleImageUpload(event, imageType) {
    const file = event.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
        showStatus(t('status.imageBadType'), 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        const imageData = e.target.result;
        if (imageType === 'producedFor') {
            producedForImage = imageData;
            AppState.chartImages.producedFor = imageData;
        } else if (imageType === 'producedBy') {
            producedByImage = imageData;
            AppState.chartImages.producedBy = imageData;
        }
        const cap = imageType.charAt(0).toUpperCase() + imageType.slice(1);
        const preview = document.getElementById(imageType + 'ImagePreview');
        if (preview) { preview.innerHTML = `<img src="${imageData}" alt="${imageType} logo">`; preview.classList.add('has-image'); }
        const removeBtn = document.getElementById('remove' + cap + 'Image');
        if (removeBtn) removeBtn.style.display = 'inline-block';
        showStatus(t('status.imageUploaded'), 'success');
    };
    reader.readAsDataURL(file);
}

export function removeImage(imageType) {
    if (!confirm(t('confirm.removeImage'))) return;
    if (imageType === 'producedFor') {
        producedForImage = null;
        AppState.chartImages.producedFor = null;
    } else if (imageType === 'producedBy') {
        producedByImage = null;
        AppState.chartImages.producedBy = null;
    }
    _clearImagePreview(imageType);
    showStatus(t('status.imageRemoved'), 'success');
}

// ══════════════════════════════════════════════════════════════
//  INFO BOX
// ══════════════════════════════════════════════════════════════

export function toggleInfoBox() {
    const content = document.getElementById('infoBoxContent');
    const btn     = document.querySelector('.btn-toggle-info');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.textContent = t('infobox.hide');
    } else {
        content.style.display = 'none';
        btn.textContent = t('infobox.show');
    }
}

// ══════════════════════════════════════════════════════════════
//  SECTION MANAGEMENT (Additional Info)
// ══════════════════════════════════════════════════════════════

export function toggleEditHeading(headingId) {
    const heading    = document.getElementById(headingId);
    const isEditable = heading.getAttribute('contenteditable') === 'true';
    if (isEditable) {
        heading.setAttribute('contenteditable', 'false');
        heading.style.cursor = '';
        showStatus(t('status.headingUpdated'), 'success');
    } else {
        heading.setAttribute('contenteditable', 'true');
        heading.focus();
        const range = document.createRange();
        range.selectNodeContents(heading);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

export function clearSection(inputId, headingId, defaultHeading) {
    if (!confirm(t('confirm.clearSection'))) return;
    const input   = document.getElementById(inputId);
    const heading = document.getElementById(headingId);

    // Map known headingIds to their translation keys so the reset
    // text always matches the active language, regardless of which
    // language was set when the Clear button was last rendered.
    const headingKeyMap = {
        knowledgeHeading:  'section.knowledge',
        skillsHeading:     'section.skills',
        behaviorsHeading:  'section.behaviors',
        toolsHeading:      'section.tools',
        trendsHeading:     'section.trends',
        acronymsHeading:   'section.acronyms',
        careerPathHeading: 'section.careerPath',
    };
    const resetText = headingKeyMap[headingId]
        ? t(headingKeyMap[headingId])
        : defaultHeading;   // custom sections fall back to passed-in default

    if (input)   input.value = '';
    if (heading) { heading.textContent = resetText; heading.setAttribute('contenteditable', 'false'); }
    showStatus(t('status.sectionCleared'), 'success');
}

export function addCustomSection() {
    customSectionCounter++;
    const sectionId = `customSection${customSectionCounter}`;
    const headingId = `${sectionId}Heading`;
    const inputId   = `${sectionId}Input`;
    const container = document.getElementById('customSectionsContainer');

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section-container';
    sectionDiv.id = sectionId;

    // Capture translated strings at creation time (used in onclick defaults)
    const sectionTitle = t('section.custom', { n: customSectionCounter });

    sectionDiv.innerHTML = `
        <div class="section-header-editable">
            <h3 id="${headingId}" contenteditable="false">${sectionTitle}</h3>
            <div class="section-header-actions">
                <button class="btn-rename" onclick="window.toggleEditHeading('${headingId}')">${t('additionalInfo.rename')}</button>
                <button class="btn-clear-section" onclick="window.clearSection('${inputId}', '${headingId}', '${sectionTitle}')">${t('additionalInfo.clear')}</button>
                <button class="btn-remove-section" onclick="window.removeCustomSection('${sectionId}')">${t('section.removeBtn')}</button>
            </div>
        </div>
        <textarea id="${inputId}" placeholder="${t('section.custom.ph')}"></textarea>
    `;
    container.appendChild(sectionDiv);
    showStatus(t('status.customSectionAdded'), 'success');
}

export function removeCustomSection(sectionId) {
    if (!confirm(t('confirm.removeSection'))) return;
    const section = document.getElementById(sectionId);
    if (section) { section.remove(); showStatus(t('status.sectionRemoved'), 'success'); }
}

// ══════════════════════════════════════════════════════════════
//  SAVE / LOAD JSON
// ══════════════════════════════════════════════════════════════

export function saveToJSON() {
    try {
        const data = {
            version: '1.0',
            savedDate: new Date().toISOString(),
            chartInfo: {
                dacumDate:        document.getElementById('dacumDate').value,
                producedFor:      document.getElementById('producedFor').value,
                producedBy:       document.getElementById('producedBy').value,
                occupationTitle:  document.getElementById('occupationTitle').value,
                jobTitle:         document.getElementById('jobTitle').value,
                producedForImage,
                producedByImage
            },
            duties: AppState.duties.map(duty => ({
                duty:  duty.title,
                tasks: duty.tasks.map(t => t.text).filter(t => t.trim() !== '')
            })),
            additionalInfo: {
                headings: {
                    knowledge:  document.getElementById('knowledgeHeading').textContent,
                    skills:     document.getElementById('skillsHeading').textContent,
                    behaviors:  document.getElementById('behaviorsHeading').textContent,
                    tools:      document.getElementById('toolsHeading').textContent,
                    trends:     document.getElementById('trendsHeading').textContent,
                    acronyms:   document.getElementById('acronymsHeading').textContent,
                    careerPath: document.getElementById('careerPathHeading').textContent
                },
                knowledge:  document.getElementById('knowledgeInput').value,
                skills:     document.getElementById('skillsInput').value,
                behaviors:  document.getElementById('behaviorsInput').value,
                tools:      document.getElementById('toolsInput').value,
                trends:     document.getElementById('trendsInput').value,
                acronyms:   document.getElementById('acronymsInput').value,
                careerPath: document.getElementById('careerPathInput').value
            },
            customSections: []
        };

        document.querySelectorAll('#customSectionsContainer .section-container').forEach(div => {
            const h = div.querySelector('h3');
            const t = div.querySelector('textarea');
            if (h && t) data.customSections.push({ heading: h.textContent, content: t.value });
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(data.chartInfo.occupationTitle || 'DACUM_Chart').replace(/[^a-z0-9]/gi,'_')}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showStatus(t('status.dataSaved'), 'success');
    } catch (err) {
        console.error('Error saving data:', err);
        showStatus(t('status.dataSaveError', { msg: err.message }), 'error');
    }
}

export function loadFromJSON(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);

                // Chart Info
                if (data.chartInfo) {
                    ['dacumDate','producedFor','producedBy','occupationTitle','jobTitle']
                        .forEach(id => {
                            const el = document.getElementById(id);
                            if (el) el.value = data.chartInfo[id] || '';
                        });
                    if (data.chartInfo.producedForImage) {
                        producedForImage = data.chartInfo.producedForImage;
                        const p = document.getElementById('producedForImagePreview');
                        if (p) { p.innerHTML = `<img src="${producedForImage}" alt="Produced For logo">`; p.classList.add('has-image'); }
                        const r = document.getElementById('removeProducedForImage');
                        if (r) r.style.display = 'inline-block';
                    }
                    if (data.chartInfo.producedByImage) {
                        producedByImage = data.chartInfo.producedByImage;
                        const p = document.getElementById('producedByImagePreview');
                        if (p) { p.innerHTML = `<img src="${producedByImage}" alt="Produced By logo">`; p.classList.add('has-image'); }
                        const r = document.getElementById('removeProducedByImage');
                        if (r) r.style.display = 'inline-block';
                    }
                }

                // Rebuild duties
                AppState.duties = [];
                AppState.dutyCount = 0;
                AppState.taskCounts = {};
                if (Array.isArray(data.duties)) {
                    data.duties.forEach(dutyData => {
                        AppState.dutyCount++;
                        const dutyId = 'duty_' + AppState.dutyCount;
                        AppState.taskCounts[dutyId] = 0;
                        const tasks = (dutyData.tasks || []).map(text => {
                            AppState.taskCounts[dutyId]++;
                            return { id: `task_${dutyId}_${AppState.taskCounts[dutyId]}`, text };
                        });
                        AppState.duties.push({ id: dutyId, title: dutyData.duty || '', tasks });
                    });
                }

                // Additional Info
                if (data.additionalInfo) {
                    if (data.additionalInfo.headings) {
                        const hm = {
                            knowledge: 'knowledgeHeading', skills: 'skillsHeading',
                            behaviors: 'behaviorsHeading', tools: 'toolsHeading',
                            trends: 'trendsHeading', acronyms: 'acronymsHeading',
                            careerPath: 'careerPathHeading'
                        };
                        Object.entries(hm).forEach(([key, id]) => {
                            const el = document.getElementById(id);
                            if (el) el.textContent = data.additionalInfo.headings[key] || el.textContent;
                        });
                    }
                    const fm = {
                        knowledge: 'knowledgeInput', skills: 'skillsInput',
                        behaviors: 'behaviorsInput', tools: 'toolsInput',
                        trends: 'trendsInput', acronyms: 'acronymsInput',
                        careerPath: 'careerPathInput'
                    };
                    Object.entries(fm).forEach(([key, id]) => {
                        const el = document.getElementById(id);
                        if (el) el.value = data.additionalInfo[key] || '';
                    });
                }

                // Custom sections
                const csc = document.getElementById('customSectionsContainer');
                if (csc) csc.innerHTML = '';
                customSectionCounter = 0;
                if (Array.isArray(data.customSections)) {
                    data.customSections.forEach(section => {
                        addCustomSection();
                        const last = document.getElementById('customSectionsContainer').lastElementChild;
                        if (last) {
                            const h = last.querySelector('h3');
                            const t = last.querySelector('textarea');
                            if (h) h.textContent = section.heading;
                            if (t) t.value = section.content;
                        }
                    });
                }

                // Reset tabs, card view, history
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.querySelector('[data-tab="info-tab"]').classList.add('active');
                document.getElementById('info-tab').classList.add('active');

                AppState.isCardView = false;
                document.getElementById('cardViewContainer').style.display = 'none';
                StateManager.undoStack = [];
                StateManager.redoStack = [];
                saveToLocalStorage();
                updateHistoryButtons();
                Renderer.renderAll(StateManager.state);
                showStatus(t('status.dataLoaded'), 'success');
                event.target.value = '';
            } catch (parseErr) {
                console.error('Error parsing JSON:', parseErr);
                showStatus(t('status.jsonParseError'), 'error');
            }
        };
        reader.readAsText(file);
    } catch (err) {
        console.error('Error loading file:', err);
        showStatus(t('status.fileLoadError', { msg: err.message }), 'error');
    }
}

// ══════════════════════════════════════════════════════════════
//  EXPORT TO WORD (DOCX)
// ══════════════════════════════════════════════════════════════

export async function exportToWord() {
    try {
        if (typeof window.docx === 'undefined') {
            showStatus(t('status.wordLibMissing'), 'error');
            return;
        }

        const { Document, Paragraph, TextRun, Table, TableRow, TableCell,
                WidthType, AlignmentType, BorderStyle, Packer, PageBreak,
                convertInchesToTwip, ShadingType, TextDirection, ImageRun } = window.docx;

        const dacumDateValue = document.getElementById('dacumDate').value;
        let dacumDate = '';
        if (dacumDateValue) {
            const dateObj = new Date(dacumDateValue + 'T00:00:00');
            dacumDate = `${String(dateObj.getMonth()+1).padStart(2,'0')}/${String(dateObj.getDate()).padStart(2,'0')}/${dateObj.getFullYear()}`;
        }
        const producedFor     = document.getElementById('producedFor').value;
        const producedBy      = document.getElementById('producedBy').value;
        const occupationTitle = document.getElementById('occupationTitle').value;
        const jobTitle        = document.getElementById('jobTitle').value;

        if (!occupationTitle || !jobTitle) {
            showStatus(t('status.pdfMissingFields'), 'error');
            return;
        }
        showStatus(t('status.wordGenerating'), 'success');
        const children = [];

        // Title page
        children.push(new Paragraph({ children: [new TextRun({ text: t('word.occupationTitle', { title: occupationTitle }), bold: true, size: 28 })], spacing: { after: 200 }, bidirectional: false }));
        children.push(new Paragraph({ children: [new TextRun({ text: t('word.jobTitle', { title: jobTitle }), bold: true, size: 28 })], spacing: { after: 200 }, bidirectional: false }));
        if (dacumDate) children.push(new Paragraph({ children: [new TextRun({ text: t('word.dacumDate', { date: dacumDate }), bold: true, size: 24 })], spacing: { after: 200 }, bidirectional: false }));

        if (producedFor) {
            children.push(new Paragraph({ children: [new TextRun({ text: t('word.producedFor', { name: producedFor }), bold: true, size: 24 })], spacing: { after: 200 }, bidirectional: false }));
            if (producedForImage) {
                try {
                    const base64Data = producedForImage.split(',')[1];
                    children.push(new Paragraph({ children: [new ImageRun({ data: Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)), transformation: { width: 94, height: 94 } })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
                } catch(e) { console.error('Error adding Produced For image:', e); }
            }
        }

        if (producedBy) {
            children.push(new Paragraph({ children: [new TextRun({ text: t('word.producedBy', { name: producedBy }), bold: true, size: 24 })], spacing: { after: 200 }, bidirectional: false }));
            if (producedByImage) {
                try {
                    const base64Data = producedByImage.split(',')[1];
                    children.push(new Paragraph({ children: [new ImageRun({ data: Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)), transformation: { width: 94, height: 94 } })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }));
                } catch(e) { console.error('Error adding Produced By image:', e); }
            }
        } else {
            children.push(new Paragraph({ spacing: { after: 200 } }));
        }

        // Duties and tasks — read from central AppState (works in any view)
        children.push(new Paragraph({ children: [new PageBreak(), new TextRun({ text: t('word.dutiesAndTasks'), bold: true, size: 28 })], alignment: AlignmentType.CENTER, spacing: { after: 300 }, bidirectional: false }));

        const duties = AppState.duties.map(d => ({
            duty:  d.title,
            tasks: d.tasks.map(t => t.text).filter(t => t.trim() !== '')
        }));

        duties.forEach((dutyData, dutyIndex) => {
            const letter = String.fromCharCode(65 + dutyIndex);
            const dutyLabel = t('word.dutyLabel', { letter, title: dutyData.duty });
            const tasksPerRow = 4;
            const numTaskRows = Math.ceil(dutyData.tasks.length / tasksPerRow);
            const tableRows = [];

            tableRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: dutyLabel, bold: true, size: 24 })], bidirectional: false })], columnSpan: 4, shading: { fill: 'E8E8E8', type: ShadingType.SOLID }, width: { size: 100, type: WidthType.PERCENTAGE } })] }));

            for (let row = 0; row < numTaskRows; row++) {
                const rowCells = [];
                for (let col = 0; col < tasksPerRow; col++) {
                    const ti = row * tasksPerRow + col;
                    if (ti < dutyData.tasks.length) {
                        const tLabel = t('word.taskLabel', { letter, n: ti + 1, text: dutyData.tasks[ti] });
                        rowCells.push(new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: tLabel, size: 24 })], bidirectional: false })], width: { size: 25, type: WidthType.PERCENTAGE } }));
                    } else {
                        rowCells.push(new TableCell({ children: [new Paragraph('')], width: { size: 25, type: WidthType.PERCENTAGE } }));
                    }
                }
                tableRows.push(new TableRow({ children: rowCells }));
            }
            children.push(new Table({ width: { size: 9071, type: WidthType.DXA }, layout: 'fixed', rows: tableRows }));
            children.push(new Paragraph({ spacing: { after: 200 } }));
        });

        // Additional info
        children.push(new Paragraph({ children: [new PageBreak(), new TextRun({ text: t('word.additionalInfo'), bold: true, size: 24 })], spacing: { after: 300 }, bidirectional: false }));

        const additionalInfoSections = [
            { heading1: document.getElementById('knowledgeHeading').textContent, content1: document.getElementById('knowledgeInput').value.trim(), heading2: document.getElementById('behaviorsHeading').textContent, content2: document.getElementById('behaviorsInput').value.trim() },
            { heading1: document.getElementById('skillsHeading').textContent,    content1: document.getElementById('skillsInput').value.trim(),    heading2: '', content2: '' },
            { heading1: document.getElementById('toolsHeading').textContent,     content1: document.getElementById('toolsInput').value.trim(),     heading2: document.getElementById('trendsHeading').textContent, content2: document.getElementById('trendsInput').value.trim() },
            { heading1: document.getElementById('acronymsHeading').textContent,  content1: document.getElementById('acronymsInput').value.trim(),  heading2: document.getElementById('careerPathHeading').textContent, content2: document.getElementById('careerPathInput').value.trim() }
        ];

        const makeTextRuns = (text, size = 24) => text.split('\n').filter(l => l.trim()).map(l => new Paragraph({ children: [new TextRun({ text: l.trim().replace(/^[•\-*]\s*/, '• '), size })], bidirectional: false }));

        additionalInfoSections.forEach((section, index) => {
            if (index === 3 && section.content1) {
                const row = new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: section.heading1, bold: true, size: 24 })], bidirectional: false })], shading: { fill: 'E8E8E8', type: ShadingType.SOLID }, width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: makeTextRuns(section.content1), width: { size: 70, type: WidthType.PERCENTAGE } })
                ] });
                children.push(new Table({ width: { size: 9071, type: WidthType.DXA }, layout: 'fixed', rows: [row] }));
                children.push(new Paragraph({ spacing: { after: 200 } }));
            } else if (section.content1 || section.content2) {
                const row = new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: section.heading1, bold: true, size: 24 })], bidirectional: false }), ...makeTextRuns(section.content1)], width: { size: 50, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: section.content2 ? [new Paragraph({ children: [new TextRun({ text: section.heading2, bold: true, size: 24 })], bidirectional: false }), ...makeTextRuns(section.content2)] : [new Paragraph('')], width: { size: 50, type: WidthType.PERCENTAGE } })
                ] });
                children.push(new Table({ width: { size: 9071, type: WidthType.DXA }, layout: 'fixed', rows: [row] }));
                children.push(new Paragraph({ spacing: { after: 200 } }));
            }
        });

        // Custom sections
        document.querySelectorAll('#customSectionsContainer .section-container').forEach(div => {
            const h = div.querySelector('h3');
            const t = div.querySelector('textarea');
            if (h && t && t.value.trim()) {
                const row = new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h.textContent, bold: true, size: 24 })], bidirectional: false }), ...makeTextRuns(t.value)], columnSpan: 2, width: { size: 100, type: WidthType.PERCENTAGE } })] });
                children.push(new Table({ width: { size: 9071, type: WidthType.DXA }, layout: 'fixed', rows: [row] }));
                children.push(new Paragraph({ spacing: { after: 200 } }));
            }
        });

        const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }] });
        const blob = await Packer.toBlob(doc);
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${occupationTitle.replace(/[^a-z0-9]/gi,'_')}_${jobTitle.replace(/[^a-z0-9]/gi,'_')}_DACUM_Chart.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showStatus(t('status.wordExported'), 'success');
    } catch (err) {
        console.error('Error generating Word document:', err);
        showStatus(t('status.wordExportError', { msg: err.message }), 'error');
    }
}

// ══════════════════════════════════════════════════════════════
//  EXPORT TO PDF
// ══════════════════════════════════════════════════════════════

export async function exportToPDF() {
    // ──────────────────────────────────────────────────────────
    // html2canvas approach
    //
    // jsPDF cannot encode Arabic Unicode Presentation Forms
    // correctly via custom TTF (U+FExx mis-encoded as Latin-1).
    // Instead:
    //   1. Build a styled HTML "print page" in a hidden iframe
    //   2. Browser shapes + renders Arabic natively (zero encoding issues)
    //   3. html2canvas captures each .page div as a canvas
    //   4. jsPDF inserts canvas images -> final PDF
    // ──────────────────────────────────────────────────────────

    const isArabic = getLang() === 'ar';
    const dir      = isArabic ? 'rtl' : 'ltr';
    const fontFace = isArabic
        ? "'Amiri', 'Noto Naskh Arabic', 'Segoe UI', sans-serif"
        : "'Helvetica Neue', Arial, sans-serif";

    try {
        if (typeof window.html2canvas === 'undefined') {
            showStatus(t('status.html2canvasMissing') || 'html2canvas library not loaded', 'error');
            return;
        }
        const { jsPDF } = window.jspdf;

        // ── Read form values ──────────────────────────────────
        const dacumDateInput       = document.getElementById('dacumDate');
        const producedForInput     = document.getElementById('producedFor');
        const producedByInput      = document.getElementById('producedBy');
        const sectorInput          = document.getElementById('sector');
        const occupationTitleInput = document.getElementById('occupationTitle');
        const jobTitleInput        = document.getElementById('jobTitle');

        let dacumDateFormatted = '';
        if (dacumDateInput.value) {
            const d = new Date(dacumDateInput.value + 'T00:00:00');
            dacumDateFormatted = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`;
        }
        if (!occupationTitleInput.value || !jobTitleInput.value) {
            alert(t('status.pdfMissingFields'));
            return;
        }

        showStatus(t('status.pdfGenerating') || 'Generating PDF\u2026', 'success');

        const duties = AppState.duties.map(d => ({
            duty:  d.title,
            tasks: d.tasks.map(tk => tk.text).filter(tk => tk.trim() !== '')
        }));

        // ── Shared CSS ────────────────────────────────────────
        const baseCSS = `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                font-family: ${fontFace};
                direction: ${dir};
                background: #fff;
                color: #111;
                font-size: 13px;
                line-height: 1.5;
            }
            .page {
                width: 1122px;
                min-height: 794px;
                padding: 48px 56px;
                background: #fff;
            }
            h1 { font-size: 22px; text-align: center; margin-bottom: 20px; color: #1e3a5f; }
            h2 { font-size: 16px; text-align: center; margin-bottom: 14px; color: #1e3a5f; }
            .info-grid { display: flex; gap: 32px; margin-bottom: 20px; }
            .info-col  { flex: 1; }
            .info-row  { margin-bottom: 8px; }
            .info-label { font-weight: bold; font-size: 12px; color: #555; }
            .info-value { font-size: 14px; color: #1e3a5f; }
            .info-img   { max-height: 60px; max-width: 140px; object-fit: contain; display: block; margin: 4px 0; }
            .grid { display: flex; gap: 0; border: 2px solid #1e3a5f; border-radius: 6px; overflow: hidden; }
            .duty-col { flex: 1; display: flex; flex-direction: column; border-inline-end: 1px solid #cbd5e1; }
            .duty-col:last-child { border-inline-end: none; }
            .duty-header {
                background: #1e3a5f;
                color: #fff;
                font-weight: bold;
                font-size: 12px;
                padding: 8px 10px;
                min-height: 44px;
                display: flex;
                align-items: flex-start;
            }
            .task-cell {
                padding: 6px 10px;
                font-size: 11px;
                border-top: 1px solid #e2e8f0;
                min-height: 34px;
                background: #fff;
            }
            .task-cell:nth-child(even) { background: #f8fafc; }
            .task-label { font-weight: bold; color: #1e3a5f; font-size: 10px; display: block; margin-bottom: 2px; }
            .section-title {
                font-size: 15px; font-weight: bold; color: #1e3a5f;
                margin-bottom: 14px; border-bottom: 2px solid #1e3a5f; padding-bottom: 6px;
            }
            .section-grid  { display: flex; gap: 28px; }
            .section-col   { flex: 1; }
            .section-col h3 { font-size: 12px; font-weight: bold; color: #334155; margin-bottom: 6px; margin-top: 12px; }
            .section-col ul { list-style: disc; padding-inline-start: 18px; font-size: 11px; }
            .section-col ul li { margin-bottom: 3px; }
        `;

        // ── Page builder helpers ──────────────────────────────

        function esc(s) {
            return String(s || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        function getDutyLetter(idx) {
            const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            return idx < 26 ? L[idx] : L[Math.floor(idx/26)-1] + L[idx%26];
        }

        function makeInfoPage() {
            const occ  = esc(occupationTitleInput.value);
            const job  = esc(jobTitleInput.value);
            const pFor = esc(producedForInput.value);
            const pBy  = esc(producedByInput.value);
            const sec  = sectorInput ? esc(sectorInput.value) : '';
            const date = esc(dacumDateFormatted);

            let leftHTML = '';
            if (pFor) {
                leftHTML += `<div class="info-row">
                    <div class="info-label">${t('pdf.producedFor')}</div>`;
                if (producedForImage)
                    leftHTML += `<img class="info-img" src="${producedForImage}">`;
                leftHTML += `<div class="info-value">${pFor}</div></div>`;
            }
            if (pBy) {
                leftHTML += `<div class="info-row">
                    <div class="info-label">${t('pdf.producedBy')}</div>`;
                if (producedByImage)
                    leftHTML += `<img class="info-img" src="${producedByImage}">`;
                leftHTML += `<div class="info-value">${pBy}</div></div>`;
            }
            if (date)
                leftHTML += `<div class="info-row"><div class="info-value">${date}</div></div>`;

            let rightHTML = '';
            if (sec)
                rightHTML += `<div class="info-row">
                    <div class="info-label">${t('pdf.sector')}</div>
                    <div class="info-value">${sec}</div></div>`;
            rightHTML += `<div class="info-row">
                <div class="info-label">${t('pdf.occupationTitle')}</div>
                <div class="info-value">${occ}</div></div>`;
            rightHTML += `<div class="info-row">
                <div class="info-label">${t('pdf.jobTitle')}</div>
                <div class="info-value">${job}</div></div>`;

            return `<div class="page">
                <h1>${t('pdf.chartTitle', { title: occupationTitleInput.value })}</h1>
                <div class="info-grid">
                    <div class="info-col">${leftHTML}</div>
                    <div class="info-col">${rightHTML}</div>
                </div>
            </div>`;
        }

        function makeDutiesPages() {
            if (duties.length === 0) return '';
            let pages = '';
            const COLS = 4;
            for (let i = 0; i < duties.length; i += COLS) {
                const chunk   = duties.slice(i, i + COLS);
                const letters = chunk.map((_, ci) => getDutyLetter(i + ci));
                const maxTasks = Math.max(...chunk.map(d => d.tasks.length), 0);

                let gridHTML = '<div class="grid">';
                chunk.forEach((duty, ci) => {
                    gridHTML += `<div class="duty-col">
                        <div class="duty-header">${letters[ci]}: ${esc(duty.duty)}</div>`;
                    for (let ti = 0; ti < maxTasks; ti++) {
                        const task = duty.tasks[ti] || '';
                        gridHTML += `<div class="task-cell">`;
                        if (task)
                            gridHTML += `<span class="task-label">${letters[ci]}${ti+1}</span>${esc(task)}`;
                        gridHTML += `</div>`;
                    }
                    gridHTML += `</div>`;
                });
                gridHTML += '</div>';

                const heading = i === 0
                    ? t('pdf.dutiesAndTasks')
                    : t('pdf.dutiesAndTasksCont');

                pages += `<div class="page"><h2>${heading}</h2>${gridHTML}</div>`;
            }
            return pages;
        }

        function makeAdditionalPage() {
            const sections = [
                { id: 'knowledgeInput',  hId: 'knowledgeHeading'  },
                { id: 'skillsInput',     hId: 'skillsHeading'     },
                { id: 'behaviorsInput',  hId: 'behaviorsHeading'  },
                { id: 'toolsInput',      hId: 'toolsHeading'      },
                { id: 'trendsInput',     hId: 'trendsHeading'     },
                { id: 'acronymsInput',   hId: 'acronymsHeading'   },
                { id: 'careerPathInput', hId: 'careerPathHeading' },
            ].map(({ id, hId }) => ({
                heading: document.getElementById(hId)?.textContent || '',
                content: document.getElementById(id)?.value.trim() || ''
            })).filter(s => s.content);

            document.querySelectorAll('#customSectionsContainer .section-container').forEach(div => {
                const h  = div.querySelector('h3');
                const ta = div.querySelector('textarea');
                if (h && ta && ta.value.trim())
                    sections.push({ heading: h.textContent, content: ta.value.trim() });
            });

            if (sections.length === 0) return '';

            const col1 = [], col2 = [], col3 = [];
            sections.forEach((s, i) => {
                if      (i % 3 === 0) col1.push(s);
                else if (i % 3 === 1) col2.push(s);
                else                  col3.push(s);
            });

            let html = `<div class="page">
                <div class="section-title">${t('word.additionalInfo')}</div>
                <div class="section-grid">`;

            [col1, col2, col3].forEach(col => {
                html += '<div class="section-col">';
                col.forEach(s => {
                    html += `<h3>${esc(s.heading)}</h3><ul>`;
                    s.content.split('\n').filter(l => l.trim()).forEach(line => {
                        html += `<li>${esc(line.trim().replace(/^[*\-\u2022]\s*/, ''))}</li>`;
                    });
                    html += '</ul>';
                });
                html += '</div>';
            });

            html += '</div></div>';
            return html;
        }

        // ── Assemble full HTML doc ────────────────────────────
        const fullHTML = [
            `<!DOCTYPE html><html lang="${isArabic ? 'ar' : 'en'}" dir="${dir}">`,
            `<head><meta charset="utf-8"><style>${baseCSS}</style></head>`,
            '<body>',
            makeInfoPage(),
            makeDutiesPages(),
            makeAdditionalPage(),
            '</body></html>'
        ].join('\n');

        // ── Render in a hidden off-screen iframe ──────────────
        const iframe = document.createElement('iframe');
        iframe.style.cssText = [
            'position:fixed', 'top:-9999px', 'left:-9999px',
            'width:1122px', 'height:794px',
            'border:none', 'visibility:hidden', 'pointer-events:none'
        ].join(';');
        document.body.appendChild(iframe);

        await new Promise(resolve => {
            iframe.onload = resolve;
            iframe.srcdoc = fullHTML;
        });

        // Extra tick: let custom fonts (Amiri via @font-face) paint
        await new Promise(r => setTimeout(r, 600));

        const iDoc  = iframe.contentDocument;
        const pages = iDoc.querySelectorAll('.page');

        if (pages.length === 0) {
            document.body.removeChild(iframe);
            showStatus(t('status.pdfNoDuties'), 'error');
            return;
        }

        // ── Capture + build PDF ───────────────────────────────
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const PW  = pdf.internal.pageSize.getWidth();   // 297 mm
        const PH  = pdf.internal.pageSize.getHeight();  // 210 mm

        for (let pi = 0; pi < pages.length; pi++) {
            const canvas = await window.html2canvas(pages[pi], {
                scale:              2,
                useCORS:            true,
                backgroundColor:    '#ffffff',
                allowTaint:         false,
                foreignObjectRendering: false,
                windowWidth:        1122,
                windowHeight:       794,
                logging:            false,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const ratio   = Math.min(PW / canvas.width, PH / canvas.height);
            const imgW    = canvas.width  * ratio;
            const imgH    = canvas.height * ratio;
            const offX    = (PW - imgW) / 2;
            const offY    = (PH - imgH) / 2;

            if (pi > 0) pdf.addPage('a4', 'landscape');
            pdf.addImage(imgData, 'JPEG', offX, offY, imgW, imgH);
        }

        document.body.removeChild(iframe);

        const safeName = (s) => s.replace(/[^a-zA-Z0-9\u0600-\u06FF_\-]/g, '_');
        pdf.save(`${safeName(occupationTitleInput.value)}_${safeName(jobTitleInput.value)}_DACUM_Chart.pdf`);
        showStatus(t('status.pdfExported'), 'success');

    } catch (err) {
        console.error('Error generating PDF:', err);
        showStatus(t('status.pdfExportError', { msg: err.message }), 'error');
    }
}

// ══════════════════════════════════════════════════════════════
//  FILE ENGINE — PROJECT EXPORT / IMPORT
//  Thin wrappers that call fileEngine.js, keeping all engine
//  logic in one place while exposing clean public functions that
//  can be bound to window.* in app.js.
// ══════════════════════════════════════════════════════════════

/**
 * Export the currently active project as a versioned .json file.
 * The projectId argument is supplied by app.js when it binds
 * this function to window.exportProjectFile.
 *
 * @param {string} projectId — id of the project to export
 */
export function exportProjectFile(projectId) {
    exportProject(projectId);
}

/**
 * Handle the <input type="file"> change event for project import.
 * Passes the selected File to the fileEngine and resets the input
 * so the same file can be re-imported if needed.
 *
 * @param {Event} event — native change event from the file input
 */
export function importProjectFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    importProject(file);
    // Reset the input so the same file path can trigger onchange again
    event.target.value = '';
}

// ══════════════════════════════════════════════════════════════
//  EVENT BINDER
// ══════════════════════════════════════════════════════════════

export const EventBinder = {
    init() {
        // ── Sidebar nav navigation ───────────────────────────────
        document.querySelectorAll('.sb-nav-item').forEach(item => {
            item.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                _activeTabId = tabId;

                // Update sidebar nav active state
                document.querySelectorAll('.sb-nav-item').forEach(i => i.classList.remove('sb-nav-active'));
                this.classList.add('sb-nav-active');

                // Update tab content visibility
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                const tabEl = document.getElementById(tabId);
                if (tabEl) tabEl.classList.add('active');

                if (tabId === 'duties-tab' && AppState.duties.length === 0) {
                    AppState.dutyCount++;
                    const initDutyId = 'duty_' + AppState.dutyCount;
                    AppState.taskCounts[initDutyId] = 1;
                    AppState.duties.push({ id: initDutyId, title: '', tasks: [{ id: 'task_' + initDutyId + '_1', text: '' }] });
                    saveToLocalStorage();
                    updateHistoryButtons();
                    Renderer.renderAll(StateManager.state);
                }
            });
        });

        // ── Tab navigation (legacy — kept for restoreActiveTab compat) ──────────────────────────────────────
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                _activeTabId = tabId;                          // ← Phase 1 fix: track active tab
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                if (tabId === 'duties-tab' && AppState.duties.length === 0) {
                    AppState.dutyCount++;
                    const initDutyId = 'duty_' + AppState.dutyCount;
                    AppState.taskCounts[initDutyId] = 1;
                    AppState.duties.push({ id: initDutyId, title: '', tasks: [{ id: 'task_' + initDutyId + '_1', text: '' }] });
                    saveToLocalStorage();
                    updateHistoryButtons();
                    Renderer.renderAll(StateManager.state);
                }
            });
        });

        // ── Keyboard shortcuts ──────────────────────────────────
        document.addEventListener('keydown', e => {
            const tag = document.activeElement ? document.activeElement.tagName : '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true') return;
            if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
            if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
        });

        // ── Close snapshot panel on outside click ───────────────
        // #floatingPanel was removed — the trigger is now #debugBtn
        // in the toolbar. Exclude it so the same click that opens the
        // panel doesn't immediately re-close it via this listener.
        document.addEventListener('click', e => {
            const panel    = document.getElementById('snapshotPanel');
            const debugBtn = document.getElementById('debugBtn');
            if (panel
                && panel.style.display === 'block'
                && !panel.contains(e.target)
                && !(debugBtn && debugBtn.contains(e.target))) {
                panel.style.display = 'none';
            }
        });

        // ── Library check ───────────────────────────────────────
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (typeof window.docx === 'undefined') console.error('Warning: docx library failed to load');
                else console.log('docx library loaded successfully');
            }, 1000);
        });
    }
};

// ══════════════════════════════════════════════════════════════
//  PROJECT SERIALISATION HELPERS
//  Called by app.js to save/restore all DOM-resident data that
//  is NOT part of AppState (chart info fields, additional info,
//  custom sections, logo images).
//  These are injected into the ProjectRecord alongside `state`
//  so per-project data survives export/import.
// ══════════════════════════════════════════════════════════════

/** Read chart-info form fields + logo images from the DOM */
export function getChartInfoData() {
    return {
        dacumDate:      document.getElementById('dacumDate')?.value      || '',
        producedFor:    document.getElementById('producedFor')?.value    || '',
        producedBy:     document.getElementById('producedBy')?.value     || '',
        sector:         document.getElementById('sector')?.value         || '',
        occupationTitle:document.getElementById('occupationTitle')?.value|| '',
        jobTitle:       document.getElementById('jobTitle')?.value       || '',
        scopeOfWork:    document.getElementById('scopeOfWork')?.value    || '',
        facilitators:   document.getElementById('facilitators')?.value   || '',
        observers:      document.getElementById('observers')?.value      || '',
        panelMembers:   document.getElementById('panelMembers')?.value   || '',
    };
}

/**
 * Restore logo images from AppState.chartImages into the module-level
 * variables and the DOM preview elements.
 * Called by _loadProjectIntoUI in app.js after applyProjectState().
 */
export function applyChartImages(chartImages) {
    const pf = chartImages?.producedFor || null;
    const pb = chartImages?.producedBy  || null;
    producedForImage = pf;
    producedByImage  = pb;
    _restoreImagePreview('producedFor', pf);
    _restoreImagePreview('producedBy',  pb);
}

/** Restore chart-info text fields to the DOM */
export function applyChartInfoData(info) {
    if (!info || typeof info !== 'object') return;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    set('dacumDate',       info.dacumDate);
    set('producedFor',     info.producedFor);
    set('producedBy',      info.producedBy);
    set('sector',          info.sector);
    set('occupationTitle', info.occupationTitle);
    set('jobTitle',        info.jobTitle);
    set('scopeOfWork',     info.scopeOfWork);
    set('facilitators',    info.facilitators);
    set('observers',       info.observers);
    set('panelMembers',    info.panelMembers);
}

function _restoreImagePreview(type, imageData) {
    const cap       = type.charAt(0).toUpperCase() + type.slice(1);
    const preview   = document.getElementById(type + 'ImagePreview');
    const removeBtn = document.getElementById('remove' + cap + 'Image');
    if (imageData) {
        if (type === 'producedFor') producedForImage = imageData;
        else                        producedByImage  = imageData;
        if (preview) {
            preview.innerHTML = `<img src="${imageData}" alt="Logo" style="max-width:100%;max-height:100%;object-fit:contain;">`;
            preview.classList.add('has-image');
        }
        if (removeBtn) removeBtn.style.display = '';
    } else {
        if (type === 'producedFor') producedForImage = null;
        else                        producedByImage  = null;
        if (preview) {
            const noImgText = document.documentElement.lang === 'ar' ? 'لا توجد صورة' : 'No image';
            preview.innerHTML = `<span class="image-preview-placeholder">${noImgText}</span>`;
            preview.classList.remove('has-image');
        }
        if (removeBtn) removeBtn.style.display = 'none';
    }
}

/** Read additional-info textareas + headings from the DOM */
export function getAdditionalInfoData() {
    const fixed = [
        { inputId: 'knowledgeInput',  headingId: 'knowledgeHeading'  },
        { inputId: 'skillsInput',     headingId: 'skillsHeading'     },
        { inputId: 'behaviorsInput',  headingId: 'behaviorsHeading'  },
        { inputId: 'toolsInput',      headingId: 'toolsHeading'      },
        { inputId: 'trendsInput',     headingId: 'trendsHeading'     },
        { inputId: 'acronymsInput',   headingId: 'acronymsHeading'   },
        { inputId: 'careerPathInput', headingId: 'careerPathHeading' },
    ].map(({ inputId, headingId }) => ({
        inputId,
        headingId,
        content: document.getElementById(inputId)?.value  || '',
        heading: document.getElementById(headingId)?.textContent?.trim() || '',
    }));

    // Custom sections
    const custom = [];
    const container = document.getElementById('customSectionsContainer');
    if (container) {
        container.querySelectorAll('.section-container').forEach(sec => {
            const h3    = sec.querySelector('h3');
            const ta    = sec.querySelector('textarea');
            if (h3 && ta) {
                custom.push({
                    id:      sec.id,
                    heading: h3.textContent.trim(),
                    content: ta.value,
                });
            }
        });
    }
    return { fixed, custom };
}

/** Restore additional-info textareas + headings + custom sections */
export function applyAdditionalInfoData(info) {
    if (!info || typeof info !== 'object') return;

    // Fixed sections
    if (Array.isArray(info.fixed)) {
        info.fixed.forEach(({ inputId, headingId, content, heading }) => {
            const input   = document.getElementById(inputId);
            const headEl  = document.getElementById(headingId);
            if (input)  input.value = content  || '';
            if (headEl) headEl.textContent = heading || headEl.textContent;
        });
    }

    // Custom sections — rebuild DOM
    const container = document.getElementById('customSectionsContainer');
    if (container && Array.isArray(info.custom)) {
        container.innerHTML = '';
        customSectionCounter = 0;
        info.custom.forEach(sec => {
            customSectionCounter++;
            const sectionId = `customSection${customSectionCounter}`;
            const headingId = `${sectionId}Heading`;
            const inputId   = `${sectionId}Input`;
            const div = document.createElement('div');
            div.className = 'section-container';
            div.id = sectionId;
            div.innerHTML = `
                <div class="section-header-editable">
                    <h3 id="${headingId}" contenteditable="false">${sec.heading || ''}</h3>
                    <div class="section-header-actions">
                        <button class="btn-rename" onclick="window.toggleEditHeading('${headingId}')">✏️ Rename</button>
                        <button class="btn-clear-section" onclick="window.clearSection('${inputId}','${headingId}','${sec.heading || ''}')">🗑️ Clear</button>
                        <button class="btn-remove-section" onclick="window.removeCustomSection('${sectionId}')">❌ Remove</button>
                    </div>
                </div>
                <textarea id="${inputId}" placeholder="Enter information for this custom section on separate lines">${sec.content || ''}</textarea>
            `;
            container.appendChild(div);
        });
    }
}
