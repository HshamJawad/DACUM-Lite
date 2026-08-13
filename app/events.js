// ============================================================
// events.js — Feature Functions & Event Binding Layer
// ============================================================
import { t, getLang, applyTranslations }        from './i18n.js';
import { loadArabicFont, getArabicFontName,
         shapeArabic, bidiVisual, arabicVisual } from './arabic-font.js';
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


/* ══════════════════════════════════════════════════════════════
   ARABIC WORD EXPORT SUPPORT
   Three separate problems, three separate fixes — none of them
   substitutes for the others:

     1. READING ORDER  → <w:bidi/> on the paragraph, <w:bidiVisual/>
        on the table. Without these, an Arabic line ends with its
        full stop on the left and table columns run left-to-right.
     2. PROOFING LANGUAGE → <w:lang>. This is what removes the red
        underlines. Word marks every Arabic word as a misspelled
        English one until the run declares its language, and no
        amount of direction setting changes that.
     3. GLYPH COVERAGE → a font that actually carries Arabic.

   docx@7.8.2 (loaded from the CDN in index.html) has NO `language`
   option on runs — <w:lang> exists in its source only as an XSD
   comment. The wrappers below add the element to the tree the
   library builds, which needs no fork and no version upgrade.
   ══════════════════════════════════════════════════════════════ */

const _rtl = () => getLang() === 'ar';

/* Word silently falls back when a face lacks Arabic glyphs, which is
   how a document ends up full of boxes on someone else's machine.
   Arial ships everywhere and has full Arabic coverage. */
const _wordFont = () => (_rtl() ? 'Arial' : 'Calibri');

/* w:val is the language of the Latin text in a run, w:bidi the
   language of the Arabic. Keeping the document default's w:val at
   en-US stops Word from checking English fragments — ISO codes,
   tool names — against an Arabic dictionary, which would simply
   move the red underlines somewhere else. */
const _LANG_AR    = 'ar-IQ';
const _LANG_LATIN = 'en-US';

/* Arabic + Supplement/Extended + Presentation Forms A and B. */
const _ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const _hasArabic = (v) => _ARABIC_RE.test(String(v ?? ''));

/* The library exposes no class for <w:lang>, but its serializer passes
   any non-XmlComponent child straight through to the XML writer, so a
   plain node in the writer's own shape is a supported escape hatch. */
const _langNode = (val, bidi) => ({
    'w:lang': { _attr: { 'w:val': val, 'w:bidi': bidi } }
});

function _runText(o) {
    const kids = Array.isArray(o.children) ? o.children.filter(c => typeof c === 'string') : [];
    return [o.text || '', ...kids].join(' ');
}

/* Wrapping TextRun at the point it is pulled off window.docx tags
   every Arabic run in one place, and covers any run added later. */
function _withArabicLang(BaseRun) {
    return class extends BaseRun {
        constructor(options) {
            const o = (typeof options === 'string') ? { text: options } : (options || {});
            const isAr = _rtl() && _hasArabic(_runText(o));
            /* w:rtl marks the run as complex script, which is what makes
               Word read w:bidi as the proofing language and apply the
               w:cs font rather than the Latin one. */
            super(isAr ? { ...o, rightToLeft: true } : o);
            if (isAr) {
                try {
                    /* Appended last — also where <w:lang> belongs in the
                       EG_RPrBase sequence, after w:rtl. */
                    this.properties.addChildElement(_langNode(_LANG_AR, _LANG_AR));
                } catch (e) {
                    console.warn('[Word] w:lang not applied to run:', e);
                }
            }
        }
    };
}

/* `new Paragraph('')` and `new Paragraph({ text })` build their run
   internally with the library's own TextRun, bypassing the wrapper.
   Rewriting the shorthand keeps those from being the one gap. */
