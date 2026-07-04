// ============================================================
// renderer.js — DOM Rendering Layer  (DACUM Lite v3.1)
// ============================================================
import { t }                        from './i18n.js';
import { AppState, StateManager }   from './state.js';
import {
    pushCommand,
    makeEditDutyCmd,
    makeEditTaskCmd,
    makeMoveDutyCmd,
    makeMoveTaskCmd
} from './history.js';
import { saveToLocalStorage } from './storage.js';
import {
    createCard,
    createHeader,
    createDeleteCircle,
    createEditable,
    createButton
} from './design-system.js';

// ── Action callbacks injected by app.js ───────────────────────
let _actions = {};
export function setRendererActions(actions) { _actions = actions; }

// ══════════════════════════════════════════════════════════════
//  DACUM STANDARD NUMBERING  (v3.1)
//  Duty A … Z … AA … | Task A1, A2 … B1, B2 …
// ══════════════════════════════════════════════════════════════

function getDutyLetter(idx) {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (idx < 26) return L[idx];
    return L[Math.floor(idx / 26) - 1] + L[idx % 26];
}

function dutyLabel(idx) { return t('renderer.dutyLabel', { letter: getDutyLetter(idx) }); }
function taskLabel(dutyIdx, taskIdx) { return getDutyLetter(dutyIdx) + (taskIdx + 1); }

// ══════════════════════════════════════════════════════════════
//  DRAG STATE  (module-level singleton)
// ══════════════════════════════════════════════════════════════

const _drag = { type: null, dutyId: null, taskId: null, el: null };

function _resetDrag() { _drag.type = _drag.dutyId = _drag.taskId = _drag.el = null; }

function _clearAllDragClasses() {
    document.querySelectorAll('.drag-over-top,.drag-over-bottom,.drag-over-empty')
        .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-empty'));
}

// ══════════════════════════════════════════════════════════════
//  DUTY DRAG-AND-DROP
//
//  KEY FIX (v3.1.1):
//  Instead of splitting by mouse position within the target
//  (which caused no-op bugs when dragging top→bottom), we use
//  the DRAG DIRECTION to decide insert-before vs insert-after:
//    • Dragging DOWN  (fromIdx < targetIdx) → insert AFTER target
//    • Dragging UP    (fromIdx > targetIdx) → insert BEFORE target
//  This is unambiguous and matches user expectations.
// ══════════════════════════════════════════════════════════════

/**
 * @param {HTMLElement} dutyEl  draggable container (.duty-row / .cv-duty-row)
 * @param {HTMLElement} handle  ⠿ grip element — mousedown enables dragging
 * @param {object}      duty    duty data object
 * @param {'y'|'x'}    axis    'y' = table view, 'x' = card view
 */
