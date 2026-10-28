// Browser tests for DACUM Lite. Deliberately small: each test guards
// something that must never silently break (the app boots, work is not
// lost, the agreement mark, export/import, logos). Run: npm test
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  // The app is plain static files in ../app — no build step.
  webServer: {
    command: 'python3 -m http.server 4173 --directory ../app',
    url: 'http://localhost:4173/index.html',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'ignore',
    timeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