function _withArabicLangParagraph(BaseParagraph, WrappedRun) {
    return class extends BaseParagraph {
        constructor(options) {
            const o = (typeof options === 'string') ? { text: options } : (options || {});
            if (_rtl() && o.text && _hasArabic(o.text)) {
                const { text, ...rest } = o;
                super({ ...rest, children: [new WrappedRun({ text }), ...(o.children || [])] });
            } else {
                super(options);
            }
        }
    };
}

/* Document-level fallback: <w:lang> inside docDefaults/rPrDefault, so
   text the user types into the exported file afterwards behaves too.
   docDefaults is built from styles.default.document.run, which has the
   same missing option, so the node is added to the built tree. */
function _applyDocDefaultsLang(doc) {
    if (!_rtl()) return;
    try {
        const find = (node, key) => {
            if (!node || typeof node !== 'object') return null;
            if (node.rootKey === key) return node;
            if (!Array.isArray(node.root)) return null;
            for (const child of node.root) {
                const hit = find(child, key);
                if (hit) return hit;
            }
            return null;
        };
        const defaults = find(doc.Styles, 'w:docDefaults');
        const rPr = defaults && find(defaults, 'w:rPr');
        if (rPr) rPr.addChildElement(_langNode(_LANG_LATIN, _LANG_AR));
    } catch (e) {
        /* Per-run tags already carry the fix; a missed default is cosmetic. */
        console.warn('[Word] w:lang not applied to docDefaults:', e);
    }
}

/* /[^a-z0-9]/gi turns an Arabic occupation title into a row of
   underscores — every Arabic export arrived as "____.docx". Keep
   Unicode letters and digits, strip only what a filesystem rejects. */