function _attachDutyDragListeners(dutyEl, handle, duty, axis) {
    handle.addEventListener('mousedown', () => { dutyEl.draggable = true; });

    dutyEl.addEventListener('dragstart', (e) => {
        if (!dutyEl.draggable) { e.preventDefault(); return; }
        _drag.type   = 'duty';
        _drag.dutyId = duty.id;
        _drag.el     = dutyEl;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', duty.id);
        setTimeout(() => dutyEl.classList.add('dragging'), 0);
    });

    dutyEl.addEventListener('dragend', () => {
        dutyEl.draggable = false;
        dutyEl.classList.remove('dragging');
        _clearAllDragClasses();
        _resetDrag();
    });

    dutyEl.addEventListener('dragover', (e) => {
        if (_drag.type !== 'duty' || _drag.dutyId === duty.id) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Use drag direction, not cursor position within element.
        const fromIdx   = AppState.duties.findIndex(d => d.id === _drag.dutyId);
        const targetIdx = AppState.duties.findIndex(d => d.id === duty.id);
        // Dragging down → will insert AFTER (show bottom indicator)
        // Dragging up   → will insert BEFORE (show top indicator)
        const insertBefore = fromIdx > targetIdx;

        dutyEl.classList.remove('drag-over-top', 'drag-over-bottom');
        dutyEl.classList.add(insertBefore ? 'drag-over-top' : 'drag-over-bottom');
    });

    dutyEl.addEventListener('dragleave', (e) => {
        if (!dutyEl.contains(e.relatedTarget))
            dutyEl.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    dutyEl.addEventListener('drop', (e) => {
        if (_drag.type !== 'duty' || _drag.dutyId === duty.id) return;
        e.preventDefault();
        dutyEl.classList.remove('drag-over-top', 'drag-over-bottom');

        const fromIdx   = AppState.duties.findIndex(d => d.id === _drag.dutyId);
        const targetIdx = AppState.duties.findIndex(d => d.id === duty.id);
        if (fromIdx === -1 || targetIdx === -1) return;

        // Same directional rule as dragover:
        //   dragging down → insertIdx = targetIdx + 1
        //   dragging up   → insertIdx = targetIdx
        const insertBefore = fromIdx > targetIdx;
        const insertIdx    = insertBefore ? targetIdx : targetIdx + 1;
        // After splicing out fromIdx, every index ≥ fromIdx shifts down by 1
        const finalIdx     = fromIdx < insertIdx ? insertIdx - 1 : insertIdx;

        if (fromIdx === finalIdx) return;   // guard (shouldn't happen now)

        const cmd = makeMoveDutyCmd(fromIdx, finalIdx);
        cmd.execute();
        pushCommand(cmd);
        saveToLocalStorage();
        Renderer.renderAll(StateManager.state);
    });
}

// ══════════════════════════════════════════════════════════════
//  TASK DRAG-AND-DROP
//
//  KEY FIX (v3.1.2):
//  For same-duty reordering we now use DRAG DIRECTION (like duties):
//    • Dragging DOWN (fromIdx < targetIdx) → insert AFTER target
//    • Dragging UP   (fromIdx > targetIdx) → insert BEFORE target
//  This eliminates the no-op bug when dragging task 0 → position 1.
//  For cross-duty drops we keep cursor position (top/bottom half)
//  since direction doesn't apply across different lists.
// ══════════════════════════════════════════════════════════════

function _attachTaskDragListeners(taskEl, handle, dutyRef, taskRef) {
    handle.addEventListener('mousedown', () => { taskEl.draggable = true; });

    taskEl.addEventListener('dragstart', (e) => {
        if (!taskEl.draggable) { e.preventDefault(); return; }
        _drag.type   = 'task';
        _drag.dutyId = dutyRef.id;
        _drag.taskId = taskRef.id;
        _drag.el     = taskEl;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskRef.id);
        e.stopPropagation();
        setTimeout(() => taskEl.classList.add('dragging'), 0);
    });

    taskEl.addEventListener('dragend', () => {
        taskEl.draggable = false;
        taskEl.classList.remove('dragging');
        _clearAllDragClasses();
        _resetDrag();
    });

    taskEl.addEventListener('dragover', (e) => {
        if (_drag.type !== 'task') return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        const sameList = _drag.dutyId === dutyRef.id;
        taskEl.classList.remove('drag-over-top', 'drag-over-bottom');

        if (sameList) {
            // Direction-based: dragging down → show bottom indicator, up → top
            const srcDuty     = AppState.duties.find(d => d.id === _drag.dutyId);
            const fromTaskIdx = srcDuty ? srcDuty.tasks.findIndex(t => t.id === _drag.taskId) : -1;
            const tgtDuty     = AppState.duties.find(d => d.id === dutyRef.id);
            const targetIdx   = tgtDuty ? tgtDuty.tasks.findIndex(t => t.id === taskRef.id) : -1;
            const draggingDown = fromTaskIdx < targetIdx;
            taskEl.classList.add(draggingDown ? 'drag-over-bottom' : 'drag-over-top');
        } else {
            // Cross-duty: use cursor position (top/bottom half)
            const rect = taskEl.getBoundingClientRect();
            taskEl.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom');
        }
    });

    taskEl.addEventListener('dragleave', (e) => {
        if (!taskEl.contains(e.relatedTarget))
            taskEl.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    taskEl.addEventListener('drop', (e) => {
        if (_drag.type !== 'task') return;
        e.preventDefault();
        e.stopPropagation();
        taskEl.classList.remove('drag-over-top', 'drag-over-bottom');

        const srcDuty = AppState.duties.find(d => d.id === _drag.dutyId);
        const tgtDuty = AppState.duties.find(d => d.id === dutyRef.id);
        if (!srcDuty || !tgtDuty) return;

        const fromTaskIdx   = srcDuty.tasks.findIndex(t => t.id === _drag.taskId);
        const targetTaskIdx = tgtDuty.tasks.findIndex(t => t.id === taskRef.id);
        if (fromTaskIdx === -1 || targetTaskIdx === -1) return;

        const sameList = _drag.dutyId === dutyRef.id;

        let toInsertIdx;
        if (sameList) {
            // Direction-based: down → insert after, up → insert before
            const draggingDown = fromTaskIdx < targetTaskIdx;
            toInsertIdx = draggingDown ? targetTaskIdx + 1 : targetTaskIdx;
        } else {
            // Cross-duty: cursor position
            const rect         = taskEl.getBoundingClientRect();
            const insertBefore = e.clientY < rect.top + rect.height / 2;
            toInsertIdx = insertBefore ? targetTaskIdx : targetTaskIdx + 1;
        }

        const finalInsertIdx = (sameList && fromTaskIdx < toInsertIdx) ? toInsertIdx - 1 : toInsertIdx;
        if (sameList && fromTaskIdx === finalInsertIdx) return;   // true no-op guard

        const cmd = makeMoveTaskCmd(_drag.taskId, _drag.dutyId, fromTaskIdx, dutyRef.id, toInsertIdx);
        cmd.execute();
        pushCommand(cmd);
        saveToLocalStorage();
        Renderer.renderAll(StateManager.state);
    });
}

/** Drop zone for empty task lists or end-of-list drops */
function _attachTaskListDropZone(listEl, dutyRef) {
    listEl.addEventListener('dragover', (e) => {
        if (_drag.type !== 'task') return;
        if (e.target !== listEl &&
            listEl.contains(e.target) &&
            !e.target.classList.contains('cv-empty-note')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        listEl.classList.add('drag-over-empty');
    });

    listEl.addEventListener('dragleave', (e) => {
        if (!listEl.contains(e.relatedTarget))
            listEl.classList.remove('drag-over-empty');
    });

    listEl.addEventListener('drop', (e) => {
        if (_drag.type !== 'task') return;
        if (e.target !== listEl &&
            listEl.contains(e.target) &&
            !e.target.classList.contains('cv-empty-note') &&
            !e.target.classList.contains('drag-over-empty')) return;
        e.preventDefault();
        listEl.classList.remove('drag-over-empty');

        const srcDuty = AppState.duties.find(d => d.id === _drag.dutyId);
        const tgtDuty = AppState.duties.find(d => d.id === dutyRef.id);
        if (!srcDuty || !tgtDuty) return;

        const fromTaskIdx = srcDuty.tasks.findIndex(t => t.id === _drag.taskId);
        if (fromTaskIdx === -1) return;

        const toInsertIdx = tgtDuty.tasks.length;
        const sameList    = _drag.dutyId === dutyRef.id;
        if (sameList && fromTaskIdx === tgtDuty.tasks.length - 1) return;

        const cmd = makeMoveTaskCmd(_drag.taskId, _drag.dutyId, fromTaskIdx, dutyRef.id, toInsertIdx);
        cmd.execute();
        pushCommand(cmd);
        saveToLocalStorage();
        Renderer.renderAll(StateManager.state);
    });
}

// ══════════════════════════════════════════════════════════════
//  Renderer — public API
// ══════════════════════════════════════════════════════════════
export const Renderer = {

    renderAll(state) {
        this.renderTableView(state);
        if (state.isCardView) this.renderCardView(state);
        // Refresh wall view in place if it's currently visible
        const wvEl = document.getElementById('wallViewContainer');
        if (wvEl && wvEl.classList.contains('wv-visible')) {
            this.renderWallView(state);
        }
    },

    renderDuties(state) { this.renderTableView(state); },

    // ── TABLE VIEW ─────────────────────────────────────────────
    renderTableView(state) {
        const container = document.getElementById('dutiesContainer');
        if (!container) return;
        container.innerHTML = '';

        state.duties.forEach((duty, idx) => {
            const dutyDiv = document.createElement('div');
            dutyDiv.className = 'duty-row';
            dutyDiv.id = duty.id;

            // Header
            const header = document.createElement('div');
            header.className = 'duty-header';

            const dragHandle = document.createElement('span');
            dragHandle.className = 'duty-drag-handle';
            dragHandle.textContent = '⠿';
            dragHandle.title = t('renderer.dragDuty');

            const heading = document.createElement('h4');
            heading.textContent = dutyLabel(idx);   // "Duty A", "Duty B" …

            const actions = document.createElement('div');
            actions.className = 'duty-header-actions';
            actions.appendChild(createButton({
                type: 'clear-section', label: t('renderer.clearDutyBtn'),
                onClick: () => _actions.clearDuty && _actions.clearDuty(duty.id)
            }));
            actions.appendChild(createButton({
                type: 'remove', label: t('renderer.removeDutyBtn'),
                onClick: () => _actions.removeDuty && _actions.removeDuty(duty.id)
            }));

            header.appendChild(dragHandle);
            header.appendChild(heading);
            header.appendChild(actions);
            dutyDiv.appendChild(header);

            // Duty description input
            const dutyInput = document.createElement('input');
            dutyInput.type = 'text';
            dutyInput.placeholder = t('renderer.dutyPlaceholder');
            dutyInput.setAttribute('data-duty-id', duty.id);
            dutyInput.value = duty.title;

            (dutyRef => {
                let prevVal = dutyRef.title;
                dutyInput.addEventListener('focus', () => { prevVal = dutyRef.title; });
                dutyInput.addEventListener('input', () => { dutyRef.title = dutyInput.value; });
                dutyInput.addEventListener('blur', () => {
                    const newVal = dutyRef.title;
                    if (newVal !== prevVal) {
                        pushCommand(makeEditDutyCmd(dutyRef.id, prevVal, newVal));
                        prevVal = newVal;
                    }
                });
            })(duty);

            dutyDiv.appendChild(dutyInput);

            // Task list
            const taskList = document.createElement('div');
            taskList.className = 'task-list';
            taskList.id = 'tasks_' + duty.id;

            this.renderTasks(duty, taskList, idx);
            _attachTaskListDropZone(taskList, duty);
            dutyDiv.appendChild(taskList);

            // Add Task button
            dutyDiv.appendChild(createButton({
                type: 'add', label: t('renderer.addTaskBtn'),
                onClick: () => _actions.addTask && _actions.addTask(duty.id)
            }));

            container.appendChild(dutyDiv);
            // Attach duty DnD — vertical axis for table view
            _attachDutyDragListeners(dutyDiv, dragHandle, duty, 'y');
        });
    },

    renderTasks(duty, taskList, dutyIdx) {
        duty.tasks.forEach((task, tIdx) => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'task-item';
            taskDiv.id = task.id;

            const dragHandle = document.createElement('span');
            dragHandle.className = 'task-drag-handle';
            dragHandle.textContent = '⠿';
            dragHandle.title = t('renderer.dragTask');

            const label = document.createElement('span');
            label.className = 'task-label';
            label.textContent = taskLabel(dutyIdx, tIdx) + ':';   // "A1:", "B3:"…

            const taskInput = document.createElement('input');
            taskInput.type = 'text';
            taskInput.style.flex = '1';
            taskInput.placeholder = t('renderer.taskPlaceholder');
            taskInput.setAttribute('data-task-id', task.id);
            taskInput.value = task.text;

            (function(dutyRef, taskRef) {
                let prevVal = taskRef.text;
                taskInput.addEventListener('focus', () => { prevVal = taskRef.text; });
                taskInput.addEventListener('input', () => { taskRef.text = taskInput.value; });
                taskInput.addEventListener('blur', () => {
                    const newVal = taskRef.text;
                    if (newVal !== prevVal) {
                        pushCommand(makeEditTaskCmd(dutyRef.id, taskRef.id, prevVal, newVal));
                        prevVal = newVal;
                    }
                });
            })(duty, task);

            const removeBtn = createButton({
                type: 'remove', label: '🗑️',
                onClick: () => _actions.removeTask && _actions.removeTask(task.id)
            });

            taskDiv.appendChild(dragHandle);
            taskDiv.appendChild(label);
            taskDiv.appendChild(taskInput);
            taskDiv.appendChild(removeBtn);
            taskList.appendChild(taskDiv);

            _attachTaskDragListeners(taskDiv, dragHandle, duty, task);
        });
    },

    // ── WALL VIEW ──────────────────────────────────────────────
    renderWallView(state) {
        const chart = document.getElementById('wvChart');
        if (!chart) return;
        chart.innerHTML = '';

        if (!state.duties || state.duties.length === 0) {
            chart.innerHTML =
                '<p style="color:#64748b;font-style:italic;padding:24px 0;">' +
                t('renderer.wallNoDuties') + '</p>';
            return;
        }

        /** Small utility: make a sticky-note icon button */
        function _icBtn(label, title, classes, onClick) {
            const b = document.createElement('button');
            b.className = 'wv-ic-btn ' + classes;
            b.textContent = label;
            b.title = title;
            b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
            return b;
        }

        state.duties.forEach((duty, idx) => {
            const letter = getDutyLetter(idx);

            // ── Full duty row ──────────────────────────────────
            const row = document.createElement('div');
            row.className = 'wv-duty-row';
            row.id = 'wv_' + duty.id;

            // ── Duty card ──────────────────────────────────────
            const dutyCard = document.createElement('div');
            dutyCard.className = 'wv-duty-card';

            // Top bar: [⠿ Duty X] ··· [＋ ✕]
            const dutyTopBar = document.createElement('div');
            dutyTopBar.className = 'wv-duty-card-topbar';

            const dutyDragHandle = document.createElement('span');
            dutyDragHandle.className = 'wv-duty-drag-handle';
            dutyDragHandle.textContent = '⠿';
            dutyDragHandle.title = t('renderer.wallDragDuty');

            const badge = document.createElement('span');
            badge.className = 'wv-duty-badge';
            badge.textContent = t('renderer.wallDutyBadge', { letter });

            const badgeLeft = document.createElement('div');
            badgeLeft.className = 'wv-duty-badge-left';
            badgeLeft.appendChild(dutyDragHandle);
            badgeLeft.appendChild(badge);

            // ＋ Add new duty below this one
            const addTaskBtn = _icBtn('＋', t('renderer.wallAddDutyTitle'),
                'wv-ic-btn--duty-add',
                () => {
                    if (_actions.addDuty) {
                        _actions.addDuty();
                        Renderer.renderWallView(StateManager.state);
                    }
                }
            );

            // ✕ Delete duty
            const delDutyBtn = _icBtn('✕', t('renderer.wallDelDutyTitle'),
                'wv-ic-btn--duty-del',
                () => {
                    if (confirm(t('renderer.wallDelDutyConfirm', { title: duty.title || '' }))) {
                        if (_actions.removeDuty) {
                            _actions.removeDuty(duty.id);
                            Renderer.renderWallView(StateManager.state);
                        }
                    }
                }
            );

            const dutyIconGroup = document.createElement('div');
            dutyIconGroup.className = 'wv-duty-icon-group';
            dutyIconGroup.appendChild(addTaskBtn);
            dutyIconGroup.appendChild(delDutyBtn);

            dutyTopBar.appendChild(badgeLeft);
            dutyTopBar.appendChild(dutyIconGroup);
            dutyCard.appendChild(dutyTopBar);

            // Editable duty title
            const titleEl = createEditable({
                className: 'wv-duty-title',
                text: duty.title,
                placeholder: t('renderer.wallDutyPlaceholder'),
                onFocus: () => { titleEl._prev = duty.title; },
                onInput: () => { duty.title = titleEl.textContent; },
                onBlur:  () => {
                    const newVal = duty.title;
                    if (newVal !== titleEl._prev)
                        pushCommand(makeEditDutyCmd(duty.id, titleEl._prev, newVal));
                }
            });
            dutyCard.appendChild(titleEl);
            row.appendChild(dutyCard);

            // ── Tasks grid ─────────────────────────────────────
            const grid = document.createElement('div');
            grid.className = 'wv-tasks-grid';

            if (duty.tasks.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'wv-no-tasks';
                empty.textContent = t('renderer.wallNoTasks');
                grid.appendChild(empty);
            } else {
                duty.tasks.forEach((task, tIdx) => {
                    const card = document.createElement('div');
                    card.className = 'wv-task-card';

                    // Top bar: [⠿ TaskA1] ··· [＋ ✕]
                    const taskTopBar = document.createElement('div');
                    taskTopBar.className = 'wv-task-card-topbar';

                    const taskDragHandle = document.createElement('span');
                    taskDragHandle.className = 'wv-task-drag-handle';
                    taskDragHandle.textContent = '⠿';
                    taskDragHandle.title = t('renderer.wallDragTask');

                    const lbl = document.createElement('span');
                    lbl.className = 'wv-task-label';
                    lbl.textContent = t('renderer.wallTaskLabel', { letter, n: tIdx + 1 });

                    const taskLabelLeft = document.createElement('div');
                    taskLabelLeft.className = 'wv-task-label-left';
                    taskLabelLeft.appendChild(taskDragHandle);
                    taskLabelLeft.appendChild(lbl);

                    // ＋ Add new task after this one
                    const addAfterBtn = _icBtn('＋', t('renderer.wallAddTaskTitle'),
                        'wv-ic-btn--task-add',
                        () => {
                            if (_actions.addTask) {
                                _actions.addTask(duty.id);
                                Renderer.renderWallView(StateManager.state);
                            }
                        }
                    );

                    // ✕ Delete this task
                    const delTaskBtn = _icBtn('✕', t('renderer.wallDelTaskTitle'),
                        'wv-ic-btn--task-del',
                        () => {
                            if (_actions.removeTask) {
                                _actions.removeTask(task.id);
                                Renderer.renderWallView(StateManager.state);
                            }
                        }
                    );

                    const taskIconGroup = document.createElement('div');
                    taskIconGroup.className = 'wv-task-icon-group';
                    taskIconGroup.appendChild(addAfterBtn);
                    taskIconGroup.appendChild(delTaskBtn);

                    taskTopBar.appendChild(taskLabelLeft);
                    taskTopBar.appendChild(taskIconGroup);

                    // Editable task text
                    const taskTextEl = createEditable({
                        className: 'wv-task-text',
                        text: task.text,
                        placeholder: t('renderer.wallTaskPlaceholder'),
                        onFocus: () => { taskTextEl._prev = task.text; },
                        onInput: () => { task.text = taskTextEl.textContent; },
                        onBlur:  () => {
                            const newVal = task.text;
                            if (newVal !== taskTextEl._prev)
                                pushCommand(makeEditTaskCmd(duty.id, task.id, taskTextEl._prev, newVal));
                        }
                    });

                    card.appendChild(taskTopBar);
                    card.appendChild(taskTextEl);
                    grid.appendChild(card);

                    _attachTaskDragListeners(card, taskDragHandle, duty, task);
                });
            }

            _attachTaskListDropZone(grid, duty);
            row.appendChild(grid);
            chart.appendChild(row);

            _attachDutyDragListeners(row, dutyDragHandle, duty, 'y');
        });
    },

    // ── CARD VIEW ──────────────────────────────────────────────
    renderCardView(state) {
        const inner = document.getElementById('cardViewInner');
        if (!inner) return;
        inner.innerHTML = '';

        if (state.duties.length === 0) {
            inner.innerHTML = '<p style="color:#a16207;font-style:italic;padding:12px;">' + t('renderer.noDuties') + '</p>';
            return;
        }

        state.duties.forEach((duty, idx) => {
            const letter = getDutyLetter(idx);

            const row = document.createElement('div');
            row.className = 'cv-duty-row';

            // Duty card (sticky side panel)
            const dutyDragHandle = document.createElement('span');
            dutyDragHandle.className = 'duty-drag-handle cv-duty-drag-handle';
            dutyDragHandle.textContent = '⠿';
            dutyDragHandle.title = t('renderer.dragDuty');

            const dutyIndexLabel = createHeader({ type: 'duty', index: letter });
            // Override the text set by design-system.js to use the active language
            dutyIndexLabel.textContent = t('renderer.wallDutyBadge', { letter });

            const deleteDutyBtn = createDeleteCircle({
                type: 'duty', title: t('renderer.removeDutyTitle'),
                onClick(e) {
                    e.stopPropagation();
                    if (confirm(t('confirm.removeDuty')))
                        _actions.removeDuty && _actions.removeDuty(duty.id);
                }
            });

            const topRow = document.createElement('div');
            topRow.className = 'cv-duty-card-top';
            topRow.appendChild(dutyDragHandle);
            topRow.appendChild(dutyIndexLabel);
            topRow.appendChild(deleteDutyBtn);

            const dutyTextEl = createEditable({
                className: 'cv-duty-text', text: duty.title, placeholder: t('renderer.dutyPlaceholderCard'),
                onFocus: () => { dutyTextEl._prev = duty.title; },
                onInput: () => { duty.title = dutyTextEl.textContent; },
                onBlur:  () => {
                    const newVal = duty.title;
                    if (newVal !== dutyTextEl._prev)
                        pushCommand(makeEditDutyCmd(duty.id, dutyTextEl._prev, newVal));
                }
            });

            const dutyCard = document.createElement('div');
            dutyCard.className = 'cv-duty-card';
            dutyCard.appendChild(topRow);
            dutyCard.appendChild(dutyTextEl);
            row.appendChild(dutyCard);

            // Tasks wrapper
            const tasksWrapper = document.createElement('div');
            tasksWrapper.className = 'cv-tasks-wrapper';

            if (duty.tasks.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'cv-empty-note';
                empty.textContent = t('renderer.noTasks');
                tasksWrapper.appendChild(empty);
            } else {
                duty.tasks.forEach((task, tIdx) => {
                    const taskDragHandle = document.createElement('span');
                    taskDragHandle.className = 'task-drag-handle cv-task-drag-handle';
                    taskDragHandle.textContent = '⠿';
                    taskDragHandle.title = t('renderer.dragTaskCard');

                    const labelEl = document.createElement('div');
                    labelEl.className = 'cv-task-label';
                    labelEl.textContent = taskLabel(idx, tIdx);   // "A1", "B3"…

                    const deleteTaskBtn = createDeleteCircle({
                        type: 'task', title: t('renderer.removeTaskTitle'),
                        onClick(e) {
                            e.stopPropagation();
                            _actions.removeTask && _actions.removeTask(task.id);
                        }
                    });

                    const taskTextEl = createEditable({
                        className: 'cv-task-text', text: task.text, placeholder: t('renderer.taskPlaceholderCard'),
                        onFocus: () => { taskTextEl._prev = task.text; },
                        onInput: () => { task.text = taskTextEl.textContent; },
                        onBlur:  () => {
                            const newVal = task.text;
                            if (newVal !== taskTextEl._prev)
                                pushCommand(makeEditTaskCmd(duty.id, task.id, taskTextEl._prev, newVal));
                        }
                    });

                    const topLeftEl = document.createElement('div');
                    topLeftEl.style.cssText = 'display:flex;align-items:center;gap:4px;';
                    topLeftEl.appendChild(taskDragHandle);
                    topLeftEl.appendChild(labelEl);

                    const taskCard = createCard({
                        type: 'task',
                        topLeft: topLeftEl,
                        topRight: deleteTaskBtn,
                        content: taskTextEl
                    });

                    tasksWrapper.appendChild(taskCard);
                    _attachTaskDragListeners(taskCard, taskDragHandle, duty, task);
                });
            }

            _attachTaskListDropZone(tasksWrapper, duty);

            const addTaskBtn = document.createElement('button');
            addTaskBtn.className = 'cv-add-task';
            addTaskBtn.innerHTML = t('renderer.addTaskCard');
            addTaskBtn.title = t('renderer.addTaskCardTitle');
            addTaskBtn.addEventListener('click', () => _actions.addTask && _actions.addTask(duty.id));
            tasksWrapper.appendChild(addTaskBtn);

            row.appendChild(tasksWrapper);
            inner.appendChild(row);

            // Card view duty DnD — horizontal axis
            _attachDutyDragListeners(row, dutyDragHandle, duty, 'x');
        });
    }
};

// ── Backward-compat shims ─────────────────────────────────────
export function renderApp()       { Renderer.renderAll(StateManager.state); }
export function renderTableView() { Renderer.renderTableView(StateManager.state); }
export function renderCardView()  { Renderer.renderCardView(StateManager.state); }
