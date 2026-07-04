// ============================================================
// arabic-font.js — Runtime Arabic Font Loader for jsPDF
// DACUM Lite v3.1
//
// HOW IT WORKS
// ────────────
// 1. At the first PDF export in Arabic mode, loadArabicFont(pdf)
//    is called. It fetches the font file from the repo root,
//    converts it to base64 at runtime, then registers it
//    with the jsPDF instance.
// 2. The result is cached in memory so subsequent exports are
//    instant — no second network request.
//
// FONT FILES — PRIORITY ORDER
// ────────────────────────────
// Place ONE of these font files in your repo root (same folder
// as index.html). The loader tries them in order until one
// succeeds:
//
//   1. Tajawal-Regular.ttf   ← Best for UI-style Arabic
//      Free → fonts.google.com/specimen/Tajawal
//      Direct download:
//      github.com/googlefonts/tajawal/raw/main/fonts/ttf/Tajawal-Regular.ttf
//
//   2. Cairo-Regular.ttf     ← Clean geometric, great for headers
//      Free → fonts.google.com/specimen/Cairo
//      Direct download:
//      github.com/googlefonts/cairo/raw/main/fonts/ttf/Cairo-Regular.ttf
//
//   3. Calibri.ttf           ← Available on Windows / Office 365
//      Located at: C:\Windows\Fonts\calibri.ttf
//      (Copy to repo root — do NOT redistribute commercially)
//
// NOTE ON ARABIC TEXT SHAPING
// ────────────────────────────
// jsPDF does not perform Arabic letter-joining (shaping) itself.
// However, when a proper Arabic OpenType font is loaded and
// pdf.setR2L(true) is set, most PDF viewers (Acrobat, Chrome,
// Edge, Foxit) apply the font's GSUB ligature tables automatically
// and display correctly joined Arabic glyphs.
//
// If your PDF viewer still shows disconnected letters, try
// enabling "Use local fonts" in the viewer settings, or switch
// to Acrobat Reader which has the most complete Arabic support.
//
// NOTE ON WORD EXPORT
// ────────────────────
// Arabic RTL in .docx requires bidirectional: true on each
// Paragraph and TextRun plus an embedded Arabic font. This is
// partially scaffolded in events.js exportToWord() and is
// planned as a future enhancement.
// ============================================================

// ── Font candidates (tried in order) ─────────────────────────
const FONT_CANDIDATES = [
    { file: 'Tajawal-Regular.ttf', name: 'Tajawal' },
    { file: 'Cairo-Regular.ttf',   name: 'Cairo'   },
    { file: 'Calibri.ttf',         name: 'Calibri' },
];

// ── Module-level cache ────────────────────────────────────────
let _cachedFont = null;  // { name: string, b64: string } | null

// ─────────────────────────────────────────────────────────────
//  loadArabicFont(pdf)
//
//  Fetch one of the candidate fonts from the repo root,
//  convert it to base64, and register it with the jsPDF
//  instance. Returns the resolved font-family name or null.
//
//  @param  {jsPDF} pdf
//  @returns {Promise<string|null>}
// ─────────────────────────────────────────────────────────────
export async function loadArabicFont(pdf) {
    // Re-use cached result — no second fetch
    if (_cachedFont) {
        _registerFont(pdf, _cachedFont.name, _cachedFont.b64);
        return _cachedFont.name;
    }

    for (const candidate of FONT_CANDIDATES) {
        try {
            const b64 = await _fetchBase64(candidate.file);
            _cachedFont = { name: candidate.name, b64 };
            _registerFont(pdf, candidate.name, b64);
            console.info(
                `[ArabicFont] Loaded "${candidate.file}" → ` +
                `font family "${candidate.name}"`
            );
            return candidate.name;
        } catch {
            console.warn(`[ArabicFont] Not found: ${candidate.file}`);
        }
    }

    // No font file found in repo root
    console.error(
        '[ArabicFont] No Arabic font found.\n' +
        'Place one of these in your repo root:\n' +
        FONT_CANDIDATES.map(c => '  • ' + c.file).join('\n')
    );
    return null;
}

// ─────────────────────────────────────────────────────────────
//  isArabicFontLoaded()
//  Returns true if a font was already fetched and cached.
// ─────────────────────────────────────────────────────────────
export function isArabicFontLoaded() {
    return _cachedFont !== null;
}

// ─────────────────────────────────────────────────────────────
//  getArabicFontName()
//  Returns the loaded font-family name (e.g. 'Tajawal') or null.
// ─────────────────────────────────────────────────────────────
export function getArabicFontName() {
    return _cachedFont ? _cachedFont.name : null;
}

// ── Private: register font with jsPDF ────────────────────────
function _registerFont(pdf, name, b64) {
    const vfsName = name + '-Regular.ttf';
    pdf.addFileToVFS(vfsName, b64);
    pdf.addFont(vfsName, name, 'normal');
}

// ── Private: fetch font file and return base64 string ─────────
async function _fetchBase64(filename) {
    const res = await fetch(filename, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${filename}`);

    const buffer = await res.arrayBuffer();
    const bytes  = new Uint8Array(buffer);

    // Build base64 in chunks to avoid call-stack limits on large fonts
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}
