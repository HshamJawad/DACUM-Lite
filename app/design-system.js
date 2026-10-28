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

// ── Agree (👍) toggle ─────────────────────────────────────────
/**
 * createAgreeButton({ agreed, titleOn, titleOff, onToggle })
 * Round thumbs-up toggle for duty / task cards: tapped during a
 * workshop to record that the panel agrees with the item.
 * onToggle(nextValue) is called with the new boolean; the button
 * updates its own look immediately (no full re-render, so a tablet's
 * horizontal scroll position is never lost mid-session).
 * The returned element also carries .setAgreed(bool) to set its look
 * without firing onToggle.
 */
const _THUMB_SVG =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>' +
    '<path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';

export function createAgreeButton({ agreed = false, titleOn = '', titleOff = '', onToggle = null } = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cv-agree-btn';
    btn.innerHTML = _THUMB_SVG;

    const apply = (val) => {
        btn.classList.toggle('is-agreed', !!val);
        btn.setAttribute('aria-pressed', val ? 'true' : 'false');
        btn.title = val ? titleOn : titleOff;
        btn.setAttribute('aria-label', btn.title);
    };
    apply(agreed);
    btn.setAgreed = apply;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const next = !btn.classList.contains('is-agreed');
        apply(next);
        if (onToggle) onToggle(next);
    });
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

    // ── Paste as plain text ────────────────────────────────
    // النص الملصوق من مصادر خارجية (Word، صفحات ويب، إلخ) يحمل معه
    // تنسيقه الأصلي (نوع/حجم الخط، الألوان...) وهذا يكسر تصميم
    // البطاقة. هنا نعترض عملية اللصق ونُدخل نص عادي فقط، بحيث
    // يرث فوراً تنسيق البطاقة (الفونت والحجم) بدلاً من تنسيق المصدر.
    el.addEventListener('paste', (e) => {
        e.preventDefault();
        const clipboard = e.clipboardData || window.clipboardData;
        const rawText = clipboard ? clipboard.getData('text/plain') : '';
        // نزيل فواصل الأسطر ونستبدلها بمسافة لأن هذه البطاقات نص
        // سطر واحد (div عادي وليس pre-wrap)، فنحافظ على نفس سلوك
        // الكتابة المباشرة أو الضبط الأولي عبر textContent.
        const plainText = rawText.replace(/\r?\n+/g, ' ');

        if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
            document.execCommand('insertText', false, plainText);
        } else {
            // بديل احتياطي عبر Selection/Range API للمتصفحات التي لا
            // تدعم execCommand.
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(plainText);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
            // execCommand يُطلق حدث input تلقائياً؛ البديل هنا لا يفعل ذلك.
            if (onInput) onInput();
        }
    });

    return el;
}
