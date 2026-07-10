// ============================================================
// events.js — Feature Functions & Event Binding Layer
// ============================================================
import { t, getLang, applyTranslations }        from './i18n.js';
import { loadArabicFont, getArabicFontName }    from './arabic-font.js';
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
    ['dacumDate', 'producedFor', 'producedBy', 'occupationTitle', 'jobTitle']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    // Clear images
    producedForImage = null;
    producedByImage  = null;
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
        if (imageType === 'producedFor') producedForImage = imageData;
        else if (imageType === 'producedBy') producedByImage = imageData;
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
    if (imageType === 'producedFor') producedForImage = null;
    else if (imageType === 'producedBy') producedByImage = null;
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
                // Headings restored above are literal text from the file and may
                // have been saved under a different language — re-sync any that
                // still match a known default to the currently active language.
                applyTranslations();
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
    const isArabic = getLang() === 'ar';
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // ── Arabic font + RTL setup ───────────────────────────
        let arabicFontName = null;
        if (isArabic) {
            arabicFontName = await loadArabicFont(pdf);
            if (arabicFontName) {
                pdf.setR2L(true);
            } else {
                // No font file found — warn user but continue with Latin font
                console.warn('[PDF] Arabic font not loaded. Arabic text may not render correctly.');
            }
        }

        // Helper: set the right font for current language
        const setBodyFont = () => {
            if (isArabic && arabicFontName) {
                pdf.setFont(arabicFontName, 'normal');
            } else {
                pdf.setFont('helvetica', 'normal');
            }
        };
        const setBoldFont = () => {
            if (isArabic && arabicFontName) {
                pdf.setFont(arabicFontName, 'normal'); // Tajawal/Cairo have no separate bold TTF loaded
            } else {
                pdf.setFont('helvetica', 'bold');
            }
        };

        const dacumDateInput        = document.getElementById('dacumDate');
        const producedForInput      = document.getElementById('producedFor');
        const producedByInput       = document.getElementById('producedBy');
        const occupationTitleInput  = document.getElementById('occupationTitle');
        const jobTitleInput         = document.getElementById('jobTitle');
        const toolsInput            = document.getElementById('toolsInput');
        const trendsInput           = document.getElementById('trendsInput');
        const acronymsInput         = document.getElementById('acronymsInput');

        let dacumDateFormatted = '';
        if (dacumDateInput.value) {
            const d = new Date(dacumDateInput.value + 'T00:00:00');
            dacumDateFormatted = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`;
        }
        if (!occupationTitleInput.value || !jobTitleInput.value) {
            alert(t('status.pdfMissingFields'));
            return;
        }

        // ── Spacing constants ─────────────────────────────────────
        // All spacing in mm. These replace the scattered magic numbers
        // that caused overlapping text and tight cells.
        const margin      = 10;
        const cellPadX    = 3;     // horizontal padding inside every cell
        const cellPadTop  = 5;     // top padding so text never touches border
        const cellPadBot  = 4;     // extra bottom clearance per cell
        const lineH12     = 5.5;   // line pitch for 12pt text  (12pt ≈ 4.2mm glyph)
        const lineH14     = 6.5;   // line pitch for 14pt text  (14pt ≈ 4.9mm glyph)
        const minRowH     = 20;    // minimum task row height (mm)
        const minHdrH     = 16;    // minimum duty-header height (mm)

        const pageWidth  = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPos = margin + 10;

        // ── Title page ────────────────────────────────────────────
        pdf.setFontSize(18); setBoldFont();
        pdf.text(t('pdf.chartTitle', { title: occupationTitleInput.value }), pageWidth / 2, yPos, { align: 'center' });
        yPos += 18;

        const leftColX = margin + 10;
        const rightColX = pageWidth / 2 + 10;
        const rightColW = pageWidth / 2 - margin - 10 - 10;  // available width for right column
        let leftY = yPos, rightY = yPos;

        // Left column — Produced For / By / Date
        if (producedForInput.value) {
            pdf.setFontSize(16); setBoldFont();
            pdf.text(t('pdf.producedFor'), leftColX, leftY); leftY += 8;
            if (producedForImage) { try { pdf.addImage(producedForImage, 'JPEG', leftColX, leftY, 30, 20); leftY += 24; } catch(e) {} }
            setBodyFont(); pdf.setFontSize(13);
            pdf.text(producedForInput.value, leftColX, leftY); leftY += 16;
        }
        if (producedByInput.value) {
            pdf.setFontSize(16); setBoldFont();
            pdf.text(t('pdf.producedBy'), leftColX, leftY); leftY += 8;
            if (producedByImage) { try { pdf.addImage(producedByImage, 'JPEG', leftColX, leftY, 30, 20); leftY += 24; } catch(e) {} }
            setBodyFont(); pdf.setFontSize(13);
            pdf.text(producedByInput.value, leftColX, leftY); leftY += 14;
        }
        if (dacumDateFormatted) {
            pdf.setFontSize(13); setBoldFont();
            pdf.text(dacumDateFormatted, leftColX, leftY);
        }

        // Right column — Occupation / Job title
        pdf.setFontSize(14); setBoldFont();
        pdf.text(t('pdf.occupationTitle'), rightColX, rightY); rightY += 7;
        setBodyFont(); pdf.setFontSize(13);
        const occupationLines = pdf.splitTextToSize(occupationTitleInput.value, rightColW);
        pdf.text(occupationLines, rightColX + 3, rightY);
        rightY += occupationLines.length * lineH12 + 8;

        pdf.setFontSize(14); setBoldFont();
        pdf.text(t('pdf.jobTitle'), rightColX, rightY); rightY += 7;
        setBodyFont(); pdf.setFontSize(13);
        const jobLines = pdf.splitTextToSize(jobTitleInput.value, rightColW);
        pdf.text(jobLines, rightColX + 3, rightY);

        // ── DACUM chart grid ──────────────────────────────────────
        pdf.addPage('a4', 'landscape'); yPos = margin + 5;
        const duties = AppState.duties.map(d => ({
            duty:  d.title,
            tasks: d.tasks.map(t => t.text).filter(t => t.trim() !== '')
        }));
        if (duties.length === 0) { showStatus(t('status.pdfNoDuties'), 'error'); return; }

        pdf.setFillColor(200, 200, 200);
        pdf.rect(margin, yPos, pageWidth-(margin*2), 10, 'FD');
        pdf.setFontSize(14); setBoldFont();
        pdf.text(t('pdf.dutiesAndTasks'), pageWidth/2, yPos + 7, { align: 'center' });
        yPos += 10;

        const maxCols  = 4;
        const chartWidth = pageWidth - (margin * 2);
        const colWidth   = chartWidth / maxCols;
        const innerW     = colWidth - (cellPadX * 2);  // text wraps within this width
        let dutyIndex = 0;

        while (dutyIndex < duties.length) {
            const dtr = Math.min(maxCols, duties.length - dutyIndex);

            // ── Duty header row ───────────────────────────────────
            // First pass: measure the tallest header across all columns.
            let maxHeaderHeight = minHdrH;
            for (let col = 0; col < dtr; col++) {
                pdf.setFontSize(12); setBoldFont();
                const letter = String.fromCharCode(65 + dutyIndex + col);
                const lines  = pdf.splitTextToSize(
                    t('pdf.dutyLabel', { letter, title: duties[dutyIndex + col].duty }), innerW
                );
                const h = cellPadTop + lines.length * lineH12 + cellPadBot;
                maxHeaderHeight = Math.max(maxHeaderHeight, h);
            }
            // Second pass: draw with uniform height.
            for (let col = 0; col < dtr; col++) {
                const x = margin + (col * colWidth);
                const letter = String.fromCharCode(65 + dutyIndex + col);
                pdf.setFillColor(220, 220, 220);
                pdf.rect(x, yPos, colWidth, maxHeaderHeight, 'FD');
                pdf.setFontSize(12); setBoldFont();
                const lines = pdf.splitTextToSize(
                    t('pdf.dutyLabel', { letter, title: duties[dutyIndex + col].duty }), innerW
                );
                pdf.text(lines, x + cellPadX, yPos + cellPadTop);
            }
            yPos += maxHeaderHeight;

            // ── Task rows ─────────────────────────────────────────
            const maxTasks = Math.max(
                ...duties.slice(dutyIndex, dutyIndex + dtr).map(d => d.tasks.length)
            );
            for (let taskRow = 0; taskRow < maxTasks; taskRow++) {
                // Measure the tallest cell in this row first.
                let rowHeight = minRowH;
                for (let col = 0; col < dtr; col++) {
                    const task = duties[dutyIndex + col].tasks[taskRow];
                    if (task) {
                        pdf.setFontSize(11); setBodyFont();
                        const letter = String.fromCharCode(65 + dutyIndex + col);
                        // Label on its own line, then the task text wrapped below.
                        const labelLine  = `Task ${letter}${taskRow + 1}:`;
                        const taskLines  = pdf.splitTextToSize(task, innerW);
                        const totalLines = 1 + taskLines.length;   // label + wrapped task
                        const h = cellPadTop + totalLines * lineH12 + cellPadBot;
                        rowHeight = Math.max(rowHeight, h);
                    }
                }

                // Page break check.
                if (yPos + rowHeight > pageHeight - margin - 5) {
                    pdf.addPage('a4', 'landscape'); yPos = margin + 5;
                    pdf.setFillColor(200, 200, 200);
                    pdf.rect(margin, yPos, pageWidth-(margin*2), 10, 'FD');
                    pdf.setFontSize(14); setBoldFont();
                    pdf.text(t('pdf.dutiesAndTasksCont'), pageWidth/2, yPos + 7, { align: 'center' });
                    yPos += 10;
                }

                // Draw all cells in this row.
                setBodyFont(); pdf.setFontSize(11);
                for (let col = 0; col < dtr; col++) {
                    const x    = margin + (col * colWidth);
                    const task = duties[dutyIndex + col].tasks[taskRow];
                    pdf.rect(x, yPos, colWidth, rowHeight, 'S');
                    if (task) {
                        const letter    = String.fromCharCode(65 + dutyIndex + col);
                        const labelLine = t('pdf.taskLabel', { letter, n: taskRow + 1 });
                        const taskLines = pdf.splitTextToSize(task, innerW);
                        // Label in bold, then task text in normal below it.
                        setBoldFont();
                        pdf.text(labelLine, x + cellPadX, yPos + cellPadTop);
                        setBodyFont();
                        pdf.text(taskLines, x + cellPadX, yPos + cellPadTop + lineH12);
                    }
                }
                yPos += rowHeight;
            }

            dutyIndex += dtr;
            if (dutyIndex < duties.length) {
                pdf.addPage('a4', 'landscape'); yPos = margin + 5;
                pdf.setFillColor(200, 200, 200);
                pdf.rect(margin, yPos, pageWidth-(margin*2), 10, 'FD');
                pdf.setFontSize(14); setBoldFont();
                pdf.text(t('pdf.dutiesAndTasksCont'), pageWidth/2, yPos + 7, { align: 'center' });
                yPos += 10;
            }
        }

        // ── Knowledge / Skills / Behaviors ───────────────────────
        const kt = document.getElementById('knowledgeInput').value.trim();
        const st = document.getElementById('skillsInput').value.trim();
        const bt = document.getElementById('behaviorsInput').value.trim();
        if (kt || st || bt) {
            pdf.addPage('a4', 'landscape'); yPos = margin + 5;
            pdf.setFontSize(14); setBoldFont();
            pdf.text(t('pdf.generalKnowledge'), pageWidth/2, yPos, { align: 'center' }); yPos += 10;
            const tw = (pageWidth - (margin * 2)) / 3;
            let c1Y = yPos, c2Y = yPos, c3Y = yPos;
            const pdfSection = (text, heading, x, yRef) => {
                pdf.setFontSize(13); setBoldFont();
                pdf.text(heading, x, yRef); yRef += 8;
                pdf.setFontSize(11); setBodyFont();
                text.split('\n').filter(l => l.trim()).forEach(item => {
                    pdf.text(item.trim().replace(/^[•\-*]\s*/, ''), x, yRef);
                    yRef += lineH12;
                });
                return yRef;
            };
            if (kt) c1Y = pdfSection(kt, document.getElementById('knowledgeHeading').textContent, margin, c1Y);
            if (st) c2Y = pdfSection(st, document.getElementById('skillsHeading').textContent, margin + tw, c2Y);
            if (bt) c3Y = pdfSection(bt, document.getElementById('behaviorsHeading').textContent, margin + tw * 2, c3Y);
        }

        // ── Tools & Trends ────────────────────────────────────────
        const tools  = toolsInput.value.trim()  ? toolsInput.value.split('\n').filter(l => l.trim())  : [];
        const trends = trendsInput.value.trim() ? trendsInput.value.split('\n').filter(l => l.trim()) : [];
        if (tools.length || trends.length) {
            pdf.addPage('a4', 'landscape'); yPos = margin + 5;
            const hw = (pageWidth - (margin * 2) - 5) / 2;
            let lY = yPos, rY = yPos;
            if (tools.length) {
                pdf.setFontSize(13); setBoldFont();
                pdf.text(document.getElementById('toolsHeading').textContent, margin, lY); lY += 8;
                pdf.setFontSize(11); setBodyFont();
                tools.forEach(t => { pdf.text(t.trim().replace(/^[•\-*]\s*/, ''), margin, lY); lY += lineH12; });
            }
            if (trends.length) {
                pdf.setFontSize(13); setBoldFont();
                pdf.text(document.getElementById('trendsHeading').textContent, margin + hw + 5, rY); rY += 8;
                pdf.setFontSize(11); setBodyFont();
                trends.forEach(t => { pdf.text(t.trim().replace(/^[•\-*]\s*/, ''), margin + hw + 5, rY); rY += lineH12; });
            }
        }

        // ── Acronyms ──────────────────────────────────────────────
        if (acronymsInput.value.trim()) {
            pdf.addPage('a4', 'landscape'); yPos = margin + 5;
            pdf.setFontSize(13); setBoldFont();
            pdf.text(document.getElementById('acronymsHeading').textContent, margin, yPos); yPos += 8;
            pdf.setFontSize(11); setBodyFont();
            acronymsInput.value.split('\n').filter(l => l.trim()).forEach(a => {
                pdf.text(a.trim().replace(/^[•\-*]\s*/, ''), margin, yPos); yPos += lineH12;
            });
        }

        // ── Career Path ───────────────────────────────────────────
        const cpi = document.getElementById('careerPathInput');
        if (cpi && cpi.value.trim()) {
            pdf.addPage('a4', 'landscape'); yPos = margin + 5;
            pdf.setFontSize(13); setBoldFont();
            pdf.text(document.getElementById('careerPathHeading').textContent, margin, yPos); yPos += 8;
            pdf.setFontSize(11); setBodyFont();
            cpi.value.split('\n').filter(l => l.trim()).forEach(item => {
                pdf.text(item.trim().replace(/^[•\-*]\s*/, ''), margin, yPos); yPos += lineH12;
            });
        }

        // ── Custom sections ───────────────────────────────────────
        document.querySelectorAll('#customSectionsContainer .section-container').forEach(div => {
            const h = div.querySelector('h3'), t = div.querySelector('textarea');
            if (h && t && t.value.trim()) {
                pdf.addPage('a4', 'landscape'); yPos = margin + 5;
                pdf.setFontSize(13); setBoldFont();
                pdf.text(h.textContent, margin, yPos); yPos += 8;
                pdf.setFontSize(11); setBodyFont();
                t.value.split('\n').filter(l => l.trim()).forEach(item => {
                    pdf.text(item.trim().replace(/^[•\-*]\s*/, ''), margin, yPos); yPos += lineH12;
                });
            }
        });

        pdf.save(`${occupationTitleInput.value}_${jobTitleInput.value}_DACUM_Chart.pdf`);
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
        occupationTitle:document.getElementById('occupationTitle')?.value|| '',
        jobTitle:       document.getElementById('jobTitle')?.value       || '',
        scopeOfWork:    document.getElementById('scopeOfWork')?.value    || '',
        facilitators:   document.getElementById('facilitators')?.value   || '',
        observers:      document.getElementById('observers')?.value      || '',
        panelMembers:   document.getElementById('panelMembers')?.value   || '',
        producedForImage: producedForImage || null,
        producedByImage:  producedByImage  || null,
    };
}

/** Restore chart-info fields + logos to the DOM */
export function applyChartInfoData(info) {
    if (!info || typeof info !== 'object') return;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    set('dacumDate',       info.dacumDate);
    set('producedFor',     info.producedFor);
    set('producedBy',      info.producedBy);
    set('occupationTitle', info.occupationTitle);
    set('jobTitle',        info.jobTitle);
    set('scopeOfWork',     info.scopeOfWork);
    set('facilitators',    info.facilitators);
    set('observers',       info.observers);
    set('panelMembers',    info.panelMembers);

    // Restore logo images
    _restoreImagePreview('producedFor', info.producedForImage);
    _restoreImagePreview('producedBy',  info.producedByImage);
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
    // Reset fixed headings to the CURRENT language's default text and
    // clear any leftover custom sections first. Without this, a brand
    // new project (or one saved before chartInfo/additionalInfo existed)
    // would silently inherit whatever headings were left on screen from
    // the previously active project.
    const headingKeyMap = {
        knowledgeHeading:  'section.knowledge',
        skillsHeading:     'section.skills',
        behaviorsHeading:  'section.behaviors',
        toolsHeading:      'section.tools',
        trendsHeading:     'section.trends',
        acronymsHeading:   'section.acronyms',
        careerPathHeading: 'section.careerPath',
    };
    Object.entries(headingKeyMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = t(key);
    });
    const customContainer = document.getElementById('customSectionsContainer');
    if (customContainer) { customContainer.innerHTML = ''; customSectionCounter = 0; }

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

    // A saved heading might be literal text captured while the OTHER
    // language was active (e.g. project last edited in Arabic, now
    // viewed in English). applyTranslations() only rewrites headings
    // whose current text still matches a known EN/AR default, so any
    // heading the user genuinely renamed is left untouched.
    applyTranslations();
}