function _safeFilename(parts, suffix) {
    const base = parts
        .filter(Boolean)
        .join('_')
        .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 80);
    return (base || 'DACUM') + suffix;
}

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

        const { Document, Paragraph: _Paragraph, TextRun: _TextRun, Table, TableRow, TableCell,
                WidthType, AlignmentType, BorderStyle, Packer, PageBreak,
                convertInchesToTwip, ShadingType, TextDirection, ImageRun } = window.docx;

        /* Cell shading uses ShadingType.CLEAR, never SOLID. In OOXML,
           w:val="solid" paints the PATTERN foreground over the whole
           cell, and w:color defaults to "auto" — so a "solid E8E8E8"
           cell renders as a solid BLACK bar with the fill never shown.
           CLEAR means "no pattern", which is what lets w:fill through. */

        /* Every run and shorthand paragraph below is built through these,
           so Arabic carries <w:lang> without touching each call site. */
        const TextRun   = _withArabicLang(_TextRun);
        const Paragraph = _withArabicLangParagraph(_Paragraph, TextRun);

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
        children.push(new Paragraph({ children: [new TextRun({ text: t('word.occupationTitle', { title: occupationTitle }), bold: true, size: 28 })], spacing: { after: 200 }, bidirectional: _rtl() }));
        children.push(new Paragraph({ children: [new TextRun({ text: t('word.jobTitle', { title: jobTitle }), bold: true, size: 28 })], spacing: { after: 200 }, bidirectional: _rtl() }));
        if (dacumDate) children.push(new Paragraph({ children: [new TextRun({ text: t('word.dacumDate', { date: dacumDate }), bold: true, size: 24 })], spacing: { after: 200 }, bidirectional: _rtl() }));

        if (producedFor) {
            children.push(new Paragraph({ children: [new TextRun({ text: t('word.producedFor', { name: producedFor }), bold: true, size: 24 })], spacing: { after: 200 }, bidirectional: _rtl() }));
            if (producedForImage) {
                try {
                    const base64Data = producedForImage.split(',')[1];
                    children.push(new Paragraph({ children: [new ImageRun({ data: Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)), transformation: { width: 94, height: 94 } })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
                } catch(e) { console.error('Error adding Produced For image:', e); }
            }
        }

        if (producedBy) {
            children.push(new Paragraph({ children: [new TextRun({ text: t('word.producedBy', { name: producedBy }), bold: true, size: 24 })], spacing: { after: 200 }, bidirectional: _rtl() }));
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
        children.push(new Paragraph({ children: [new PageBreak(), new TextRun({ text: t('word.dutiesAndTasks'), bold: true, size: 28 })], alignment: AlignmentType.CENTER, spacing: { after: 300 }, bidirectional: _rtl() }));

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

            tableRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: dutyLabel, bold: true, size: 24 })], bidirectional: _rtl() })], columnSpan: 4, shading: { fill: 'E8E8E8', type: ShadingType.CLEAR }, width: { size: 100, type: WidthType.PERCENTAGE } })] }));

            for (let row = 0; row < numTaskRows; row++) {
                const rowCells = [];
                for (let col = 0; col < tasksPerRow; col++) {
                    const ti = row * tasksPerRow + col;
                    if (ti < dutyData.tasks.length) {
                        const tLabel = t('word.taskLabel', { letter, n: ti + 1, text: dutyData.tasks[ti] });
                        rowCells.push(new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: tLabel, size: 24 })], bidirectional: _rtl() })], width: { size: 25, type: WidthType.PERCENTAGE } }));
                    } else {
                        rowCells.push(new TableCell({ children: [new Paragraph('')], width: { size: 25, type: WidthType.PERCENTAGE } }));
                    }
                }
                tableRows.push(new TableRow({ children: rowCells }));
            }
            children.push(new Table({ visuallyRightToLeft: _rtl(), width: { size: 9071, type: WidthType.DXA }, layout: 'fixed', rows: tableRows }));
            children.push(new Paragraph({ spacing: { after: 200 } }));
        });

        // Additional info
        children.push(new Paragraph({ children: [new PageBreak(), new TextRun({ text: t('word.additionalInfo'), bold: true, size: 24 })], spacing: { after: 300 }, bidirectional: _rtl() }));

        const additionalInfoSections = [
            { heading1: document.getElementById('knowledgeHeading').textContent, content1: document.getElementById('knowledgeInput').value.trim(), heading2: document.getElementById('behaviorsHeading').textContent, content2: document.getElementById('behaviorsInput').value.trim() },
            { heading1: document.getElementById('skillsHeading').textContent,    content1: document.getElementById('skillsInput').value.trim(),    heading2: '', content2: '' },
            { heading1: document.getElementById('toolsHeading').textContent,     content1: document.getElementById('toolsInput').value.trim(),     heading2: document.getElementById('trendsHeading').textContent, content2: document.getElementById('trendsInput').value.trim() },
            { heading1: document.getElementById('acronymsHeading').textContent,  content1: document.getElementById('acronymsInput').value.trim(),  heading2: document.getElementById('careerPathHeading').textContent, content2: document.getElementById('careerPathInput').value.trim() }
        ];

        const makeTextRuns = (text, size = 24) => text.split('\n').filter(l => l.trim()).map(l => new Paragraph({ children: [new TextRun({ text: l.trim().replace(/^[•\-*]\s*/, '• '), size })], bidirectional: _rtl() }));

        additionalInfoSections.forEach((section, index) => {
            if (index === 3 && section.content1) {
                const row = new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: section.heading1, bold: true, size: 24 })], bidirectional: _rtl() })], shading: { fill: 'E8E8E8', type: ShadingType.CLEAR }, width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: makeTextRuns(section.content1), width: { size: 70, type: WidthType.PERCENTAGE } })
                ] });
                children.push(new Table({ visuallyRightToLeft: _rtl(), width: { size: 9071, type: WidthType.DXA }, layout: 'fixed', rows: [row] }));
                children.push(new Paragraph({ spacing: { after: 200 } }));
            } else if (section.content1 || section.content2) {
                const row = new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: section.heading1, bold: true, size: 24 })], bidirectional: _rtl() }), ...makeTextRuns(section.content1)], width: { size: 50, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: section.content2 ? [new Paragraph({ children: [new TextRun({ text: section.heading2, bold: true, size: 24 })], bidirectional: _rtl() }), ...makeTextRuns(section.content2)] : [new Paragraph('')], width: { size: 50, type: WidthType.PERCENTAGE } })
                ] });
                children.push(new Table({ visuallyRightToLeft: _rtl(), width: { size: 9071, type: WidthType.DXA }, layout: 'fixed', rows: [row] }));
                children.push(new Paragraph({ spacing: { after: 200 } }));
            }
        });

        // Custom sections
        document.querySelectorAll('#customSectionsContainer .section-container').forEach(div => {
            const h = div.querySelector('h3');
            const t = div.querySelector('textarea');
            if (h && t && t.value.trim()) {
                const row = new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h.textContent, bold: true, size: 24 })], bidirectional: _rtl() }), ...makeTextRuns(t.value)], columnSpan: 2, width: { size: 100, type: WidthType.PERCENTAGE } })] });
                children.push(new Table({ visuallyRightToLeft: _rtl(), width: { size: 9071, type: WidthType.DXA }, layout: 'fixed', rows: [row] }));
                children.push(new Paragraph({ spacing: { after: 200 } }));
            }
        });

        const doc = new Document({
            /* Arabic needs a face that carries the glyphs; this also
               becomes the w:cs font for every complex-script run. */
            styles: { default: { document: { run: { font: _wordFont() } } } },
            sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }]
        });

        /* The safety net under the per-run tags. */
        _applyDocDefaultsLang(doc);

        const blob = await Packer.toBlob(doc);
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = _safeFilename([occupationTitle, jobTitle], '_DACUM_Chart.docx');
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

