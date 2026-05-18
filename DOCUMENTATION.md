# Collection_Auto — Full Framework Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Configuration Setup](#3-configuration-setup)
   - [test-data/](#31-test-data)
   - [.env](#32-env)
   - [web/playwright.config.js](#33-webplaywrightconfigjs)
   - [mobile/wdio.conf.js](#34-mobilewdioconfjs)
4. [Utilities](#4-utilities)
   - [excelReader.js](#41-excelreaderjs)
   - [dbHelper.js](#42-dbhelperjs)
   - [auth.js](#43-authjs)
   - [collectionReportGenerator.js](#44-collectionreportgeneratorjs)
   - [soInvoices.json / collectionRefs.json](#45-runtime-json-files)
5. [Web Flow Documentation](#5-web-flow-documentation)
   - [Login](#50-login)
   - [OBC Upload](#51-obc-upload)
   - [SO Upload](#52-so-upload)
   - [Delivery Allocation](#53-delivery-allocation)
   - [Seg (Allocation)](#54-seg-allocation)
   - [Collection (Web)](#55-collection-web)
   - [Return to FC](#56-return-to-fc)
   - [Seg Verification](#57-seg-verification)
   - [Cash Verification](#58-cash-verification)
   - [Seg Credit Adjustment](#59-seg-credit-adjustment)
   - [OBC Elimination](#510-obc-elimination)
   - [Cheque Bounce (CBM)](#511-cheque-bounce-cbm)
   - [CBM Cash Verification](#512-cbm-cash-verification)
   - [CBM Seg Verification](#513-cbm-seg-verification)
6. [Mobile Flow Documentation](#6-mobile-flow-documentation)
   - [Collection (Android)](#61-collection-android)
7. [Smoke Test](#7-smoke-test)
8. [Test Case Tooling (test-cases/)](#8-test-case-tooling-test-cases)
9. [NPM Run Commands](#9-npm-run-commands)
10. [Database Queries](#10-database-queries)

---

## 1. Project Overview

**Collection_Auto** is a dual-platform test automation framework for the **Ripplr CDMS** (Collection and Delivery Management System) preprod environment.

- **Web side** — Playwright (Chromium) drives the CDMS admin portal and the salesman collection web app.
- **Mobile side** — WebdriverIO + Appium drives the Ripplr DMS Android app on a Pixel_6 emulator.

It automates the full collection cycle end-to-end:

```
Login
  └── SO Upload              → captures invoice numbers
  └── Delivery Allocation    → allocates invoices to driver
  └── Return to FC           → processes delivery + collection per invoice
  └── OBC Upload             → uploads outbound collection file
  └── Seg Allocation         → assigns invoices to salesman
  └── Collection (web/mobile)→ salesman submits payment collection
  └── Seg Verification       → SEG team verifies/rejects collection
  └── Cash Verification      → cashier verifies each payment type
  └── Seg CA / OBC-Elim / CBM→ adjustment, elimination, cheque-bounce sub-flows
```

**Tech Stack:** Playwright · WebdriverIO · Appium · UiAutomator2 · Node.js (ESM) · MySQL2 · SSH2 · XLSX · docx · Allure · Mocha

---

## 2. Folder Structure

```
Collection_Auto/
├── web/                         # Playwright (browser) side
│   ├── pages/                   # Page objects (15)
│   │   ├── BasePage.js
│   │   ├── LoginPage.js
│   │   ├── obcUpload.js
│   │   ├── soUploadPage.js
│   │   ├── deliveryAllocationPage.js
│   │   ├── segPage.js
│   │   ├── segCAPage.js
│   │   ├── collectionPage.js
│   │   ├── returnToFCPage.js
│   │   ├── segVerificationPage.js
│   │   ├── cashVerificationPage.js
│   │   ├── obcEliminationPage.js
│   │   ├── cbmPage.js
│   │   ├── cbmCashVerificationPage.js
│   │   └── cbmSegVerificationPage.js
│   ├── tests/                   # Playwright specs (15)
│   │   ├── login.spec.js
│   │   ├── obcUpload.spec.js
│   │   ├── soUpload.spec.js
│   │   ├── deliveryAllocation.spec.js
│   │   ├── seg.spec.js
│   │   ├── segCA.spec.js
│   │   ├── collection.spec.js
│   │   ├── returnToFC.spec.js
│   │   ├── segVerification.spec.js
│   │   ├── cashVerification.spec.js
│   │   ├── obcElimination.spec.js
│   │   ├── chequeBounce.spec.js
│   │   ├── cbmCashVerification.spec.js
│   │   ├── cbmSegVerification.spec.js
│   │   └── smokeTest.spec.js
│   └── playwright.config.js
│
├── mobile/                      # WebdriverIO + Appium (Android) side
│   ├── pages/                   # Page objects for Android
│   │   ├── BaseAppPage.js
│   │   ├── LoginAppPage.js
│   │   ├── LandingAppPage.js
│   │   ├── InvoiceListAppPage.js
│   │   └── CollectionAppPage.js
│   ├── tests/
│   │   └── collection.e2e.js
│   ├── utils/
│   │   ├── locators.js
│   │   ├── appiumHelpers.js
│   │   └── refsWriter.js
│   ├── apk/                     # APK under test (gitignored)
│   ├── wdio.conf.js
│   └── README.md
│
├── test-data/                   # Shared config + fixtures + runtime state
│   ├── users.js
│   ├── urls.js
│   ├── obcUpload.js
│   ├── salesOrder.js
│   ├── deliveryAllocation.js
│   ├── seg.js
│   ├── collection.js
│   ├── cashier.js
│   ├── rfc.js
│   ├── cbm.js
│   ├── creditUpload.js
│   ├── fixtures/                # All input files committed for reproducibility
│   │   ├── preprodobc 2.xlsx
│   │   ├── m1 6.csv / h1 6.csv / sr 10.csv          # SO Britannia
│   │   ├── S0_122555_sunpure.csv                    # SO Sunpure
│   │   ├── CollectionReport_SUNPURE.xlsx
│   │   ├── CollectionReport- Dabur.xlsx
│   │   ├── CollectionReport - 2026-02-16T...xlsx    # Nestle
│   │   ├── CreditDebitNoteRptAdj_HULS.csv
│   │   ├── Credit_Adjutment_BRITANIA.xlsx
│   │   ├── CreditNoteadjustmentreport_GODREJ.csv
│   │   ├── rfc_doc1.jpg                             # RFC document uploads
│   │   └── rfc_doc2.jpg                             # (Return-to-FC flow)
│   └── runtime/                 # Runtime state — gitignored, produced+consumed by tests
│       ├── soInvoices.json      # Captured invoice numbers (written by SO Upload)
│       └── collectionRefs.json  # UPI/NEFT reference numbers (written by Collection)
│
├── utils/                       # Shared utilities (used by web AND mobile)
│   ├── auth.js                  # Login helpers for web
│   ├── excelReader.js           # OBC Excel parser (shared)
│   ├── dbHelper.js              # SSH-tunneled MySQL helper
│   └── collectionReportGenerator.js
│
├── test-cases/                  # Test-case mapping + Excel workbook generator
│   ├── tcMapping.js             # TC_ID → spec/test/step mapping
│   ├── generateTestCases.js     # Builds TestCases_CollectionAuto.xlsx
│   ├── update-results.js        # Writes Playwright results back into the workbook
│   ├── run-selected.js          # Run a subset of TCs by ID
│   ├── runConfig.js
│   └── TestCases_CollectionAuto.xlsx
│
├── .claude/                     # Claude Code workspace config (pinned plugins)
├── .env                         # DB credentials (gitignored)
├── package.json
├── scripts/
│   └── generateDoc.js           # Word/PDF documentation generator
└── DOCUMENTATION.md             # This file
```

---

## 3. Configuration Setup

### 3.1 test-data/

Central configuration. Edit values here to control test behavior — no need to touch page or spec files.

**`test-data/users.js`** — User credentials per role
```js
export const USERS = {
    obc:        { email: 'admin@ripplr.in',  password: 'M@ver!ck' },
    seg:        { email: 'seg4@ripplr.in',   password: 'Ripplr@123' },
    segCA:      { email: 'segca@ripplr.in',  password: 'Ripplr@123' },
    collection: { mobile: '9739492646', pin: '1234' },   // web AND mobile app
    cash:       { email: 'cash4@ripplr.in',  password: 'Ripplr@123' },
};
```

**`test-data/urls.js`** — Application URLs
```js
export const URLS = {
    cdms:       'https://cdms-preprod.ripplr.in/login',
    collection: 'https://collection-preprod.ripplr.in/login',
};
```

**`test-data/obcUpload.js`** — OBC upload paths, FC, brand. All file paths are repo-relative (resolved from CWD = repo root).
```js
export const OBC_UPLOAD = { fc: 'CMBT: Coimbatore', brand: 'BRIT: Britannia' };
export const OBC_UPLOAD_FILE = 'test-data/fixtures/preprodobc 2.xlsx';
```

**`test-data/salesOrder.js`** — Brand-keyed SO upload config (SO Report + Invoice Report + Sales Register per brand).
```js
export const SALES_ORDER_BRANDS = {
    britannia: {
        // ...
        files: {
            soReport:      'test-data/fixtures/m1 6.csv',
            invoiceReport: 'test-data/fixtures/h1 6.csv',
            salesRegister: 'test-data/fixtures/sr 10.csv',
        },
    },
    sunpure: {
        // ...
        files: { upload: 'test-data/fixtures/S0_122555_sunpure.csv' },
    },
};
```

**`test-data/deliveryAllocation.js`** — Driver/vehicle for Delivery Allocation
```js
export const DELIVERY = {
    vehicleNo:    'TN09TN9090',
    driverName:   'Test Driver',
    driverMobile: '8303111111',
    vendor:       'Test Vendor',
    deliveryStatus: 'D',   // D | PD | DA | C
};
```

**`test-data/collection.js`** — Collection payment amounts + cheque banks
```js
export const AMOUNTS = {
    cash:   '1',
    cheque: '2',
    qr:     '3',
    neft:   '4',
};
export const CONFIRMATION = { submitCollection: 'No' };
export const BANKS = [/* list of bank names to randomly pick from */];
```

**`test-data/cashier.js`** — Cash Verification modes per payment type
```js
export const PAYMENT_MODES = {
    cash:   'NA',  // V = Verify | R = Reject | NA = Skip
    cheque: 'V',
    upi:    'V',
    neft:   'V',
};
```

**`test-data/seg.js`** — Seg + Seg Verification config
```js
export const SEG = {
    fc:               'BTML: BTM',
    brand:            'BRIT: Britannia',
    verificationMode: 'V',   // V | R
};
```

**`test-data/rfc.js`** — RFC collection amounts + doc paths
```js
export const RFC_COLLECTION = { cash: '1', cheque: '', upi: '', neft: '' };
export const RFC_UPLOAD_FILES = [
    'test-data/fixtures/rfc_doc1.jpg',
    'test-data/fixtures/rfc_doc2.jpg',
];
```

**`test-data/cbm.js`** — Cheque Bounce / CBM verification config (reads `test-data/runtime/collectionRefs.json` to look up the bounced cheque ref).

**`test-data/creditUpload.js`** — Per-brand credit-adjustment upload paths used by Seg CA and OBC Elimination. All `filePath` values point at `test-data/fixtures/`; switch active brand via the `activeBrand` constant.

---

### 3.2 .env

**Path:** `.env` (project root, gitignored)

```env
DB_SSH_HOST=<ssh-host-ip>
DB_SSH_PORT=<ssh-port>
DB_SSH_USER=<ssh-username>
DB_SSH_PASSWORD=<ssh-password>

DB_HOST=<mysql-rds-host>
DB_PORT=3306
DB_USER=<mysql-user>
DB_PASSWORD=<mysql-password>
DB_NAME=cdms
```

---

### 3.3 web/playwright.config.js

| Setting | Value | Purpose |
|---|---|---|
| `testDir` | `./tests` | Relative to config → resolves to `web/tests/` |
| `fullyParallel` | `false` | Sequential — flows depend on each other |
| `workers` | `1` | Single worker |
| `headless` | `false` | Visible browser (override with `--headed=false`) |
| `retries` | `0` local / `2` CI | Auto-retry on CI failures |
| `reporter` | `html` + `allure-playwright` + `json` | Triple reporter; JSON drives `test-cases/update-results.js` |
| `geolocation` | Bangalore (12.97, 77.59) | Required by the salesman collection web app |
| `screenshot` | `on` | Captured every step |

All Playwright commands are invoked from the repo root via:
```
npx playwright test --config web/playwright.config.js [path or filter]
```

---

### 3.4 mobile/wdio.conf.js

| Setting | Value | Purpose |
|---|---|---|
| `runner` | `local` | Local WDIO runner |
| `specs` | `tests/**/*.e2e.js` | All `.e2e.js` files under `mobile/tests/` |
| `maxInstances` | `1` | Single device |
| Platform | Android 13 on Pixel_6 AVD | Emulator |
| `automationName` | `UiAutomator2` | Driver |
| `app` | `apk/dms_v2_pre_prod_v0.1.52.apk` | APK under test |
| `appPackage` | `com.ripplr.dms` | |
| `noReset` | `true` | Preserve app state across sessions |
| `framework` | `mocha` | |
| `reporters` | `spec` + `allure` | Allure writes to repo-root `allure-results/` |

**Required environment** (one-time setup; persisted at Windows User scope):
- `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`
- `ANDROID_SDK_ROOT` = same as above
- `PATH` += `%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator`

Verify with `adb version` and `emulator -list-avds` (expect `Pixel_6`).

---

## 4. Utilities

### 4.1 excelReader.js

**Path:** `utils/excelReader.js`

Reads the OBC Excel file and extracts invoice/salesman data. **Shared by web and mobile.**

**What it does:**
- Reads `FILE_PATHS.obcFile` using `xlsx` library
- Parses each row to extract `invoiceNo` and `salesman` name
- Converts salesman name to Title Case
- Exports:
  - `allOBCData` — all rows as array of objects
  - `firstOBCData` — first row only (used by SEG, Cash, and the mobile collection spec)

**Usage:**
```js
// Web
import { firstOBCData } from '../../utils/excelReader.js';
// Mobile
import { firstOBCData } from '../../utils/excelReader.js';
const { salesman, invoiceNo } = firstOBCData;
```

---

### 4.2 dbHelper.js

**Path:** `utils/dbHelper.js`

Database access via SSH tunnel to AWS RDS MySQL. Tunnel is opened per call.

```
Playwright/WDIO (local) → SSH tunnel → AWS EC2 → MySQL RDS
```

**Functions:**

- **`runQuery(sql, params)`** — generic executor.
- **`insertBankStatement(paymentMode, refNumber, amount)`** — mocks a bank-side payment row in `bank_statement_api`, used during Cash Verification for UPI / NEFT reconciliation.
- **`subtractCollectionDate(invoiceNo)`** — moves `collection_date` back 1 day, used after RFC closure.

```js
import { runQuery, insertBankStatement, subtractCollectionDate } from '../../utils/dbHelper.js';
```

---

### 4.3 auth.js

**Path:** `utils/auth.js`

Login helpers for web flows. Imports `LoginPage` / `CollectionPage` from `web/pages/` (cross-folder import; updated post-reorg).

```js
import { loginAs } from '../../utils/auth.js';
await loginAs(page, 'obc');   // role keys: obc, seg, segCA, cash, collection
```

---

### 4.4 collectionReportGenerator.js

**Path:** `utils/collectionReportGenerator.js`

Generates per-invoice collection reports (used by the OBC Elimination duplicate-detection sub-flow and any future report-style assertions).

---

### 4.5 Runtime JSON files

Both files live in `test-data/runtime/` and are **gitignored** — they're state, not source. Produced by upstream flows, consumed by downstream flows. If you clone the repo, these don't exist until you run the producing flow.

**`test-data/runtime/soInvoices.json`** — Invoice numbers captured by SO Upload, consumed by Delivery Allocation, RFC, Verification flows, and Seg CA.
```json
["INVstore2by", "INVstore3by"]
```

**`test-data/runtime/collectionRefs.json`** — UPI/NEFT reference numbers, amounts, and (post-deliveryAllocation) the random vehicle number. Consumed by Cash Verification for bank-statement insertion and by CBM for cheque-bounce lookup.
```json
{
  "upi":  { "refNumber": "12345678901234", "amount": "3" },
  "neft": { "refNumber": "123456789012",   "amount": "4" }
}
```

---

## 5. Web Flow Documentation

> All web specs live in `web/tests/`. All page objects live in `web/pages/`. Run all commands from the repo root.

### 5.0 Login

**File:** `web/tests/login.spec.js` | **Page:** `web/pages/LoginPage.js`
**Run:** `npm run login`

Standalone login smoke. Validates each role's credentials and logout flow. Used as a foundational gate for every other flow (which calls `loginAs(page, role)` from `utils/auth.js`).

---

### 5.1 OBC Upload

**File:** `web/tests/obcUpload.spec.js` | **Page:** `web/pages/obcUpload.js`
**Login as:** `USERS.obc` | **Run:** `npm run obc`

**Purpose:** Upload the OBC (Outbound Collection) Excel file to CDMS. Validates that the upload was processed successfully.

| Step | Action | Config |
|---|---|---|
| Login | Navigate to CDMS, fill email/password | `USERS.obc` |
| Adapter Uploads | Click nav menu item | — |
| Upload | Click Upload button | — |
| Select Type | Choose "OBC" | — |
| Select FC | Type and select BTM | `OBC.fc` |
| Select Brand | Type and select Britannia | `OBC.brand` |
| Upload File | File chooser → OBC Excel | `FILE_PATHS.obcFile` |
| Submit | Click Submit | — |
| Search | Select OBC → Search (×2 with wait) | — |
| Status Icon | Click to verify processing | — |
| Close | Close status modal | — |

**Key Logic:** `uploadFileAction(filePath)` uses `page.waitForEvent('filechooser')` to intercept the native dialog. Status searched twice (6s + 3s waits) to allow async processing.

---

### 5.2 SO Upload

**File:** `web/tests/soUpload.spec.js` | **Page:** `web/pages/soUploadPage.js`
**Login as:** `USERS.obc` | **Run:** `npm run so`

**Purpose:** Upload three sales report files (SO Report, Invoice Report, Sales Register) and capture the resulting invoice numbers.

| Step | Action | Config |
|---|---|---|
| Login | Navigate to CDMS | `USERS.obc` |
| Upload | Select "Sales Order" type | — |
| Select FC + Brand | BTM + Britannia | — |
| Upload SO Report | File chooser | `FILE_PATHS.soReport` |
| Upload Invoice Report | File chooser | `FILE_PATHS.invoiceReport` |
| Upload Sales Register | File chooser | `FILE_PATHS.salesRegister` |
| Submit | Click Submit | — |
| Wait & Capture | Poll for "Fully Processed" → capture invoices | timeout: 2 min |

**Key Logic — `waitForFreshUploadAndClickStatus()`:**
- Polls every 5 s (max 24 attempts = 2 min) for a row with status "Fully Processed" AND timestamp within the last 3 minutes.

**Key Logic — `captureInvoiceNumbers()`:**
- Reads all invoice numbers and writes them to `test-data/runtime/soInvoices.json`.

---

### 5.3 Delivery Allocation

**File:** `web/tests/deliveryAllocation.spec.js` | **Page:** `web/pages/deliveryAllocationPage.js`
**Login as:** `USERS.obc` | **Run:** `npm run dA`

**Purpose:** Assign the captured invoices to a specific driver/vehicle.

| Step | Action | Config |
|---|---|---|
| Logistics Management | Click nav | — |
| Delivery Allocation | Click sub-menu | — |
| Create Allocation | Click create | — |
| Select Invoices | Read `soInvoices.json` → tick each | `soInvoices.json` |
| Allocation Modal | Fill vehicle/driver/pick type/allocation | `DELIVERY.*` |
| Submit + Confirm | Submit, primary, final confirm | — |

Modal fields filled: Pick Type = Both, Vehicle Type = Adhoc, Allocation Type = Eco, Vehicle/Driver/Mobile/Vendor from `DELIVERY`.

---

### 5.4 Seg (Allocation)

**File:** `web/tests/seg.spec.js` | **Page:** `web/pages/segPage.js`
**Login as:** `USERS.seg` | **Run:** `npm run segA`

**Purpose:** SEG team assigns invoices to a specific salesman for collection.

| Step | Action | Config |
|---|---|---|
| Login | SEG credentials | `USERS.seg` |
| Allocation Link | Click SEG allocation menu | — |
| FC Dropdown | Select BTM | `SEG.fc` |
| Brand Dropdown | Select Britannia | `SEG.brand` |
| Continue | Proceed to invoice list | — |
| Salesman Dropdown | Pick from OBC Excel | `firstOBCData.salesman` |
| Search | Load invoices (5 s wait) | — |
| Tick + Assign + Submit | Tick checkbox, assign, submit | — |

---

### 5.5 Collection (Web)

**File:** `web/tests/collection.spec.js` | **Page:** `web/pages/collectionPage.js`
**Login as:** `USERS.collection` (mobile + PIN) | **URL:** `URLS.collection` | **Run:** `npm run collection` (or `collection:web`)

**Purpose:** Salesman submits payment collection (cash, cheque, UPI, NEFT) for an invoice.

| Step | Action | Config |
|---|---|---|
| Navigate | Go to collection app URL | `URLS.collection` |
| Mobile + PIN Login | Fill mobile + 4-digit PIN | `USERS.collection.*` |
| Down Arrow | Expand invoice | — |
| Cash Amount | Fill cash | `AMOUNTS.cash` |
| Cheque (Amount + Ref + Bank + Due Date) | Fill cheque fields | `AMOUNTS.cheque`, random ref, random `BANKS[]` |
| UPI Flow | Fill amount + 14-digit ref | `AMOUNTS.qr` |
| NEFT Flow | Fill amount + 12-digit ref | `AMOUNTS.neft` |
| Auto | Click Auto split-reason | — |
| Split Reason | Select "Shop Permanently Closed" | — |
| Final Submit | Submit form | — |
| Submit Collection | Confirm collection | — |
| Confirmation | Final confirmation = `No` | `CONFIRMATION.submitCollection` |

**Key Logic:**
- UPI ref = `Date.now()` padded to 14 digits; NEFT ref = padded to 12 digits.
- Both ref + amount are written to `test-data/runtime/collectionRefs.json` for downstream cash verification.
- Cheque ref = random 6-digit number (100000–999999).

> See [§6.2 Collection (Android)](#62-collection-android) for the same flow on mobile.

---

### 5.6 Return to FC

**File:** `web/tests/returnToFC.spec.js` | **Page:** `web/pages/returnToFCPage.js`
**Login as:** `USERS.obc` | **Run:** `npm run rfc`

**Purpose:** Process all invoices through Return-to-FC — set delivery status, fill collection form, verify, upload docs, close.

| Step | Action | Config |
|---|---|---|
| Login | CDMS login | `USERS.obc` |
| Logistics Management → Return to FC | Click nav | — |
| Eye Icon | View for first matching driver | `DELIVERY.driverName` |
| Process All Invoices | Loop each in `soInvoices.json` | see below |
| Verify All Invoices | Tick check icon per invoice | — |
| Upload RFC Files | 2 documents | `RFC_UPLOAD_FILES` |
| Click Verify RFC | Close the RFC | — |
| Subtract Collection Date | DB update per invoice | SQL |

**Key Logic:**
- `processAllInvoicesFlow(statusCode, collection)` — per invoice: navigate, scroll, select status (`D/PD/DA/C`), OK/Yes confirmations, Update, fill collection form, Update again.
- `fillCollectionForm(collection)` — only fills fields where `RFC_COLLECTION` value is non-empty.
- `verifyAllInvoices()` — locates check icon per row, checks SVG circle fill (`#023047` = verified, `#FAFAFA` = not). Clicks only if not yet verified (avoids toggle-off).
- `uploadRFCFiles(filePaths)` — `setInputFiles([file1, file2])` in one call.
- `clickVerifyRFC()` — 4 s wait, click with `force: true`, retry if still visible after 3 s.
- `subtractCollectionDatesForAllInvoices()` — runs `subtractCollectionDate(invoiceNo)` for each invoice via DB.

---

### 5.7 Seg Verification

**File:** `web/tests/segVerification.spec.js` | **Page:** `web/pages/segVerificationPage.js`
**Login as:** `USERS.seg` | **Run:** `npm run segV`

**Purpose:** SEG team verifies or rejects the collection.

| Step | Action | Config |
|---|---|---|
| Login | SEG credentials | `USERS.seg` |
| Click Verification | Navigate to verification | — |
| Click Salesman Row | From OBC Excel | `firstOBCData.salesman` |
| Start Verification | Click button | — |
| Run Flow | Verify or Reject | `SEG.verificationMode` |

**Key Logic — `runFlow()`:**
- `V` → green tick → Verify
- `R` → red close → fill data-correction reason → Add → Reject

---

### 5.8 Cash Verification

**File:** `web/tests/cashVerification.spec.js` | **Page:** `web/pages/cashVerificationPage.js`
**Login as:** `USERS.cash` | **Run:** `npm run cashV`

**Purpose:** Cashier verifies / rejects each payment type (Cash, Cheque, UPI, NEFT).

| Step | Action | Config |
|---|---|---|
| Login | Cash credentials | `USERS.cash` |
| Collection Settlement | Click nav | — |
| Salesman Settle | Action icon for row | `firstOBCData.salesman` |
| Start Verification | Begin session | — |
| Run Cash / Cheque Flows | V/R/NA per mode | `PAYMENT_MODES.*` |
| Insert UPI Statement | DB insert if `upi !== 'NA'` | `collectionRefs.json` |
| Run UPI Flow | V/R/NA | `PAYMENT_MODES.upi` |
| Insert NEFT Statement | DB insert if `neft !== 'NA'` | `collectionRefs.json` |
| Run NEFT Flow | V/R/NA | `PAYMENT_MODES.neft` |

**Key Logic — `waitForLoader()`:** Before each payment-section action, waits for `networkidle`, checks `#loader.show`, waits for hide (max 15 s) or proceeds immediately.

| Mode | Action |
|---|---|
| `V` | `waitForLoader()` → green tick (force) → Save |
| `R` | `waitForLoader()` → red close (force) → reason → Save |
| `NA` | Skip entirely |

**Bank Statement Insertion (UPI + NEFT):** Reads ref + amount from `collectionRefs.json`, calls `insertBankStatement(type, ref, amount)`, then `page.reload()`.

---

### 5.9 Seg Credit Adjustment

**File:** `web/tests/segCA.spec.js` | **Page:** `web/pages/segCAPage.js`
**Login as:** `USERS.segCA` | **Run:** `npm run segCA`

**Purpose:** Seg Credit Adjustment for Sunpure invoices — upload credit file and adjust outstanding credit.

Imports `test-data/creditUpload.js` for the credit-file path and adjustment thresholds. See `web/pages/segCAPage.js` for the full step list.

---

### 5.10 OBC Elimination

**File:** `web/tests/obcElimination.spec.js` | **Page:** `web/pages/obcEliminationPage.js`
**Run:** `npm run obcE`

**Purpose:** Multi-scenario test for OBC Elimination — happy path, duplicate detection, and zero-amount skip — for the Godrej GT brand.

Scenarios (each its own `describe` block):
1. **Happy Path** — Upload Collection Report → wait Fully Processed → open View → assert counts → generate per-invoice report.
2. **Duplicate Detection** — Re-upload the same Collection Report → assert `Previously Captured > 0`, `Unique Entries = 0` → DB post-check: no new `obc_adjustment_data` row.
3. **Zero Amount Skipped** — Generate zero-amount file → upload → all counts = 0 (all skipped) → DB post-check: no `obc_adjustment_data` row.

Uses `utils/collectionReportGenerator.js` to build the runtime Collection Report Excel files.

---

### 5.11 Cheque Bounce (CBM)

**File:** `web/tests/chequeBounce.spec.js` | **Page:** `web/pages/cbmPage.js`
**Run:** `npm run cbm`

**Purpose:** Cheque-Bounce-Management flow — marks a previously-collected cheque as bounced, kicking off the downstream CBM cash-verification and seg-verification flows.

Config: `test-data/cbm.js`.

---

### 5.12 CBM Cash Verification

**File:** `web/tests/cbmCashVerification.spec.js` | **Page:** `web/pages/cbmCashVerificationPage.js`
**Run:** `npm run cbmCashV`

**Purpose:** Cash verification for the bounced-cheque follow-up payment.

---

### 5.13 CBM Seg Verification

**File:** `web/tests/cbmSegVerification.spec.js` | **Page:** `web/pages/cbmSegVerificationPage.js`
**Run:** `npm run cbmSegV`

**Purpose:** Seg verification for the bounced-cheque follow-up.

---

## 6. Mobile Flow Documentation

> All mobile specs live in `mobile/tests/`. Run via `wdio run mobile/wdio.conf.js` (npm scripts wrap this). Requires a running `Pixel_6` AVD with the Ripplr DMS APK installed (Appium handles the install on first run via `noReset: true`).

### 6.1 Collection (Android)

**File:** `mobile/tests/collection.e2e.js` | **Pages:** `mobile/pages/LandingAppPage.js`, `mobile/pages/CollectionAppPage.js`
**Login as:** `USERS.collection` (mobile + PIN)

| Step | Action | Config |
|---|---|---|
| Click Collection card on landing | App opens on module-picker landing; assert Collection card visible, tap it, assert navigation away | — |
| Login | Mobile + PIN login (on salesman login screen that appears after the landing tap) | `USERS.collection.*` |
| Navigate to invoice | Look up by `invoiceNo` from OBC Excel | `firstOBCData.invoiceNo` |
| Down Arrow | Expand invoice | — |
| Cash (if `AMOUNTS.cash`) | Fill cash | `AMOUNTS.cash` |
| Cheque (if `AMOUNTS.cheque`) | Amount + Ref + Random bank + Today | `AMOUNTS.cheque`, `BANKS[]` |
| UPI (if `AMOUNTS.qr`) | UPI flow | `AMOUNTS.qr` |
| NEFT (if `AMOUNTS.neft`) | Amount + Ref | `AMOUNTS.neft` |
| Auto | Click Auto split | — |
| Split Reason | "Shop Closed" | — |
| Final Submit + Confirm | Submit + confirm | `CONFIRMATION.submitCollection` |

Parity with the web Collection flow (§5.5) — same `test-data/collection.js` config, same `firstOBCData` from the OBC Excel. Mobile-specific selectors live in `mobile/utils/locators.js`.

**Run:** `npm run collection:mobile`

---

## 7. Smoke Test

**File:** `web/tests/smokeTest.spec.js`
**Run:** `npm run smoke`

Runs all major web flows sequentially in a single test file. Each flow is one test case.

| # | Test Case | Login User |
|---|---|---|
| 1 | Login | OBC (admin) |
| 2 | SO Upload | — (stays logged in) |
| 3 | Delivery Allocation | — (stays logged in) |
| 4 | Return to FC | — (stays logged in) |
| 5 | OBC Upload | — (stays logged in) |
| 6 | Seg | SEG user (re-login) |
| 7 | Collection | Collection mobile/PIN |
| 8 | Seg Verification | SEG user (re-login) |
| 9 | Cash Verification | Cash user (re-login) |

To change sequence: reorder test blocks in `smokeTest.spec.js`. Each test is independent and self-contained.

For a **cross-platform** smoke that injects the Android collection in the middle, use `npm run test:e2e` (`obc → segA → collection:mobile → segV → cashV`).

---

## 8. Test Case Tooling (test-cases/)

Generates and updates a TC management workbook (`test-cases/TestCases_CollectionAuto.xlsx`) from a single mapping file.

| File | Purpose |
|---|---|
| `tcMapping.js` | TC_ID → `{ specFile, testTitle, stepName }`. `stepName: ''` means match at test level (no `test.step()`). Empty `specFile` means manual TC. |
| `generateTestCases.js` | Builds the Excel workbook (columns: TC ID, Title, Module, Pre-conditions, Steps, Expected, Priority, Status, Linked Spec/Test/Step). Run via `npm run tc:generate`. |
| `update-results.js` | Reads Playwright JSON report (`test-results/results.json`) and writes pass/fail back into the workbook. Run via `npm run tc:update`. |
| `run-selected.js` | Executes a subset of TCs (by ID). Run via `npm run test:selected`. |
| `runConfig.js` | Holds TC selection list / filters for `run-selected.js`. |

**Daily flow:**
```bash
npm run test:daily   # runs full Playwright suite, then updates the workbook
```

After the reorg, every `specFile` in `tcMapping.js` was updated from `tests/...` → `web/tests/...`.

---

## 9. NPM Run Commands

### Web flows (Playwright)
```bash
npm run login          # Login smoke
npm run obc            # OBC Upload
npm run so             # SO Upload
npm run dA             # Delivery Allocation
npm run rfc            # Return to FC
npm run segA           # Seg Allocation
npm run segCA          # Seg Credit Adjustment
npm run collection     # Collection (web; alias of collection:web)
npm run collection:web # Collection (web; explicit)
npm run segV           # Seg Verification
npm run cashV          # Cash Verification
npm run obcE           # OBC Elimination
npm run cbm            # Cheque Bounce (CBM)
npm run cbmCashV       # CBM Cash Verification
npm run cbmSegV        # CBM Seg Verification
npm run smoke          # Full web smoke (all flows in one file)
```

### Mobile flows (WDIO + Appium)
```bash
npm run collection:mobile   # Mobile Collection (includes post-login landing assertions)
```

### Cross-platform end-to-end
```bash
npm run test:e2e       # obc → segA → collection:mobile → segV → cashV
```

### Test-case workbook
```bash
npm run tc:generate    # Build TestCases_CollectionAuto.xlsx from tcMapping.js
npm run tc:update      # Update workbook with Playwright JSON results
npm run test:selected  # Run a curated subset of TCs
npm run test:daily     # Full suite + update workbook
```

### Allure reporting
```bash
npm run allure:generate   # Build static report from allure-results/
npm run allure:open       # Open existing report in browser
npm run allure:report     # Generate + Open
```

---

## 10. Database Queries

### Insert Bank Statement (UPI / NEFT)

Run by `insertBankStatement(mode, ref, amount)` before Cash Verification for UPI / NEFT, when `PAYMENT_MODES.upi/neft !== 'NA'`.

```sql
INSERT INTO bank_statement_api (
    bank_name, transaction_date, transaction_number, transaction_type,
    value_date, particulars, cheque_number, ifsc_code, va_number,
    debit, credit, balance, raw_data,
    created_at, created_by, updated_at, updated_by,
    remitter_name, verification_status
) VALUES (
    'UPI', NOW(), '12345678901234', 'UPI',
    NOW(), '12345678901234', '', '', '',
    0.00, 3.00, 0.00, 'Manual entry for payment resolution',
    NOW(), 'SYSTEM', NOW(), 'SYSTEM',
    'Remitter Name', ''
);
```

### Update Collection Date (post-RFC)

Run by `subtractCollectionDate(invoiceNo)` for each invoice in `soInvoices.json`.

```sql
UPDATE collection_invoices
SET collection_date = DATE_SUB(collection_date, INTERVAL 1 DAY)
WHERE invoice_no = 'INVstore2by';
```

### OBC Elimination post-checks

Used by the duplicate-detection and zero-amount scenarios in `obcElimination.spec.js` to assert that re-uploaded / zero-amount collection reports do **not** create new `obc_adjustment_data` rows.

```sql
SELECT COUNT(*) FROM obc_adjustment_data WHERE <run-specific predicate>;
```

### Connection Method

All queries use an SSH tunnel:
```
Local machine → SSH (port from $DB_SSH_PORT) → EC2 → MySQL RDS (port 3306, db: cdms)
```

Credentials are loaded from `.env` via `dotenv`. The tunnel is opened and closed per-query (no persistent connection).
