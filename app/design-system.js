// ============================================================
// design-system.js — Reusable UI Component Builders
// ============================================================

// ── Status Banner ─────────────────────────────────────────────
let _statusTimer = null;

export function showStatus(message, type) {
    const el = document.getElementById('status');
    if (!el) return;
    el.textContent = message;
    el.className = `status ${type}`;
    el.style.display = 'block';
    if (_statusTimer) clearTimeout(_statusTimer);
    if (type === 'success') {
        _statusTimer = setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
}

// ── Reusable Button Builder ───────────────────────────────────
/**
 * createButton({ type, label, onClick, title, id, disabled })
 * type maps to a CSS class: 'add', 'remove', 'export', etc.
 */
export function createButton({ type = '', label = '', onClick = null, title = '', id = '', disabled = false } = {}) {
    const btn = document.createElement('button');
    if (type)     btn.className = `btn-${type}`;
    if (id)       btn.id = id;
    if (title)    btn.title = title;
    if (disabled) btn.disabled = true;
    if (typeof label === 'string') {
        btn.textContent = label;
    } else {
        btn.appendChild(label); // allows DocumentFragment / Node as label
    }
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
}

// ── Reusable Card Header Builder ──────────────────────────────
/**
 * createHeader({ type, index })
 * type: 'duty' | 'task'
 * Returns a styled header element with an index label.
 */
export function createHeader({ type = 'duty', index = 1 } = {}) {
    const el = document.createElement('div');
    el.className = `cv-${type}-index-label`;
    el.textContent = type.toUpperCase() + ' ' + index;
    return el;
}

// ── Reusable Card Builder ─────────────────────────────────────
/**
 * createCard({ type, content, topLeft, topRight })
 * Builds a card div with optional top-row (label + action button).
 * Returns the card element.
 */
export function createCard({ type = 'task', content = null, topLeft = null, topRight = null } = {}) {
    const card = document.createElement('div');
    card.className = `cv-${type}-card`;

    if (topLeft || topRight) {
        const top = document.createElement('div');
        top.className = `cv-${type}-card-top`;
        if (topLeft)  top.appendChild(topLeft);
        if (topRight) top.appendChild(topRight);
        card.appendChild(top);
    }

    if (content) card.appendChild(content);
    return card;
}

// ── Circular Delete Button ────────────────────────────────────
/**
 * createDeleteCircle({ type, onClick })
 * Builds the small circular × delete button used in card view.
 */
export function createDeleteCircle({ type = 'task', onClick = null, title = 'Remove' } = {}) {
    const btn = document.createElement('button');
    btn.className = `cv-delete-${type}`;
    btn.textContent = '×';
    btn.title = title;
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
}

// ── Editable Content Div ──────────────────────────────────────
/**
 * createEditable({ className, text, placeholder, onInput, onFocus, onBlur })
 */
export function createEditable({
    className = '',
    text = '',
    placeholder = '',
    onInput = null,
    onFocus = null,
    onBlur = null
} = {}) {
    const el = document.createElement('div');
    el.className = className;
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('data-placeholder', placeholder);
    el.textContent = text;
    if (onFocus) el.addEventListener('focus', onFocus);
    if (onInput) el.addEventListener('input', onInput);
    if (onBlur)  el.addEventListener('blur',  onBlur);
    return el;
}
