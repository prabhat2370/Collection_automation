# Ripplr Collections – QA Handover (End-to-End)

**Prepared by:** Prabhat Kumar Singh (QA)
**Environment:** Pre-prod
**Repo:** `Collection_Auto` (Playwright web suite + Appium mobile suite)

This document explains the Ripplr Collections lifecycle: what each step is for, how to do it by hand and how the automation does it. It covers a sales order from upload through delivery, collection and settlement, and then the cheque bounce recovery flow.

> **Out of scope:** OBC (On-Board Courier) file upload. It is no longer part of the current flow and is not covered here.

---

## 1. Environment & Access

| Item | Value |
|---|---|
| CDMS (admin / seg / cashier portal) | https://cdms-preprod.ripplr.in/login |
| Collection app | Android **DMS app** (`dms_v2_pre_prod_v0.1.52.apk`, package `com.ripplr.dms`). Web collection (`collection-preprod.ripplr.in`) is blocked by dev and kept only as a fallback. |
| Credentials | `test-data/users.js` (passwords are not repeated here) |
| DB access | MySQL over an SSH tunnel; the credentials are in `.env` (`DB_SSH_*`, `DB_*`) |

### Roles

| Role | Key in `users.js` | Login | Responsible for |
|---|---|---|---|
| Admin | `obc` | `admin@ripplr.in` | SO Upload, Delivery Allocation, Return to FC, Credit Adjustment upload, Cheque Bounce entry |
| Segregator | `seg` | `segobc2@ripplr.in` | Assigning invoices to the salesman (Seg CA), Seg Verification, CBM acknowledge/assign, CBM Seg Verification |
| Cashier | `cash` | `cashobc2@ripplr.in` | Collection Settlement (Cash Verification), Mark Cheque Bounce, CBM Cash Verification |
| Salesman | `collection` | Mobile number + PIN | Collecting payment in the DMS mobile app |

Logout: profile icon → **Logout** → **Yes**.

---

## 2. End-to-End Flow at a Glance

```
 ADMIN                         ADMIN                     ADMIN
 SO Upload  ──────────────►  Delivery Allocation  ──►  Return to FC
 (Sales Order created,        (vehicle + delivery       (Delivered + delivery-side
  Ready for Dispatch)          boy assigned)             collection entry, POD, Verify)
                                                                │
                    ┌───────────────────────────────────────────┘
                    ▼
 SEG  Seg Verification (Deliverer, D)  ─►  CASHIER  Cash Verification (Deliverer, D)
                    │
                    ▼
 SEG  Seg CA – assign invoices to salesman  (Credit Adjustment upload if blocked)
                    │
                    ▼
 SALESMAN  Collection in DMS mobile app  (Cash / Cheque / UPI / NEFT → Submit)
                    │
                    ▼
 SEG  Seg Verification (Salesman, S)  ─►  CASHIER  Cash Verification (Salesman, S)
                    │
                    ▼
 Cheque Bounce (optional):  CBM (Admin → Cashier → Seg) ─► CBM Seg Verif. ─► CBM Cash Verif.
```

### Status lifecycle

| Stage | Status |
|---|---|
| Admin – SO upload | Upload: **Fully Processed / Partially Processed** → Sales Order: **Ready for Dispatch** |
| Logistics – Delivery Allocation | **Vehicle Allocated** |
| Logistics – Return to FC | **Delivered** / Partial Delivered / Delivery Attempted / Cancelled |
| Segregation – Seg CA | **Assigned to Salesman** (invoices handed over) |
| Collection – mobile submit | **Collection Submitted → Ready for Verification** |
| Seg + Cashier verification | **Verified → Completed** |

### Run order (automation)

Run each step as its own `npm run` command, in this order. Every web script runs headed using `web/playwright.config.js`.

