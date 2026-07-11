// ============================================================
// version.js — DACUM Lite Version Registry
// Single source of truth for versioning, name, and changelog.
// ============================================================

export const VERSION = {
    major: 4,
    minor: 1,
    patch: 0,

    name: 'DACUM Lite',
    author: 'Husham Jawad Kadhim',

    get full()    { return `${this.major}.${this.minor}.${this.patch}`; },
    get display() { return `${this.name} v${this.full}`; },
    get copyright() {
        return `© 2026 ${this.name} | by ${this.author} | Version ${this.full} | All Rights Reserved`;
    },

    changelog: [
        {
            version: '4.1.0',
            date: '2026-05-05',
            changes: [
                'Renamed application to DACUM Lite',
                'Implemented DACUM standard numbering: Duty A, B, C… / Task A1, A2, B1, B2…',
                'Added drag-and-drop for task cards — move within same duty or across duties',
                'Added drag-and-drop for duty rows — reorder duties up/down',
                'Auto-renaming of duties and tasks after every reorder',
                'New version.js module for centralised version management',
            ]
        },
        {
            version: '4.0.0',
            date: '2026-11-07',
            changes: [
                'Initial public release as DACUM Chart Generator',
                'Multi-project support with sidebar',
                'Card view and table view',
                'PDF and Word export',
                'Undo / Redo with snapshot versioning',
            ]
        }
    ]
};
