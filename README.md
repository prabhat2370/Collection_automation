# Collection_Auto

Dual-platform end-to-end test automation for **Ripplr CDMS** (Collection and Delivery Management System) — preprod environment.

- **Web side** — Playwright (Chromium) drives the CDMS admin portal and the salesman collection web app.
- **Mobile side** — WebdriverIO + Appium drive the Ripplr DMS Android app on a Pixel_6 emulator.

For deep flow-by-flow documentation see [DOCUMENTATION.md](DOCUMENTATION.md). For mobile-specific setup see [mobile/README.md](mobile/README.md).

---

## Prerequisites

- **Node.js** (ESM-compatible — Node 18+)
- **Git**
- **Playwright browsers** (installed once via `npx playwright install chromium`)
- **For the mobile suite only:** Android Studio with API 33 SDK, a Pixel_6 AVD, Appium 2.x, UiAutomator2 driver. See [mobile/README.md](mobile/README.md) for the full Android setup.
- **For DB-backed assertions only:** SSH access to the preprod RDS bastion (credentials live in `.env`).

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright's Chromium
npx playwright install chromium

# 3. Create .env with DB credentials (see "Environment variables" below)

# 4. Run the smoke test (validates login + all critical web flows are reachable)
npm run smoke
```

---

## Environment variables

`.env` is gitignored. Create one at the repo root with these keys (values supplied out-of-band):

```
DB_SSH_HOST=
DB_SSH_PORT=
DB_SSH_USER=
DB_SSH_PASSWORD=

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

These are consumed by [utils/dbHelper.js](utils/dbHelper.js) to open an SSH tunnel into the preprod MySQL instance for assertion queries.

---

## Folder layout

```
Collection_Auto/
├── web/                      Playwright suite
│   ├── pages/                Page objects (Login, OBC, Seg, Collection, Cash, CBM, etc.)
│   ├── tests/                Specs (one per flow + smokeTest.spec.js)
│   └── playwright.config.js
├── mobile/                   WebdriverIO + Appium suite (Android)
│   ├── pages/                Page objects (Login, Landing, Collection)
│   ├── tests/                .e2e.js specs
│   ├── utils/                locators, appiumHelpers, refsWriter
│   ├── apk/                  APK under test (gitignored)
│   └── wdio.conf.js
├── test-data/                Shared inputs + runtime handoff
│   ├── *.js                  Per-flow config (users, urls, collection, seg, cbm, ...)
│   ├── fixtures/             Committed input files (xlsx, csv, jpg)
│   └── runtime/              Gitignored handoff JSON written by tests
├── utils/                    Shared helpers (auth, excelReader, dbHelper, reportGen)
├── test-cases/               Excel TC workbook + mapping + results updater
├── scripts/                  generateDoc.js (Word user-guide generator)
├── config/                   (reserved for future shared config)
└── DOCUMENTATION.md          Full per-flow reference
```

---

## Common npm commands

| Command                  | What it runs                                        |
| ------------------------ | --------------------------------------------------- |
| `npm run smoke`          | Smoke test — login + critical flows are reachable   |
| `npm run login`          | Web login spec                                      |
| `npm run obc`            | OBC Upload (web)                                    |
| `npm run so`             | Sales Order Upload (web)                            |
| `npm run dA`             | Delivery Allocation (web)                           |
| `npm run segA`           | Seg Allocation (web)                                |
| `npm run collection:web` | Collection flow — browser                           |
| `npm run collection:mobile` | Collection flow — Android (Pixel_6 emulator)     |
| `npm run segV`           | Seg Verification (web)                              |
| `npm run cashV`          | Cash Verification (web)                             |
| `npm run rfc`            | Return to FC (web)                                  |
| `npm run cbm`            | Cheque Bounce (web)                                 |
| `npm run obcE`           | OBC Elimination (web)                               |
| `npm run test:e2e`       | Full chain: OBC → Seg → Collection (mobile) → SegV → CashV |
| `npm run tc:generate`    | Rebuild `test-cases/TestCases_CollectionAuto.xlsx` |
| `npm run tc:update`      | Write last Playwright run's results back into the TC workbook |
| `npm run allure:report`  | Generate + open the Allure HTML report              |

Full list is in [package.json](package.json#L6-L31).

---

## End-to-end run order

The flows have data dependencies — `SO Upload` writes invoice numbers to `test-data/runtime/soInvoices.json` which `Delivery Allocation` and downstream flows consume; `Collection` writes UPI/NEFT references to `collectionRefs.json` consumed by `Cash Verification`.

Recommended order:

```
login → obc → so → dA → segA → collection:mobile → segV → cashV
```

`npm run test:e2e` runs a representative subset of this chain in one shot.

---

## Mobile suite

The mobile side has its own onboarding (Android Studio install, AVD creation, env vars). See [mobile/README.md](mobile/README.md). Once Phase 1 setup is done, the spec is launchable via `npm run collection:mobile`.

---

## Reports

- **Playwright HTML report** — written to `playwright-report/` after each run (gitignored).
- **Allure** — `allure-results/` (raw) → `allure-report/` (rendered). Generate + open with `npm run allure:report`.
- **Excel test-case results** — `npm run tc:update` writes pass/fail and screenshot links back into `test-cases/TestCases_CollectionAuto.xlsx`.

---

## Troubleshooting

- **`Cannot find module` for ESM imports** — confirm `"type": "module"` is in [package.json](package.json#L5) and you're on Node 18+.
- **DB helper hangs on connect** — SSH credentials in `.env` are wrong or the bastion is unreachable. Test with a plain SSH client first.
- **Playwright tests open the wrong URL** — check [test-data/urls.js](test-data/urls.js) — `cdms` vs `collection` portals are distinct.
- **Mobile spec fails to launch app** — `adb devices` shows nothing, or `ANDROID_HOME` not set. See [mobile/README.md](mobile/README.md#troubleshooting).
- **`test-data/runtime/*.json` missing on a downstream flow** — the upstream flow that writes it wasn't run in this session. Re-run from `so` or `collection`.

---

## Where to look next

- Flow-by-flow internals, locator strategy, data contracts → [DOCUMENTATION.md](DOCUMENTATION.md)
- Mobile-specific setup, locator centralization, Flutter caveats → [mobile/README.md](mobile/README.md)
- Test-case management (Excel workbook, TC IDs, screenshot uploads) → [DOCUMENTATION.md §8](DOCUMENTATION.md)
