# Collection_Auto — Full Framework Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Configuration Setup](#3-configuration-setup)
   - [testData.js](#31-testdatajs)
   - [.env](#32-env)
   - [playwright.config.js](#33-playwrightconfigjs)
4. [Utilities](#4-utilities)
   - [excelReader.js](#41-excelreaderjs)
   - [dbHelper.js](#42-dbhelperjs)
   - [soInvoices.json](#43-soinvoicesjson)
   - [collectionRefs.json](#44-collectionrefsjson)
5. [Flow Documentation](#5-flow-documentation)
   - [OBC Upload](#51-obc-upload)
   - [SO Upload](#52-so-upload)
   - [Delivery Allocation](#53-delivery-allocation)
   - [Seg (Allocation)](#54-seg-allocation)
   - [Collection](#55-collection)
   - [Return to FC](#56-return-to-fc)
   - [Seg Verification](#57-seg-verification)
   - [Cash Verification](#58-cash-verification)
6. [Smoke Test](#6-smoke-test)
7. [NPM Run Commands](#7-npm-run-commands)
8. [Database Queries](#8-database-queries)

---

## 1. Project Overview

**Collection_Auto** is a Playwright test automation framework for the **Ripplr CDMS** (Collection and Delivery Management System) preprod environment.

It automates the full collection cycle end-to-end:

```
Login
  └── SO Upload           → captures invoice numbers
  └── Delivery Allocation → allocates invoices to driver
  └── Return to FC        → processes delivery + collection per invoice
  └── OBC Upload          → uploads outbound collection file
  └── Seg Allocation      → assigns invoices to salesman
  └── Collection          → salesman submits payment collection
  └── Seg Verification    → SEG team verifies/rejects collection
  └── Cash Verification   → cashier verifies each payment type
```

**Tech Stack:** Playwright · Node.js (ESM) · MySQL2 · SSH2 · XLSX · Allure

---

## 2. Folder Structure

```
Collection_Auto/
├── config/
│   └── testData.js          # All test configuration (users, URLs, amounts, modes)
├── pages/
│   ├── LoginPage.js
│   ├── obcUpload.js
│   ├── soUploadPage.js
│   ├── deliveryAllocationPage.js
│   ├── segPage.js
│   ├── collectionPage.js
│   ├── returnToFCPage.js
│   ├── segVerificationPage.js
│   └── cashVerificationPage.js
├── tests/
│   ├── obcUpload.spec.js
│   ├── soUpload.spec.js
│   ├── deliveryAllocation.spec.js
│   ├── seg.spec.js
│   ├── collection.spec.js
│   ├── returnToFC.spec.js
│   ├── segVerification.spec.js
│   ├── cashVerification.spec.js
│   └── smokeTest.spec.js    # All flows in one file
├── utils/
│   ├── excelReader.js        # Parses OBC Excel file
│   ├── dbHelper.js           # SSH + MySQL DB helper
│   ├── soInvoices.json       # Runtime: captured invoice numbers
│   ├── collectionRefs.json   # Runtime: UPI/NEFT reference numbers
│   └── testFiles/
│       ├── rfc_doc1.jpg      # Dummy file for RFC upload
│       └── rfc_doc2.jpg
├── .env                      # DB credentials (SSH + MySQL)
├── package.json
└── playwright.config.js
```

---

## 3. Configuration Setup

### 3.1 testData.js

**Path:** `config/testData.js`

Central configuration file. Change values here to control test behavior — no need to edit page/spec files.

```js
// Application URLs
export const URLS = {
    cdms:       'https://cdms-preprod.ripplr.in/login',
    collection: 'https://collection-preprod.ripplr.in/login',
};
```

```js
// User Credentials
export const USERS = {
    obc: { email: 'admin@ripplr.in', password: 'M@ver!ck' },       // Admin/OBC flows
    seg: { email: 'seg4@ripplr.in', password: 'Ripplr@123' },       // SEG flows
    collection: { mobile: '9739492646', pin: '1234' },               // Collection app
    cash: { email: 'cash4@ripplr.in', password: 'Ripplr@123' },     // Cash verification
};
```

```js
// Upload File Paths (Windows absolute paths)
export const FILE_PATHS = {
    obcFile:       'C:\\Users\\User\\Downloads\\preprodobc 2 (version 1).xlsb.xlsx',
    soReport:      'C:\\Users\\User\\Downloads\\m1 6.csv',
    invoiceReport: 'C:\\Users\\User\\Downloads\\h1 6.csv',
    salesRegister: 'C:\\Users\\User\\Downloads\\sr 10.csv',
};
```

```js
// Payment Amounts for Collection
export const AMOUNTS = {
    cash:   '1',   // Cash amount
    cheque: '2',   // Cheque amount
    qr:     '3',   // UPI/QR amount
    neft:   '4',   // NEFT amount
};
```

```js
// Cash Verification Modes per Payment Type
// 'V' = Verify (approve)  |  'R' = Reject  |  'NA' = Skip (do nothing)
export const PAYMENT_MODES = {
    cash:   'NA',
    cheque: 'V',
    upi:    'V',
    neft:   'V',
};
```

```js
// SEG Verification Mode
export const SEG = {
    fc:               'BTML: BTM',
    brand:            'BRIT: Britannia',
    verificationMode: 'V',   // 'V' = Verify | 'R' = Reject
};
```

```js
// Delivery Allocation Config
export const DELIVERY = {
    vehicleNo:    'TN09TN9090',
    driverName:   'Test Driver',
    driverMobile: '8303111111',
    vendor:       'Test Vendor',
    // D = Delivered | PD = Partial Delivered | DA = Delivery Attempted | C = Cancelled
    deliveryStatus: 'D',
};
```

```js
// RFC Collection amounts (empty string = skip that payment type)
export const RFC_COLLECTION = {
    cash:   '1',
    cheque: '',
    upi:    '',
    neft:   '',
};
```

```js
// RFC document upload file paths (relative to project root)
export const RFC_UPLOAD_FILES = [
    'utils/testFiles/rfc_doc1.jpg',
    'utils/testFiles/rfc_doc2.jpg',
];
```

---

### 3.2 .env

**Path:** `.env` (project root)

Stores SSH tunnel and MySQL database credentials. Never commit this file.

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

### 3.3 playwright.config.js

Key settings:

| Setting | Value | Purpose |
|---|---|---|
| `fullyParallel` | `false` | Run tests sequentially |
| `workers` | `1` | Single worker (no parallel tabs) |
| `headless` | `false` | Show browser during run |
| `retries` | `0` (local) / `2` (CI) | Auto-retry on failure in CI |
| `reporter` | HTML + Allure | Test reports |
| `geolocation` | Bangalore (12.97, 77.59) | Required by collection app |

---

## 4. Utilities

### 4.1 excelReader.js

**Path:** `utils/excelReader.js`

Reads the OBC Excel file and extracts invoice/salesman data.

**What it does:**
- Reads `FILE_PATHS.obcFile` using `xlsx` library
- Parses each row to extract `invoiceNo` and `salesman` name
- Converts salesman name to Title Case
- Exports:
  - `allOBCData` — all rows as array of objects
  - `firstOBCData` — first row only (used by SEG and Cash pages)

**Usage:**
```js
import { firstOBCData } from '../utils/excelReader.js';
const { salesman } = firstOBCData;
// salesman = "Abdul Kalam" (Title Case)
```

**When to update:** When the OBC Excel file format/column names change.

---

### 4.2 dbHelper.js

**Path:** `utils/dbHelper.js`

Provides database access via SSH tunnel to AWS RDS MySQL.

#### SSH Tunnel Setup

All DB operations connect through an SSH tunnel:
```
Playwright (local) → SSH tunnel → AWS EC2 → MySQL RDS
```

The tunnel is created and destroyed per query call (no persistent connection).

#### Functions

**`runQuery(sql, params)`**

Generic query executor. Opens SSH tunnel → connects MySQL → runs query → closes both.

```js
import { runQuery } from '../utils/dbHelper.js';
const result = await runQuery('SELECT * FROM invoices WHERE id = ?', [123]);
```

---

**`insertBankStatement(paymentMode, refNumber, amount)`**

Inserts a mock bank statement row into `bank_statement_api` table. Used during Cash Verification to simulate bank-side payment records for UPI and NEFT reconciliation.

```js
await insertBankStatement('UPI', '12345678901234', '3');
await insertBankStatement('NEFT', '123456789012', '4');
```

SQL executed:
```sql
INSERT INTO bank_statement_api (
    bank_name, transaction_date, transaction_number, transaction_type,
    value_date, particulars, cheque_number, ifsc_code, va_number,
    debit, credit, balance, raw_data,
    created_at, created_by, updated_at, updated_by,
    remitter_name, verification_status
) VALUES (
    ?, NOW(), ?, ?,
    NOW(), ?, '', '', '',
    0.00, ?, 0.00, 'Manual entry for payment resolution',
    NOW(), 'SYSTEM', NOW(), 'SYSTEM',
    'Remitter Name', ''
)
```

---

**`subtractCollectionDate(invoiceNo)`**

Moves the `collection_date` back by 1 day for a given invoice. Run after RFC closure to adjust date for next-day processing.

```js
await subtractCollectionDate('INVstore2by');
```

SQL executed:
```sql
UPDATE collection_invoices
SET collection_date = DATE_SUB(collection_date, INTERVAL 1 DAY)
WHERE invoice_no = ?
```

---

### 4.3 soInvoices.json

**Path:** `utils/soInvoices.json`

Runtime file. Written by SO Upload flow, read by Delivery Allocation, RFC, and other downstream flows.

```json
["INVstore2by", "INVstore3by"]
```

**Updated by:** `soUploadPage.captureInvoiceNumbers()`
**Read by:** `returnToFCPage.processAllInvoicesFlow()`, `verifyAllInvoices()`, `subtractCollectionDatesForAllInvoices()`

---

### 4.4 collectionRefs.json

**Path:** `utils/collectionRefs.json`

Runtime file. Written by Collection flow, read by Cash Verification for bank statement insertion.

```json
{
  "upi":  { "refNumber": "12345678901234", "amount": "3" },
  "neft": { "refNumber": "123456789012",   "amount": "4" }
}
```

**Updated by:** `collectionPage` (during UPI/NEFT fill)
**Read by:** `cashVerificationPage.runUPIInsert()`, `runNEFTInsert()`

---

## 5. Flow Documentation

### 5.1 OBC Upload

**File:** `tests/obcUpload.spec.js` | **Page:** `pages/obcUpload.js`
**Login as:** `USERS.obc`
**Run:** `npm run obc`

**Purpose:** Upload the OBC (Outbound Collection) Excel file to CDMS. Validates the upload was processed successfully.

**Flow Steps:**

| Step | Action | Config |
|---|---|---|
| Login | Navigate to CDMS, fill email/password | `USERS.obc` |
| Adapter Uploads | Click nav menu item | — |
| Upload | Click Upload button | — |
| Select Type | Choose "OBC" from dropdown | — |
| Select FC | Type and select BTM | `OBC.fc` |
| Select Brand | Type and select Britannia | `OBC.brand` |
| Upload File | File chooser → select OBC Excel | `FILE_PATHS.obcFile` |
| Submit | Click Submit | — |
| Search | Select OBC in filter → Search (×2 with wait) | — |
| Status Icon | Click status icon to check processing | — |
| Close | Close status modal | — |

**Key Logic:**
- `uploadFileAction(filePath)` uses `page.waitForEvent('filechooser')` to intercept the native file dialog
- After submit, the file is searched twice (6s wait then 3s wait) to allow processing time
- Status icon confirms upload was received

---

### 5.2 SO Upload

**File:** `tests/soUpload.spec.js` | **Page:** `pages/soUploadPage.js`
**Login as:** `USERS.obc`
**Run:** `npm run so`

**Purpose:** Upload three sales report files (SO Report, Invoice Report, Sales Register) and capture the resulting invoice numbers for downstream flows.

**Flow Steps:**

| Step | Action | Config |
|---|---|---|
| Login | Navigate to CDMS | `USERS.obc` |
| Upload | Select "Sales Order" type | — |
| Select FC + Brand | BTM + Britannia | — |
| Upload SO Report | File chooser | `FILE_PATHS.soReport` |
| Upload Invoice Report | File chooser | `FILE_PATHS.invoiceReport` |
| Upload Sales Register | File chooser | `FILE_PATHS.salesRegister` |
| Submit | Click Submit | — |
| Wait & Capture | Poll for "Fully Processed" → capture invoice numbers | timeout: 2 min |

**Key Logic — `waitForFreshUploadAndClickStatus()`:**
- Polls every 5 seconds (max 24 attempts = 2 minutes)
- Looks for a row with status "Fully Processed" AND timestamp within the last 3 minutes
- Falls back to alternative status icon selector if primary not found
- Throws if no fresh upload found within timeout

**Key Logic — `captureInvoiceNumbers()`:**
- Reads all invoice numbers displayed on the results page
- Writes them to `utils/soInvoices.json`
- These invoices are used by all downstream flows

---

### 5.3 Delivery Allocation

**File:** `tests/deliveryAllocation.spec.js` | **Page:** `pages/deliveryAllocationPage.js`
**Login as:** `USERS.obc` (stays logged in from SO Upload if chained)
**Run:** `npm run dA`

**Purpose:** Create a delivery allocation assigning the captured invoices to a specific driver/vehicle.

**Flow Steps:**

| Step | Action | Config |
|---|---|---|
| Logistics Management | Click nav | — |
| Delivery Allocation | Click sub-menu | — |
| Create Allocation | Click create button | — |
| Select Invoices | Read `soInvoices.json` → tick each invoice checkbox | `soInvoices.json` |
| Allocation Modal | Fill vehicle, driver, pick type, allocation type | `DELIVERY.*` |
| Submit | Click Submit | — |
| Primary Button | Confirm first dialog | — |
| Confirm | Confirm final dialog | — |

**Modal Fields Filled:**
- Pick Type: Both
- Vehicle Type: Adhoc
- Allocation Type: Eco
- Vehicle No: `DELIVERY.vehicleNo`
- Driver Name: `DELIVERY.driverName`
- Driver Mobile: `DELIVERY.driverMobile`
- Vendor: `DELIVERY.vendor`

---

### 5.4 Seg (Allocation)

**File:** `tests/seg.spec.js` | **Page:** `pages/segPage.js`
**Login as:** `USERS.seg`
**Run:** `npm run segAllocation`

**Purpose:** SEG team assigns invoices to a specific salesman for collection.

**Flow Steps:**

| Step | Action | Config |
|---|---|---|
| Login | Navigate, fill seg credentials | `USERS.seg` |
| Allocation Link | Click SEG allocation menu | — |
| FC Dropdown | Select BTM | `SEG.fc` |
| Brand Dropdown | Select Britannia | `SEG.brand` |
| Continue | Proceed to invoice list | — |
| Salesman Dropdown | Select salesman from OBC data | `firstOBCData.salesman` |
| Search | Load invoices (5s wait) | — |
| Scroll + Checkbox | Scroll page, tick invoice checkbox | — |
| Assign + Submit | Assign to salesman → Submit | — |

---

### 5.5 Collection

**File:** `tests/collection.spec.js` | **Page:** `pages/collectionPage.js`
**Login as:** `USERS.collection` (mobile + PIN)
**URL:** `URLS.collection`
**Run:** `npm run collection`

**Purpose:** Salesman submits payment collection — cash, cheque, UPI, and NEFT amounts for an invoice.

**Flow Steps:**

| Step | Action | Config |
|---|---|---|
| Navigate | Go to collection app URL | `URLS.collection` |
| Mobile Login | Fill mobile number | `USERS.collection.mobile` |
| PIN Login | Fill 4-digit PIN | `USERS.collection.pin` |
| Down Arrow | Expand invoice | — |
| Cash Amount | Fill cash | `AMOUNTS.cash` |
| Cheque Amount | Fill amount | `AMOUNTS.cheque` |
| Cheque Ref | Auto-generated 6-digit number | random |
| Cheque Bank | Select random bank from list | `BANKS[]` |
| Cheque Due Date | Select today | — |
| UPI Flow | Fill amount + ref number (14 digits) | `AMOUNTS.qr` |
| NEFT Amount | Fill amount | `AMOUNTS.neft` |
| NEFT Ref | Auto-generated 12-digit number | random |
| Auto | Click Auto split reason | — |
| Split Reason | Select "Shop Permanently Closed" | — |
| Final Submit | Submit the form | — |
| Submit Collection | Confirm collection | — |
| Confirmation | Final confirmation (No) | — |

**Key Logic:**
- UPI reference number = `Date.now()` padded to 14 digits
- NEFT reference number = `Date.now()` padded to 12 digits
- Both ref numbers + amounts are saved to `utils/collectionRefs.json`
- Cheque ref = random 6-digit number (100000–999999)

---

### 5.6 Return to FC

**File:** `tests/returnToFC.spec.js` | **Page:** `pages/returnToFCPage.js`
**Login as:** `USERS.obc`
**Run:** `npm run rfc`

**Purpose:** Process all invoices through the Return to FC flow — set delivery status, fill collection form, verify invoices, upload documents, and close the RFC.

**Flow Steps:**

| Step | Action | Config |
|---|---|---|
| Login | CDMS login | `USERS.obc` |
| Logistics Management | Click nav | — |
| Return to FC | Click sub-menu | — |
| Eye Icon | Click view icon for driver (first match) | `DELIVERY.driverName` |
| Process All Invoices | Loop each invoice in `soInvoices.json` | see below |
| Verify All Invoices | Tick check icon per invoice | — |
| Upload RFC Files | Upload 2 documents | `RFC_UPLOAD_FILES` |
| Click Verify RFC | Close the RFC | — |
| Subtract Collection Date | DB update per invoice | SQL |

**Key Logic — `processAllInvoicesFlow(statusCode, collection)`:**

For each invoice in `soInvoices.json`:
1. Navigate back to RFC show page URL
2. Scroll to bottom
3. Click delivery status dropdown for that invoice
4. Select status from `STATUS_MAP`: `D`→Delivered, `PD`→Partial Delivered, `DA`→Delivery Attempted, `C`→Cancelled
5. Click OK (if modal appears), then Yes (confirmation)
6. Click Update → waits for navigation to collection page
7. Scroll to collection form
8. Fill collection form (`fillCollectionForm`)
9. Click Update to submit collection

**Key Logic — `fillCollectionForm(collection)`:**

Only fills a field if `RFC_COLLECTION` value is non-empty:
- `cash` → fills cash amount
- `cheque` → fills amount + random cheque number + bank dropdown + today's due date
- `upi` → fills amount + 14-digit timestamp ref
- `neft` → fills amount + 12-digit timestamp ref

**Key Logic — `verifyAllInvoices()`:**

For each invoice:
- Locates the check icon: `//tr[td[contains(., '${invoice}')]]//td[10]//div[@cursor='pointer'][last()]`
- Checks SVG circle fill: `#023047` = already verified, `#FAFAFA` = not verified
- Clicks only if NOT yet verified (prevents toggle-off)

**Key Logic — `uploadRFCFiles(filePaths)`:**

- Clicks "Upload Inv & Other Doc" button once
- Uses `setInputFiles([file1, file2])` — uploads both files in one call (input has `multiple` attribute)
- Clicks the Upload confirm button (`//div[@class='sc-bczRLJ iVToiv'][normalize-space()='Upload']`)

**Key Logic — `clickVerifyRFC()`:**

- Waits 4 seconds for Verify button to fully load
- Clicks `:text('Verify')` with `force: true`
- If Verify button still visible after 3 seconds, clicks again

**Key Logic — `subtractCollectionDatesForAllInvoices()`:**

- Reads all invoices from `soInvoices.json`
- Runs `subtractCollectionDate(invoiceNo)` for each (DB UPDATE query)

---

### 5.7 Seg Verification

**File:** `tests/segVerification.spec.js` | **Page:** `pages/segVerificationPage.js`
**Login as:** `USERS.seg`
**Run:** `npm run segVerification`

**Purpose:** SEG team verifies or rejects the collection submitted by the salesman.

**Flow Steps:**

| Step | Action | Config |
|---|---|---|
| Login | SEG credentials | `USERS.seg` |
| Click Verification | Navigate to verification section | — |
| Click Salesman Row | Select the salesman from OBC data | `firstOBCData.salesman` |
| Start Verification | Click Start Verification button | — |
| Run Flow | Verify or Reject based on mode | `SEG.verificationMode` |

**Key Logic — `runFlow()`:**

- **`V` (Verify):** Click green tick → click Verify
- **`R` (Reject):** Click red close → fill data correction reason → click Add → click Reject

---

### 5.8 Cash Verification

**File:** `tests/cashVerification.spec.js` | **Page:** `pages/cashVerificationPage.js`
**Login as:** `USERS.cash`
**Run:** `npm run cash`

**Purpose:** Cashier verifies or rejects each payment type (Cash, Cheque, UPI, NEFT) submitted in the collection.

**Flow Steps:**

| Step | Action | Config |
|---|---|---|
| Login | Cash user credentials | `USERS.cash` |
| Collection Settlement | Click nav link | — |
| Salesman Settle | Click action icon for salesman row | `firstOBCData.salesman` |
| Start Verification | Begin verification session | — |
| Run Cash Flow | Verify/Reject/Skip cash | `PAYMENT_MODES.cash` |
| Run Cheque Flow | Verify/Reject/Skip cheque | `PAYMENT_MODES.cheque` |
| Insert UPI Statement | DB insert bank statement | only if `upi !== 'NA'` |
| Run UPI Flow | Verify/Reject/Skip UPI | `PAYMENT_MODES.upi` |
| Insert NEFT Statement | DB insert bank statement | only if `neft !== 'NA'` |
| Run NEFT Flow | Verify/Reject/Skip NEFT | `PAYMENT_MODES.neft` |

**Key Logic — `waitForLoader()`:**

Before each payment section action:
1. Waits for `networkidle` (page fully settled)
2. Checks if `#loader.show` is visible
3. If loader is visible → waits for it to hide (max 15s)
4. If loader not visible → proceeds immediately (no unnecessary wait)

**Key Logic — Per Payment Mode:**

| Mode | Action |
|---|---|
| `V` | `waitForLoader()` → click green tick (`force: true`) → click Save |
| `R` | `waitForLoader()` → click red close (`force: true`) → add reason → click Save |
| `NA` | Skip entirely (do nothing) |

**Bank Statement Insertion (UPI + NEFT):**

Before verifying UPI or NEFT, if `PAYMENT_MODES.upi/neft !== 'NA'`:
1. Reads ref number and amount from `collectionRefs.json`
2. Calls `insertBankStatement(type, refNumber, amount)` → inserts into `bank_statement_api` table
3. Reloads the page so the system recognises the bank statement

---

## 6. Smoke Test

**File:** `tests/smokeTest.spec.js`
**Run:** `npm run smoke`

Runs all 9 flows sequentially in a single test file. Each flow is one test case.

**Test Order:**

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

**To change sequence:** Move test blocks up/down in `smokeTest.spec.js`. Each test is independent and self-contained within the block.

---

## 7. NPM Run Commands

```bash
npm run obc              # OBC Upload
npm run so               # SO Upload
npm run dA               # Delivery Allocation
npm run rfc              # Return to FC
npm run segAllocation    # Seg Allocation
npm run collection       # Collection
npm run segVerification  # Seg Verification
npm run cash             # Cash Verification
npm run smoke            # Full Smoke Test (all flows)

npm run allure:generate  # Generate Allure report
npm run allure:open      # Open Allure report in browser
npm run allure:report    # Generate + Open Allure report
```

---

## 8. Database Queries

### Insert Bank Statement

**When:** Before verifying UPI or NEFT in Cash Verification (if mode ≠ NA)

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

### Update Collection Date

**When:** After RFC is closed, run for each invoice in `soInvoices.json`

```sql
UPDATE collection_invoices
SET collection_date = DATE_SUB(collection_date, INTERVAL 1 DAY)
WHERE invoice_no = 'INVstore2by';
```

### Connection Method

All queries use SSH tunnel:
```
Local machine → SSH (port 5125) → EC2 → MySQL RDS (port 3306, db: cdms)
```

Credentials are loaded from `.env` via `dotenv`.
