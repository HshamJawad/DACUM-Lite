// ============================================================
// date-default.js — DACUM Date: today by default   (v4.12.6)
//
// THE BUG
//   On Android (installed PWA and Chrome), an EMPTY <input type="date">
//   draws the phone's own locale placeholder. With the phone set to
//   Arabic that is «يوم/شهر/سنة», but the date control lays its
//   segments out left-to-right, so each word is drawn letter by letter
//   in the wrong order and unjoined: «موي/رهش/ةنس» — Arabic letters
//   that read as no language at all. The page cannot style or translate
//   that native placeholder; the only reliable fix is to never show it.
//
// THE FIX
//   #dacumDate always holds a date. It starts as TODAY (local time, not
//   UTC — toISOString() would give yesterday's date before 03:00 in
//   Baghdad) and keeps whatever the user picks. Every path that used to
//   blank the field — a new project, Clear All, loading a JSON/project
//   file without a date — assigns el.value = '' in code, which fires no
//   event. So the element's own `value` setter is wrapped: an empty
//   assignment becomes today's date. A user clearing the field through
//   the date picker is handled by the change/blur listeners.
//
//   The stored project value is whatever the field shows, so today's
//   date is saved with the project on the next save and then stays
//   fixed — it does not drift to "today" again on later days unless the
//   user empties it.
// ============================================================

export function todayISO() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function initDateDefault() {
    const el = document.getElementById('dacumDate');
    if (!el || el.dataset.dateDefault) return;
    el.dataset.dateDefault = '1';

    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (desc && desc.set && desc.get) {
        try {
            Object.defineProperty(el, 'value', {
                configurable: true,
                enumerable: desc.enumerable,
                get() { return desc.get.call(this); },
                set(v) { desc.set.call(this, (v === null || v === undefined || v === '') ? todayISO() : v); }
            });
        } catch (e) {
            console.warn('[DateDefault] could not wrap value setter:', e);
        }
    }

    const fill = () => { if (!el.value) el.value = todayISO(); };
    el.addEventListener('change', fill);
    el.addEventListener('blur', fill);

    fill();
}