/* ──────────────────────────────────────────────────────────────
   jsPDF 2.5.1 ships its OWN Arabic parser and wires it up as a
   `preProcessText` subscriber, so it re-shapes every string that
   reaches pdf.text(). getStringUnitWidth() calls it a second time
   while measuring, which is how splitTextToSize() got dragged in
   too.

   That parser has no idea our text has already been shaped and
   reordered by arabic-font.js. It treats the finished visual
   string as raw logical input and shapes it again against the
   REVERSED neighbours — which is exactly why the Arabic sheet came
   out as connected-but-meaningless letters while English and
   French were fine (the parser only fires on Arabic).

   Both entry points have to be closed, and both are restored in
   the finally block so nothing else in the app is affected.

   NOTE: this handles the SHAPER only. jsPDF's second text processor,
   the BidiEngine on postProcessText, is neutralised per-call through
   the isInputVisual/isOutputVisual options in exportToPDF() — that
   one is configurable, so there is nothing to detach.
   ────────────────────────────────────────────────────────────── */
function _suspendJsPdfArabicParser(pdf, jsPDFClass) {
    const restores = [];

    // 1. The preProcessText subscription on this document instance.
    try {
        const events = pdf.internal && pdf.internal.events;
        const topics = events && typeof events.getTopics === 'function'
            ? events.getTopics() : null;
        if (topics && topics.preProcessText) {
            Object.keys(topics.preProcessText).forEach(token => {
                const fn = topics.preProcessText[token][0];
                if (fn === jsPDFClass.API.processArabic ||
                    (jsPDFClass.API.__arabicParser__ && fn === jsPDFClass.API.__arabicParser__.processArabic)) {
                    events.unsubscribe(token);
                    restores.push(() => events.subscribe('preProcessText', fn));
                }
            });
        }
    } catch (e) {
        console.warn('[PDF] Could not detach the jsPDF Arabic parser event.', e);
    }

    // 2. The direct API.processArabic call inside getStringUnitWidth.
    try {
        const original = jsPDFClass.API.processArabic;
        if (original) {
            jsPDFClass.API.processArabic = undefined;
            restores.push(() => { jsPDFClass.API.processArabic = original; });
        }
    } catch (e) {
        console.warn('[PDF] Could not suspend API.processArabic.', e);
    }

    return () => restores.forEach(fn => { try { fn(); } catch (e) {} });
}