| # | Step | Command | Role |
|---|---|---|---|
| 1 | SO Upload | `npm run so` | Admin |
| 2 | Delivery Allocation | `npm run dA` | Admin |
| 3 | Return to FC | `npm run rfc` | Admin |
| 4 | Seg Verification – Deliverer | `npm run segV` (with `verificationType: 'D'`) | Seg |
| 5 | Cash Verification – Deliverer | `npm run cashV` (with `verificationType: 'D'`) | Cashier |
| 6 | Seg CA (assign to salesman) | `npm run segCA` | Seg (+ Admin if CA upload is needed) |
| 7 | Collection (mobile) | `npm run collection:mobile` | Salesman |
| 8 | Seg Verification – Salesman | `npm run segV` (with `verificationType: 'S'`) | Seg |
| 9 | Cash Verification – Salesman | `npm run cashV` (with `verificationType: 'S'`) | Cashier |
| 10 | Cheque Bounce entry | `npm run cbm` | Admin → Cashier → Seg |
| 11 | CBM Seg Verification | `npm run cbmSegV` | Seg |
| 12 | CBM Cash Verification | `npm run cbmCashV` | Cashier |

> **Important:** Before step 8, edit `test-data/seg.js` by hand and change `verificationType` from `'D'` to `'S'`. Change it back to `'D'` before the next full cycle. `cashier.js` reads this flag only once, when it loads, so each pass has to be a separate `npm run`.

---

## 3. Flow Details

### 3.1 Sales Order Upload (Admin)

**Purpose:** Turn the brand's invoice data into live Sales Orders in CDMS.

**Pre-checks (from the business flow):**
- The invoice number is identical in every file of the upload.
- Store names are spelled correctly, and invoice amounts match across files.
- The correct Brand and FC are selected.
- Re-uploading the same invoice numbers causes a **duplicate** error, so always use fresh invoice numbers.

**Brand configurations** (`test-data/salesOrder.js`, switched with `ACTIVE_SO_BRAND`):

| | **Sunpure – current / primary** | Britannia – alternative |
|---|---|---|
| `ACTIVE_SO_BRAND` | `'sunpure'` | `'britannia'` |
| FC | `BGRD: Begur Road` | `BTML: BTM` |
| Brand | `SNPR: Sunpure` | `BRIT: Britannia` |
| Files | One CSV: **Upload a File** | Three files: **SO Report (M16)**, **Invoice Report (H16)**, **Sales Register (SR10)** |
| Source file | `uploadSource: 'system'` → `C:/Users/User/Downloads/S0_122555_sunpure.csv`; `'testdata'` → `test-data/fixtures/S0_122555_sunpure.csv` | `test-data/fixtures/m1 6.csv`, `h1 6.csv`, `sr 10.csv` |
| Invoice no. generation | `Sales Invoice No` is rewritten to `SUNInv###XXX`. The file is capped at `invoiceCount` (5) rows and written to `test-data/runtime/sunpure_so_upload.csv`. The source file is not changed. | `Invoice No` is rewritten to `INV1store#xxx` **in place** in all 3 fixtures, using the same number in each file |
| Store override | `changeStoreForAll: 'YES'` sets every row to one store ("Fresh and more super market") | – |

**Manual steps:**
1. Log in as Admin.
2. **Adapter Uploads → Upload**.
3. Set **Type** = *Sales Order*, then the **FC** and the **Brand** from the table above.
4. Upload the file(s): one CSV for Sunpure, or M16 / H16 / SR10 for Britannia.
5. Click **Submit**.
6. Go to the **Adapter Uploads** list → **Select File Type** = *Sales Order* → **Search**. Use **Refresh** if the new row doesn't show.
7. Wait until the status of the latest row is **Fully Processed** or **Partially Processed**, then click the status icon to see the invoices that were created.
8. **Duplicate / readiness check:** **Order Management → Sales Order** → search for the invoice number. The status must be **Ready for Dispatch**. If it is *Pending*, *Failed* or *Not Ready*, fix the data before you continue.

**Automation (`npm run so`):** `web/tests/soUpload.spec.js`, `web/pages/soUploadPage.js`, `utils/collectionReportGenerator.js`
- Generates fresh invoice numbers, uploads the file(s) and submits. It then saves a screenshot to `utils/afterSubmit.png` and logs any toasts or errors.
- Checks the latest Sales Order upload every 5 s for up to 2 min:
  - It fails if the status is **Validation Error**.
  - It ignores rows older than 5 min.
- Reads the invoices that were created and writes them to **`test-data/runtime/soInvoices.json`**. Every later step reads its invoices from this file.

