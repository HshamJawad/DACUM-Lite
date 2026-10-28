# DACUM Lite — tests

A deliberately small browser test suite (Playwright). Each test guards
something that must never silently break:

- the app starts without errors in English, French and Arabic, and the
  built-in self-check (`app/self-check.js`) passes;
- a duty and a task are still there after a reload;
- the 👍 agreement mark: toggle, undo, reload — with a mouse and with a tap;
- an exported project file can be imported again;
- a logo can be added and removed.

`test.fixme` marks a known gap (currently: Chart Info and logos are not
kept after a reload). Remove `.fixme` when it is fixed.

## Run

```
cd tests
npm install
npx playwright install chromium   # once
npm test
```

The app is plain static files, so the config serves `../app` with
`python3 -m http.server` — there is no build step.

## Adding a test

Add one only when something real broke, and say in a comment what broke.
A short suite is easier to keep green and to trust.
