// DACUM Lite — essential checks. Keep this file small on purpose:
// add a test only when something real broke, with a comment saying what.
const { test, expect } = require('@playwright/test');
const fs = require('fs');

const LOGO_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC',
  'base64');

/** Record uncaught errors and failed requests for our own files. */
function watch(page) {
  const problems = [];
  page.on('pageerror', e => problems.push('uncaught error: ' + e.message));
  page.on('response', r => {
    const u = r.url();
    if (u.startsWith('http://localhost:4173') && r.status() >= 400 && !u.endsWith('/favicon.ico')) {
      problems.push(`${r.status()} ${u}`);
    }
  });
  return problems;
}

async function openApp(page, lang = 'en') {
  await page.goto('/index.html');
  await page.evaluate(l => localStorage.setItem('dacum_lang', l), lang);
  await page.reload();
  await page.waitForFunction(() => window.DacumSelfCheck);
}

/** Duties & Tasks tab, in card view (the view used in workshops). */
async function showCards(page) {
  await page.locator('[data-tab="duties-tab"]').click();
  if (!(await page.locator('.cv-duty-card').count())) {
    await page.locator('[data-i18n="duties.viewCard"]:visible').first().click();
  }
  await expect(page.locator('.cv-duty-card').first()).toBeVisible();
}

/* ── 1. The app starts, in every language ────────────────────────
   The self-check exists because broken links between files raise no
   exception (a font never loaded, a module never imported). It runs
   here on every pull request instead of after release. */
for (const lang of ['en', 'fr', 'ar']) {
  test(`starts cleanly and passes the self-check (${lang})`, async ({ page }) => {
    const problems = watch(page);
    await openApp(page, lang);
    await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    const result = await page.evaluate(() => window.DacumSelfCheck.run());
    expect(result.failures, JSON.stringify(result.failures)).toEqual([]);
    expect(problems).toEqual([]);
  });
}

/* The landing page lives on another origin, so it passes its language
   as ?lang= instead of sharing localStorage. */