**Common issues:** a Validation Error from a store or retailer code mismatch, a duplicate invoice, the wrong FC or brand, or a source CSV that is an old error export (it has extra `Error` columns).

---

### 3.2 Delivery Allocation (Admin)

**Purpose:** Assign invoices that are *Ready for Dispatch* to a vehicle and a delivery boy. Only invoices with that status can be allocated.

**Manual steps:**
1. **Logistics Management → Delivery Allocation → Create Delivery Allocation**.
2. Filter by FC and Brand, then tick the invoices. You can select several.
3. Click **Allocate Vehicle**, then **Skip** if it is shown.
4. Fill the modal:

| Field | Automation value |
|---|---|
| Pick Type | Both |
| Vehicle Type | Adhoc |
| Allocation Type | Regular |
| Vehicle No | Random, format `AA00AA0000` (e.g. `TN09TN9090`) |
| Driver Name | Lakshman pad |
| Vendor | Lakshman pad |
| Driver Mobile | 8303111111 |
| Delivery Boy | Delivery Boy (**mandatory**) |

5. Click **Submit → Confirm → Confirm**. If the e-way bill popup **Confirm vehicle allocation** appears, click **Confirm** again.

**Automation (`npm run dA`):** `web/tests/deliveryAllocation.spec.js`, `web/pages/deliveryAllocationPage.js`, `test-data/deliveryAllocation.js`
- Selects every invoice listed in `soInvoices.json`. An invoice it can't find is logged and skipped.
- Saves the generated vehicle number to **`test-data/runtime/collectionRefs.json` → `delivery.vehicleNo`**. Return to FC and the Deliverer-side verifications look up this vehicle.
- **Blocked allocation:** if the message "*allocation is blocked because…*" appears (a stale pending RFC), the test closes the old allocations in the DB (`Allocations.status = 'CO'` for the FC), dismisses the popup and retries.

---

### 3.3 Return to FC (Admin) – delivery status + delivery-side collection

**Purpose:** Record each invoice's delivery outcome, record the payment collected at delivery, attach proof of delivery and verify the trip.

**Manual steps:**
1. **Logistics Management → Return to FC** → filter by FC → click the **eye icon** on the row for your vehicle number.
2. For **each invoice**:
   1. Set the **Delivery Status** dropdown to *Delivered* (other options: *Partial Delivered*, *Delivery Attempted*, *Cancelled*). Click **OK / Yes** if prompted.
   2. Click **Update**. This opens the invoice's collection form.
   3. Enter the delivery-side collection:

| Mode | Automation value | Details |
|---|---|---|
| Cash | 4 | – |
| Cheque | 2 | Random 6-digit cheque no., first bank in the list, due date today |
| UPI | 6 | 14-digit UPI reference number |
| NEFT | 2 | 12-digit reference number |

   To add more rows of the same mode, use **Add more cheque / UPI / NEFT**. The automation also ticks the **Invoice Returned** radio.

   4. Click **Update**.
3. Back on the trip view, tick the **verify** checkbox for each invoice. A dark-filled icon means the invoice is already verified.
4. Click **Upload Inv & Other Doc** twice and upload the 2 POD images (`rfc_doc1.jpg`, `rfc_doc2.jpg`), clicking **Upload** each time.
5. Click **Verify**. RFC is complete when the Verify button becomes **disabled**.

**Automation (`npm run rfc`):** `web/tests/returnToFC.spec.js`, `web/pages/returnToFCPage.js`, `test-data/rfc.js`
- The delivery status comes from `deliveryStatus` (`D` = Delivered, `PD` = Partial Delivered, `DA` = Delivery Attempted, `C` = Cancelled).
- The amounts come from `RFC_COLLECTION`. Comma-separated values create multiple rows.
- The UPI and NEFT refs are saved to `collectionRefs.json` so that Cash Verification can insert matching bank statements.
- If **Update** does not open the collection form, the invoice is treated as already processed and skipped.
- The test fails with "RFC NOT completed" if **Verify** is still enabled after two clicks.

---

### 3.4 Seg Verification (Segregator) – runs twice