export async function exportToPDF() {
    const isArabic = getLang() === 'ar';
    let restoreArabicParser = null;
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // ── Arabic font ───────────────────────────────────────────
        // Shaping and bidi are done in JS (arabic-font.js), so R2L
        // must stay OFF here — jsPDF would otherwise reverse the
        // already-reversed visual string a second time — and jsPDF's
        // own Arabic parser has to be taken out of the pipeline for
        // the duration of this export.
        let arabicFontName = null;
        if (isArabic) {
            restoreArabicParser = _suspendJsPdfArabicParser(pdf, jsPDF);
            arabicFontName = await loadArabicFont(pdf);
            if (!arabicFontName) {
                console.warn('[PDF] No Arabic TTF found — Arabic text will not render correctly.');
            }
        }
        pdf.setR2L(false);

        const RTL = isArabic && !!arabicFontName;

        // ── Font helpers ──────────────────────────────────────────
        const setBodyFont = () => {
            if (arabicFontName) pdf.setFont(arabicFontName, 'normal');
            else                pdf.setFont('helvetica', 'normal');
        };
        const setBoldFont = () => {
            if (arabicFontName) pdf.setFont(arabicFontName, 'normal');
            else                pdf.setFont('helvetica', 'bold');
        };

        // ── Text helpers ──────────────────────────────────────────
        // prep()  : short strings drawn as-is
        // wrap()  : shape → measure/split → reorder each line, so the
        //           width jsPDF measures is the width it actually draws
        const prep = (s) => RTL ? arabicVisual(String(s ?? '')) : String(s ?? '');
        const wrap = (s, w) => {
            const src   = RTL ? shapeArabic(String(s ?? '')) : String(s ?? '');
            const lines = pdf.splitTextToSize(src, w);
            return RTL ? lines.map(l => bidiVisual(l)) : lines;
        };
        /* jsPDF also runs a BidiEngine on every string, subscribed to
           the postProcessText event. Its default is isInputVisual:true
           with isOutputVisual undefined, i.e. "this text is visual,
           give me back logical" — so it reordered our finished visual
           string right back again.

           Declaring the text as visual IN and visual OUT, with the
           same direction on both sides, lands on none of the engine's
           conversion branches, so doBidiReorder() returns the string
           untouched. This is the documented option set, not a patch:
           we are telling the engine the truth about our input.

           A fresh object per call — jsPDF writes into the options it
           is handed. */
        const opts = (align) => RTL
            ? { align, isInputVisual: true, isOutputVisual: true,
                       isInputRtl: false,   isOutputRtl: false }
            : { align };
        const lead  = RTL ? 'right' : 'left';
        /** Draw already-wrapped lines anchored to the leading edge of a box. */
        const drawLines = (lines, boxX, boxW, y, padX) =>
            pdf.text(lines, RTL ? (boxX + boxW - padX) : (boxX + padX), y, opts(lead));
        /** Draw a short string anchored to the leading edge of a box. */
        const drawText = (s, boxX, boxW, y, padX) =>
            pdf.text(prep(s), RTL ? (boxX + boxW - padX) : (boxX + padX), y, opts(lead));

        // ── Inputs ────────────────────────────────────────────────
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

        // ── Spacing constants (mm) ────────────────────────────────
        const margin      = 10;
        const cellPadX    = 3;
        const cellPadTop  = 5;
        const cellPadBot  = 4;
        const lineH12     = 5.5;
        const minRowH     = 20;
        const minHdrH     = 14;
        const dutyGap     = 4;     // vertical breathing room between duty blocks

        const pageWidth  = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const chartWidth = pageWidth - (margin * 2);
        let yPos = margin + 10;

        // ══════════════════════════════════════════════════════════
        //  TITLE PAGE
        // ══════════════════════════════════════════════════════════
        pdf.setFontSize(18); setBoldFont();
        pdf.text(prep(t('pdf.chartTitle', { title: occupationTitleInput.value })),
                 pageWidth / 2, yPos, opts('center'));
        yPos += 18;

        // In Arabic the identity column sits on the right and the
        // occupation column on the left — mirrored from the LTR sheet.
        const halfW    = pageWidth / 2 - margin - 20;
        const infoX    = RTL ? (pageWidth / 2 + 10) : (margin + 10);
        const occX     = RTL ? (margin + 10)        : (pageWidth / 2 + 10);
        const imgX     = (boxX) => RTL ? (boxX + halfW - 30) : boxX;

        let infoY = yPos, occY = yPos;

        if (producedForInput.value) {
            pdf.setFontSize(16); setBoldFont();
            drawText(t('pdf.producedFor'), infoX, halfW, infoY, 0); infoY += 8;
            if (producedForImage) {
                try { pdf.addImage(producedForImage, 'JPEG', imgX(infoX), infoY, 30, 20); infoY += 24; } catch (e) {}
            }
            setBodyFont(); pdf.setFontSize(13);
            drawText(producedForInput.value, infoX, halfW, infoY, 0); infoY += 16;
        }
        if (producedByInput.value) {
            pdf.setFontSize(16); setBoldFont();
            drawText(t('pdf.producedBy'), infoX, halfW, infoY, 0); infoY += 8;
            if (producedByImage) {
                try { pdf.addImage(producedByImage, 'JPEG', imgX(infoX), infoY, 30, 20); infoY += 24; } catch (e) {}
            }
            setBodyFont(); pdf.setFontSize(13);
            drawText(producedByInput.value, infoX, halfW, infoY, 0); infoY += 14;
        }
        if (dacumDateFormatted) {
            pdf.setFontSize(13); setBoldFont();
            drawText(dacumDateFormatted, infoX, halfW, infoY, 0);
        }

        pdf.setFontSize(14); setBoldFont();
        drawText(t('pdf.occupationTitle'), occX, halfW, occY, 0); occY += 7;
        setBodyFont(); pdf.setFontSize(13);
        const occupationLines = wrap(occupationTitleInput.value, halfW - 3);
        drawLines(occupationLines, occX, halfW, occY, 3);
        occY += occupationLines.length * lineH12 + 8;

        pdf.setFontSize(14); setBoldFont();
        drawText(t('pdf.jobTitle'), occX, halfW, occY, 0); occY += 7;
        setBodyFont(); pdf.setFontSize(13);
        drawLines(wrap(jobTitleInput.value, halfW - 3), occX, halfW, occY, 3);

        // ══════════════════════════════════════════════════════════
        //  DUTIES AND TASKS — horizontal band layout
        //  One duty per full-width band, its tasks in cells below it.
        //  Identical structure in English, French and Arabic; only the
        //  column order and text anchoring flip for RTL.
        // ══════════════════════════════════════════════════════════
        const duties = AppState.duties.map(d => ({
            duty:  d.title,
            tasks: d.tasks.map(x => x.text).filter(x => x.trim() !== '')
        }));
        if (duties.length === 0) { showStatus(t('status.pdfNoDuties'), 'error'); return; }

        const TASKS_PER_ROW = 4;
        const cellW  = chartWidth / TASKS_PER_ROW;
        const innerW = cellW - (cellPadX * 2);
        /** x of the i-th cell in a row — right-to-left when RTL. */
        const cellX  = (i) => RTL ? (pageWidth - margin - (i + 1) * cellW)
                                  : (margin + i * cellW);

        const drawBanner = (key) => {
            pdf.setFillColor(200, 200, 200);
            pdf.rect(margin, yPos, chartWidth, 10, 'FD');
            pdf.setFontSize(14); setBoldFont();
            pdf.text(prep(t(key)), pageWidth / 2, yPos + 7, opts('center'));
            yPos += 10;
        };

        /** Duty header band. `cont` repeats it after a page break. */
        const drawDutyHeader = (letter, title, cont) => {
            pdf.setFontSize(12); setBoldFont();
            const label = t('pdf.dutyLabel', { letter, title }) + (cont ? ' …' : '');
            const lines = wrap(label, chartWidth - (cellPadX * 2));
            const h = Math.max(minHdrH, cellPadTop + lines.length * lineH12 + cellPadBot);
            pdf.setFillColor(220, 220, 220);
            pdf.rect(margin, yPos, chartWidth, h, 'FD');
            pdf.setFontSize(12); setBoldFont();
            drawLines(lines, margin, chartWidth, yPos + cellPadTop, cellPadX);
            yPos += h;
        };

        const newChartPage = () => {
            pdf.addPage('a4', 'landscape');
            yPos = margin + 5;
            drawBanner('pdf.dutiesAndTasksCont');
        };

        pdf.addPage('a4', 'landscape');
        yPos = margin + 5;
        drawBanner('pdf.dutiesAndTasks');

        for (let d = 0; d < duties.length; d++) {
            const letter = String.fromCharCode(65 + d);
            const tasks  = duties[d].tasks;

            // A duty header alone at the foot of a page is never useful —
            // require room for the header plus one task row.
            pdf.setFontSize(12); setBoldFont();
            const probeLines  = wrap(t('pdf.dutyLabel', { letter, title: duties[d].duty }),
                                     chartWidth - (cellPadX * 2));
            const probeHdrH   = Math.max(minHdrH, cellPadTop + probeLines.length * lineH12 + cellPadBot);
            if (yPos + probeHdrH + minRowH > pageHeight - margin - 5) newChartPage();

            drawDutyHeader(letter, duties[d].duty, false);

            for (let r = 0; r * TASKS_PER_ROW < tasks.length; r++) {
                const slice = tasks.slice(r * TASKS_PER_ROW, (r + 1) * TASKS_PER_ROW);

                // Measure the tallest cell in this row first.
                let rowHeight = minRowH;
                const cells = slice.map((task, i) => {
                    const n     = r * TASKS_PER_ROW + i + 1;
                    const label = t('pdf.taskLabel', { letter, n });
                    pdf.setFontSize(11); setBodyFont();
                    const lines = wrap(task, innerW);
                    const h = cellPadTop + (1 + lines.length) * lineH12 + cellPadBot;
                    if (h > rowHeight) rowHeight = h;
                    return { label, lines };
                });

                // Page break — repeat the banner and the duty header.
                if (yPos + rowHeight > pageHeight - margin - 5) {
                    newChartPage();
                    drawDutyHeader(letter, duties[d].duty, true);
                }

                cells.forEach((c, i) => {
                    const x = cellX(i);
                    pdf.rect(x, yPos, cellW, rowHeight, 'S');
                    pdf.setFontSize(11); setBoldFont();
                    drawText(c.label, x, cellW, yPos + cellPadTop, cellPadX);
                    setBodyFont();
                    drawLines(c.lines, x, cellW, yPos + cellPadTop + lineH12, cellPadX);
                });

                yPos += rowHeight;
            }

            yPos += dutyGap;
        }

        // ══════════════════════════════════════════════════════════
        //  KNOWLEDGE / SKILLS / BEHAVIOURS
        // ══════════════════════════════════════════════════════════
        const colX = (i, n) => RTL ? (pageWidth - margin - (i + 1) * (chartWidth / n))
                                   : (margin + i * (chartWidth / n));

        const kt = document.getElementById('knowledgeInput').value.trim();
        const st = document.getElementById('skillsInput').value.trim();
        const bt = document.getElementById('behaviorsInput').value.trim();
        if (kt || st || bt) {
            pdf.addPage('a4', 'landscape'); yPos = margin + 5;
            pdf.setFontSize(14); setBoldFont();
            pdf.text(prep(t('pdf.generalKnowledge')), pageWidth / 2, yPos, opts('center'));
            yPos += 10;

            const tw = chartWidth / 3;
            const pdfSection = (text, heading, x, yRef) => {
                pdf.setFontSize(13); setBoldFont();
                drawText(heading, x, tw, yRef, 2); yRef += 8;
                pdf.setFontSize(11); setBodyFont();
                text.split('\n').filter(l => l.trim()).forEach(item => {
                    const lines = wrap(item.trim().replace(/^[•\-*]\s*/, ''), tw - 4);
                    drawLines(lines, x, tw, yRef, 2);
                    yRef += lines.length * lineH12;
                });
                return yRef;
            };
            if (kt) pdfSection(kt, document.getElementById('knowledgeHeading').textContent, colX(0, 3), yPos);
            if (st) pdfSection(st, document.getElementById('skillsHeading').textContent,    colX(1, 3), yPos);
            if (bt) pdfSection(bt, document.getElementById('behaviorsHeading').textContent, colX(2, 3), yPos);
        }

        // ══════════════════════════════════════════════════════════
        //  TOOLS & TRENDS
        // ══════════════════════════════════════════════════════════
        const tools  = toolsInput.value.trim()  ? toolsInput.value.split('\n').filter(l => l.trim())  : [];
        const trends = trendsInput.value.trim() ? trendsInput.value.split('\n').filter(l => l.trim()) : [];
        if (tools.length || trends.length) {
            pdf.addPage('a4', 'landscape'); yPos = margin + 5;
            const hw = chartWidth / 2;
            const listBlock = (items, heading, x, yRef) => {
                pdf.setFontSize(13); setBoldFont();
                drawText(heading, x, hw, yRef, 2); yRef += 8;
                pdf.setFontSize(11); setBodyFont();
                items.forEach(item => {
                    const lines = wrap(item.trim().replace(/^[•\-*]\s*/, ''), hw - 8);
                    drawLines(lines, x, hw, yRef, 2);
                    yRef += lines.length * lineH12;
                });
            };
            if (tools.length)  listBlock(tools,  document.getElementById('toolsHeading').textContent,  colX(0, 2), yPos);
            if (trends.length) listBlock(trends, document.getElementById('trendsHeading').textContent, colX(1, 2), yPos);
        }

        // ══════════════════════════════════════════════════════════
        //  SINGLE-COLUMN SECTIONS
        // ══════════════════════════════════════════════════════════
        const singleColumnPage = (heading, raw) => {
            pdf.addPage('a4', 'landscape'); yPos = margin + 5;
            pdf.setFontSize(13); setBoldFont();
            drawText(heading, margin, chartWidth, yPos, 2); yPos += 8;
            pdf.setFontSize(11); setBodyFont();
            raw.split('\n').filter(l => l.trim()).forEach(item => {
                const lines = wrap(item.trim().replace(/^[•\-*]\s*/, ''), chartWidth - 4);
                drawLines(lines, margin, chartWidth, yPos, 2);
                yPos += lines.length * lineH12;
            });
        };

        if (acronymsInput.value.trim()) {
            singleColumnPage(document.getElementById('acronymsHeading').textContent, acronymsInput.value);
        }

        const cpi = document.getElementById('careerPathInput');
        if (cpi && cpi.value.trim()) {
            singleColumnPage(document.getElementById('careerPathHeading').textContent, cpi.value);
        }

        document.querySelectorAll('#customSectionsContainer .section-container').forEach(div => {
            const h = div.querySelector('h3'), ta = div.querySelector('textarea');
            if (h && ta && ta.value.trim()) singleColumnPage(h.textContent, ta.value);
        });

        pdf.save(`${occupationTitleInput.value}_${jobTitleInput.value}_DACUM_Chart.pdf`);
        showStatus(t('status.pdfExported'), 'success');
    } catch (err) {
        console.error('Error generating PDF:', err);
        showStatus(t('status.pdfExportError', { msg: err.message }), 'error');
    } finally {
        if (restoreArabicParser) restoreArabicParser();
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