test('opens in the language given by ?lang= and remembers it', async ({ page }) => {
  await openApp(page, 'en');
  await page.goto('/index.html?lang=ar');
  await page.waitForFunction(() => window.DacumSelfCheck);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.goto('/index.html');
  await page.waitForFunction(() => window.DacumSelfCheck);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

/* ── 2. Work is not lost ─────────────────────────────────────── */
test('a duty and a task are still there after a reload', async ({ page }) => {
  await openApp(page);
  await showCards(page);
  await page.locator('.cv-duty-text').first().fill('Prepare the workshop room');
  await page.locator('.cv-duty-text').first().blur();
  await page.locator('.cv-task-text').first().fill('Arrange the chairs');
  await page.locator('.cv-task-text').first().blur();

  await page.reload();
  await showCards(page);
  await expect(page.locator('.cv-duty-text').first()).toHaveText('Prepare the workshop room');
  await expect(page.locator('.cv-task-text').first()).toHaveText('Arrange the chairs');
});

/** Give the first duty and its first task some text. */
async function writeFirstCards(page) {
  await page.locator('.cv-duty-text').first().fill('Prepare the workshop room');
  await page.locator('.cv-duty-text').first().blur();
  await page.locator('.cv-task-text').first().fill('Arrange the chairs');
  await page.locator('.cv-task-text').first().blur();
}

/* ── 3. The 👍 agreement mark: desktop and touch tablet ─────────
   Toggles, undoes, and survives a reload. On the tablet it is
   tapped, as in a workshop. */
async function agreementFlow(page, press) {
  await openApp(page);
  await showCards(page);
  await writeFirstCards(page);                 // an empty card cannot be marked
  const duty = page.locator('.cv-duty-card .cv-agree-btn').first();
  const task = page.locator('.cv-task-card .cv-agree-btn').first();

  await press(duty);
  await press(task);
  await expect(duty).toHaveAttribute('aria-pressed', 'true');
  await expect(task).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#floatUndoBtn').click();            // undoes the task mark only
  await expect(task).toHaveAttribute('aria-pressed', 'false');
  await expect(duty).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await showCards(page);
  await expect(page.locator('.cv-duty-card .cv-agree-btn').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.cv-task-card .cv-agree-btn').first()).toHaveAttribute('aria-pressed', 'false');
}

test('agreement mark: toggle, undo and reload (desktop)', async ({ page }) => {
  await agreementFlow(page, loc => loc.click());
});

test.describe('on a touch tablet', () => {
  test.use({ viewport: { width: 820, height: 1100 }, hasTouch: true, isMobile: true });
  test('agreement mark: tap, undo and reload', async ({ page }) => {
    await agreementFlow(page, loc => loc.tap());
  });
});

/* An empty card cannot be agreed on: tapping 👍 shows a notice and
   marks nothing (text of only spaces counts as empty). Once the card
   has text the same tap marks it. */
test('agreement mark: an empty card shows a notice and is not marked', async ({ page }) => {
  await openApp(page);
  await showCards(page);
  const duty = page.locator('.cv-duty-card .cv-agree-btn').first();
  const task = page.locator('.cv-task-card .cv-agree-btn').first();

  await duty.click();
  await expect(page.locator('#dacumNotice')).toBeVisible();
  await expect(duty).toHaveAttribute('aria-pressed', 'false');

  await page.locator('.cv-task-text').first().fill('   ');
  await page.locator('.cv-task-text').first().blur();
  await task.click();
  await expect(task).toHaveAttribute('aria-pressed', 'false');

  await writeFirstCards(page);
  await duty.click();
  await task.click();
  await expect(duty).toHaveAttribute('aria-pressed', 'true');
  await expect(task).toHaveAttribute('aria-pressed', 'true');
});

/* ── 4. Export and import ───────────────────────────────────────
   The project file is how work is backed up and moved between
   machines, so a file we export must be one we can import. */
test('an exported project can be imported again', async ({ page }) => {
  const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });

  await openApp(page);
  await showCards(page);
  await page.locator('.cv-duty-text').first().fill('Exported duty');
  await page.locator('.cv-duty-text').first().blur();
  await page.locator('.cv-duty-card .cv-agree-btn').first().click();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btnExportProject').click(),
  ]);
  const envelope = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  const duty = envelope.project.state.duties[0];
  expect(duty.title).toBe('Exported duty');
  expect(duty.agreed).toBe(true);

  await page.locator('#importProjectInput').setInputFiles(await download.path());
  await expect(page.locator('.sb-project-card')).toHaveCount(2);
  expect(dialogs).toEqual([]);                       // no import error alert
});

/* ── 5. Logos ───────────────────────────────────────────────────
   Upload shows a preview; remove (with its confirmation) clears it. */
test('a logo can be added and removed', async ({ page }) => {
  await openApp(page);
  const preview = page.locator('#producedForImagePreview img');
  const removeBtn = page.locator('#removeProducedForImage');

  await expect(removeBtn).toBeHidden();
  await page.locator('#producedForImageInput').setInputFiles({
    name: 'logo.png', mimeType: 'image/png', buffer: LOGO_PNG,
  });
  await expect(preview).toBeVisible();
  await expect(removeBtn).toBeVisible();

  page.once('dialog', d => d.accept());
  await removeBtn.click();
  await expect(preview).toHaveCount(0);
  await expect(removeBtn).toBeHidden();
});

/* ── Known gap, found while writing these tests ─────────────────
   Chart Info (occupation, "Produced for/by", scope, team…) and the
   logos live in the page and are copied into the saved project only
   when the user switches project or exports. The save hook in app.js
   stores duties and tasks only, and nothing saves on unload — so
   typing Chart Info (or adding a logo) and then reloading or closing
   the browser loses it. Remove `.fixme` once that is fixed. */
test.fixme('chart info and a logo are kept after a reload', async ({ page }) => {
  await openApp(page);
  await page.locator('#occupationTitle').fill('Automotive Technician');
  await page.locator('#producedForImageInput').setInputFiles({
    name: 'logo.png', mimeType: 'image/png', buffer: LOGO_PNG,
  });
  await page.reload();
  await expect(page.locator('#occupationTitle')).toHaveValue('Automotive Technician');
  await expect(page.locator('#producedForImagePreview img')).toBeVisible();
});