**Purpose:** The segregator confirms the collection entries before they reach the cashier. It runs once for the **Deliverer** (the RFC collection) and once for the **Salesman** (the mobile collection).

Configuration is in `test-data/seg.js`:
- `verificationType`: `'D'` = Deliverer, `'S'` = Salesman
- `verificationMode`: `'V'` = verify, `'R'` = reject

**Manual steps:**
1. Log in as Seg → **Verification**.
2. Open the row:
   - **Deliverer (D):** **Deliverer** tab → the row with your vehicle number → open it.
   - **Salesman (S):** the salesman's row → **Start Verification**. The automation reads the salesman name from `fixtures/preprodobc 2.xlsx` (currently *Mahesh*). It must be the salesman you assigned in Seg CA.
3. **Verify:** click the green tick on every entry that isn't verified yet (filled ticks are already done) → **Save**.
   **Reject:** click the red cross → **Add Reason** → *Data Correction* → **Add** → **Save**.

**Automation:** `npm run segV`, using `web/tests/segVerification.spec.js` and `web/pages/segVerificationPage.js`.

---

### 3.5 Cash Verification / Collection Settlement (Cashier) – runs twice

**Purpose:** The final financial check. The cashier checks the amount received and the cash total, plus the UPI, NEFT and cheque details, against the system entries. This catches short and excess payments. Verified entries are settled.

**Pre-requisite for UPI/NEFT:** the system matches UPI and NEFT entries against bank statements. In pre-prod the automation inserts a matching row into `bank_statement_api` for each UPI and NEFT ref in `collectionRefs.json`, with the same reference number and amount, and then reloads the page. To test by hand, you need the same bank statement rows.

**Manual steps:**
1. Log in as Cashier → **Collection Settlement**. It lists the invoices that are *Ready for Verification*.
2. Open the row:
   - **D:** **Deliverer** tab → vehicle row
   - **S:** the salesman's row
3. Click **Start Verification**. Then work through each step tab:

| Tab | Verify (V) | Reject (R) |
|---|---|---|
| Cash | Green tick → **Save** | Red cross → **Add Reason** → comment → **Add** |
| Cheque | Green tick → **Save** | Red cross → *Both* → **Submit** |
| UPI | Green tick → **Save** (after the bank statement exists) | Red cross + reason |
| NEFT | Tick the invoice checkboxes → **Verify** (D path), or per-row green tick | Red cross + reason |

**Automation (`npm run cashV`):** `web/tests/cashVerification.spec.js`, `web/pages/cashVerificationPage.js`, `test-data/cashier.js`
- The V/R choice for each mode comes from `RFC_PAYMENT_MODES` (D pass) or `COLLECTION_PAYMENT_MODES` (S pass). The values are arrays matched to rows by position.
- Needs `collectionRefs.json` and `soInvoices.json`. It stops with "run collection test first" if the refs file is missing.

---

### 3.6 Seg CA – Assign Invoices to Salesman (Segregator)

**Purpose:** Hand over the outstanding invoices to the field salesman. This pushes them to the salesman's DMS mobile app.

**Manual steps:**
1. Log in as Seg → **Allocation**.
2. Set **Select FC** = `BGRD: Begur Road` and **Select Brand** = `SNPR: Sunpure`, then click **Continue**.
3. For each invoice: type it in the **Invoice Number** box → **Search** → tick its checkbox.
4. Click **Assign** → **Select salesman** → search by the salesman's mobile number → **Confirm Assignment**. If prompted, click **Remove and Continue with Other Invoices**.
5. Click **Handover Invoices**.
6. Check that all your invoices appear under the salesman.

**Blockers and how to clear them:**

| Popup | Cause | Fix |
|---|---|---|
| **Pending Financial Adjustment** | The brand/FC has a credit adjustment that hasn't been uploaded | Click **Close** and log out. Log in as Admin → **Adapter Uploads → Upload** → Type *Credit Adjustment*, FC BGRD, Brand SNPR → upload `fixtures/CollectionReport_SUNPURE.xlsx` → **Submit**. Wait about 15 s, log back in as Seg and redo the assignment. |
| **Some invoices cannot be assigned** | Those invoices still have an unverified state | The automation sets them to `VerifiedByCashier` in the DB (`collection_invoices.invoice_verification_status`), then cancels and retries. |

**Automation (`npm run segCA`):** `web/tests/segCA.spec.js`, `web/pages/segCAPage.js`
- Uses the invoices in `soInvoices.json` and the salesman mobile from `users.js` (`collection`).
- Checks that the number of Sunpure rows equals the number of invoices in `soInvoices.json`.

---

### 3.7 Collection – Salesman (DMS Mobile App)

**Purpose:** The salesman records the payment received at the store. **Once submitted, the collection is locked and cannot be edited**, so check every value before you submit. After submission the invoice moves to **Ready for Verification**.

**Manual steps (Android DMS app):**
1. Open the app → **Collect Outstanding Value** → **Salesman** → enter the mobile number → **Next** → PIN → **Login**.
2. **Update Collection** → open the invoice, searching for it by invoice number if needed.
3. On the **Payment Collection** tab, enter the payments:

| Mode | Automation value | Steps |
|---|---|---|
| Cash | 4 | Type the amount |
| Cheque | 5 | **Add Cheque** → amount, 6-digit cheque no., **Bank Name**, **Due Date** → **OK** → **Save** |
| UPI | 2 | **Scan QR / Add UPI** → **Problem with QR? Add Manually** → amount + 14-digit ref → **Add UPI** |
| NEFT | 3 | **Add NEFT/RTGS** → amount + reference → **Save** |

4. Click **Proceed to Adjustment**. Click **Auto** if shown, pick a **Reason** (e.g. *Shop Permanently Closed*), then **Save / Update**.
5. **Confirm Submission** → **Submit** → **Skip without returns** → **Submit Collection** → **Yes**.

**Automation (`npm run collection:mobile`):** `mobile/tests/collection.e2e.js`, `mobile/pages/*`, `mobile/utils/locators.js`, `test-data/collection.js`
- **Device setup:** Android Studio emulator AVD `Pixel_6` (API 33), Appium + UiAutomator2, and the APK in `mobile/apk/`. Full steps are in `mobile/README.md`.
- Start the emulator first with `emulator -avd Pixel_6`. The Appium service starts automatically on port 4723.
- The app is built in **Flutter**, so locators use accessibility labels (content-desc) and visible text. Keep them in `mobile/utils/locators.js`.
- Opens the **first invoice** in `soInvoices.json`.
- At the start of the run `collectionRefs.json` is reset. The run then writes the cheque, UPI and NEFT refs collected here. Cash Verification (S) and Cheque Bounce read them.
- Fallback: web collection, `npm run collection:web`. Use it only if dev unblocks it.

---

### 3.8 Cheque Bounce (CBM) and Recovery Verification

**Purpose:** Handle a cheque collected from a store that later bounces. The bounce is recorded, the cheque is routed to a sales officer for recovery, and the recovered amount is verified.

**Data:** `test-data/cbm.js`. The cheque number and amount are taken from the mobile collection's cheque ref in `collectionRefs.json`; the fallback is `896464`. Other values: FC *Begur Road*, segregator *segOBC2 SEG*, sales officer *Prabhat kumar*.

**Step A – Bounce entry (`npm run cbm`), 3 roles in sequence:**
1. **Admin:** **Cheque Bounce → Cheque Bounce List** → **Add**:
   - Enter the cheque number → **Invoice Mapping** → tick the Begur Road row.
   - **Submit and Close** → **Yes**.
2. **Cashier:** **Cheque Bounce → Mark Bounce**:
   - Open the cheque → reason *Signature Difference* → upload 2 images → **Submit**.
   - **Handover Bounce** tab → row action → **Choose Segregator** → **Assign Cheque** → **Close**.
3. **Seg:**
   - **Acknowledge Now** → **Yes** → **Submit**.
   - Summary row action → **Choose Officer** (the sales officer) → **Assign Cheque** → **Close**.

**Step B – CBM Seg Verification (`npm run cbmSegV`, Seg):**
**Cheque Bounce → Verification list** → the officer's row in the *Ready for Verification* cell → **check** (verify) or **close** (reject) → **Save**.

**Step C – CBM Cash Verification (`npm run cbmCashV`, Cashier):**
**Cheque Bounce → Bounce Recovery Verification** → the officer's row → **Start Verification** → verify each mode (green tick → **Save**). Per-mode V/R/NA settings are in `CBM_COLLECTION`. NA skips that mode.

---

## 4. Test Data & Runtime Handoff Files

| File | Written by | Read by | Contents |
|---|---|---|---|
| `test-data/runtime/soInvoices.json` | SO Upload | dA, RFC, Seg CA, Collection, Cash Verification | Invoice numbers created by the latest SO upload |
| `test-data/runtime/collectionRefs.json` | dA (`delivery.vehicleNo`), RFC (`upi`, `neft`), Mobile Collection (`cheque`, `upi`, `neft`) | RFC, SegV/CashV (D), CashV (bank statement insert), CBM | `{ delivery:{vehicleNo}, upi, neft, cheque }`. Each entry has `refNumber` and `amount`. UPI refs are 14 digits and cheque numbers 6 digits; keep those lengths. |
| `test-data/runtime/sunpure_so_upload.csv` | SO Upload (Sunpure) | SO Upload | Prepared upload copy |

Runtime `*.json` files are gitignored. Don't edit them by hand in the middle of a cycle.

### Config files you will edit most

| File | Key settings |
|---|---|
| `test-data/salesOrder.js` | `ACTIVE_SO_BRAND`, `uploadSource`, `invoiceCount`, `changeStoreForAll` |
| `test-data/deliveryAllocation.js` | Vehicle, driver, delivery boy |
| `test-data/rfc.js` | `deliveryStatus`, `RFC_COLLECTION` amounts |
| `test-data/seg.js` | `verificationType` (D/S), `verificationMode` (V/R) |
| `test-data/cashier.js` | `RFC_PAYMENT_MODES`, `COLLECTION_PAYMENT_MODES` |
| `test-data/collection.js` | Mobile collection amounts, banks |
| `test-data/cbm.js` | CBM cheque, people, recovery modes |
| `test-data/users.js` | Role credentials |

---

## 5. Repo Layout & Reports

```
web/
  pages/        Page objects (soUploadPage, deliveryAllocationPage, returnToFCPage,
                segVerificationPage, cashVerificationPage, segCAPage, cbm*Page …)
  tests/        Specs, one per flow (soUpload, deliveryAllocation, returnToFC, segVerification,
                cashVerification, segCA, chequeBounce, cbmSegVerification, cbmCashVerification …)
  playwright.config.js   workers 1, serial, headed, screenshots on, Chromium
mobile/         WebdriverIO + Appium (wdio.conf.js, pages/, tests/collection.e2e.js, utils/locators.js)
test-data/      Config per flow, fixtures/, runtime/ handoff files
utils/          auth.js (loginAs), dbHelper.js (SSH + MySQL), collectionReportGenerator.js, excelReader.js
test-cases/     TestCases_CollectionAuto.xlsx (npm run tc:generate / tc:update)
```

**Reports:**
- HTML: `npx playwright show-report`
- Allure: `npm run allure:report`. Both the web and mobile suites write to `allure-results/`.
- Every spec attaches a full-page screenshot after each test. Set `CAPTURE_SCREENSHOTS=N` to turn this off.

---

## 6. Handover Checklist for the Incoming QA

- [ ] You can log in to CDMS pre-prod as Admin, Seg and Cashier.
- [ ] `.env` has working DB SSH and MySQL credentials. Test by running a step that uses the DB (e.g. `cashV`).
- [ ] The Android emulator `Pixel_6` boots, `adb devices` lists it, and the DMS app logs in with the salesman credentials.
- [ ] You ran `npm install` and `npx playwright install chromium`.
- [ ] The Sunpure SO source CSV is in place (Downloads or `test-data/fixtures/`), and `ACTIVE_SO_BRAND` is set.
- [ ] You did one full cycle by hand (steps 1–9) before relying on the automation.
- [ ] You know the D → S switch in `test-data/seg.js` between the two verification passes.
- [ ] You know how to clear the *Pending Financial Adjustment* and *allocation is blocked* blockers.
