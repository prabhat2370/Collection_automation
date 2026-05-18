import XLSX from 'xlsx';
import { resolve } from 'path';
import { TC_MAPPING } from './tcMapping.js';

const headers = [
    'TESTCASE ID', 'MODULE', 'CHANGE REQUEST', 'PLATFORM',
    'TEST SCENARIO', 'TEST DATA', 'TEST STEPS', 'EXPECTED RESULTS', 'TYPE', 'SEVERITY',
    'SPEC_FILE', 'TEST_TITLE', 'STEP_NAME', 'Result', 'Screenshot'
];

// Helper to build a row — auto-fills the mapping columns from TC_MAPPING
const tc = (id, mod, cr, scenario, data, steps, expected, type, severity) => {
    const m = TC_MAPPING[id] || { specFile: '', testTitle: '', stepName: '' };
    const result = (m.specFile && m.testTitle) ? 'Not Run' : 'Manual';
    return [id, mod, cr, 'WEB', scenario, data, steps, expected, type, severity,
            m.specFile, m.testTitle, m.stepName, result, ''];
};

// Same as tc() but stamps PLATFORM = MOBILE (for Appium/WebdriverIO mobile specs)
const tcMobile = (id, mod, cr, scenario, data, steps, expected, type, severity) => {
    const m = TC_MAPPING[id] || { specFile: '', testTitle: '', stepName: '' };
    const result = (m.specFile && m.testTitle) ? 'Not Run' : 'Manual';
    return [id, mod, cr, 'MOBILE', scenario, data, steps, expected, type, severity,
            m.specFile, m.testTitle, m.stepName, result, ''];
};

const testCases = [
// ════════════════════════════════════════════════════════════════════════════
// 1. LOGIN & LOGOUT (per-interaction)
// ════════════════════════════════════════════════════════════════════════════
tc('TC_LOGIN_001', 'Login & Logout', '', 'Verify CDMS login page loads from configured URL',
    'URL: URLS.cdms (cdms-preprod.ripplr.in)',
    '1. Open browser\n2. Navigate to URLS.cdms via page.goto()',
    'Login page renders; Email, Password fields and Login button are visible',
    'Smoke', 'Critical'),

tc('TC_LOGIN_002', 'Login & Logout', '', 'Verify Email input accepts and displays admin email',
    'Email: admin@ripplr.in',
    '1. Locate input[id="email"]\n2. Fill email value: admin@ripplr.in',
    'Email field shows admin@ripplr.in',
    'Functional', 'High'),

tc('TC_LOGIN_003', 'Login & Logout', '', 'Verify Password input accepts and masks the password',
    'Password: M@ver!ck',
    '1. Locate input[id="password"]\n2. Fill password value: M@ver!ck',
    'Password is filled and masked (••••••••)',
    'Functional', 'High'),

tc('TC_LOGIN_004', 'Login & Logout', '', 'Verify Login button click submits credentials and authenticates',
    'Email + Password filled',
    '1. Locate button[id="login-btn"]\n2. Click Login',
    'User is authenticated; CDMS dashboard loads; URL navigates to home',
    'Smoke', 'Critical'),

tc('TC_LOGIN_005', 'Login & Logout', '', 'Verify network idle wait completes after login (15s timeout)',
    'Pre-condition: Login clicked',
    '1. Call page.waitForLoadState(networkidle, 15000) with .catch(()=>{})',
    'Page reaches network idle within 15s or gracefully continues on timeout',
    'Functional', 'Medium'),

tc('TC_LOGIN_006', 'Login & Logout', '', 'Verify SEG login uses seg4@ripplr.in / Ripplr@123',
    'SEG user: seg4@ripplr.in / Ripplr@123',
    '1. Navigate to CDMS\n2. Fill email: seg4@ripplr.in\n3. Fill password: Ripplr@123\n4. Click Login',
    'SEG user logs in; SEG-specific menus visible',
    'Functional', 'High'),

tc('TC_LOGIN_007', 'Login & Logout', '', 'Verify Cashier login uses cash4@ripplr.in / Ripplr@123',
    'Cash user: cash4@ripplr.in / Ripplr@123',
    '1. Navigate to CDMS\n2. Fill email: cash4@ripplr.in\n3. Fill password: Ripplr@123\n4. Click Login',
    'Cash user logs in; Collection Settlement menu visible',
    'Functional', 'High'),

tc('TC_LOGIN_008', 'Login & Logout', '', 'Verify SEG CA login uses segobc2@ripplr.in / Ripplr@123',
    'SEG CA user: segobc2@ripplr.in / Ripplr@123',
    '1. Navigate to CDMS\n2. Fill email: segobc2@ripplr.in\n3. Fill password: Ripplr@123\n4. Click Login',
    'SEG CA user logs in; Allocation menu visible',
    'Functional', 'Medium'),

tc('TC_LOGIN_009', 'Login & Logout', '', 'Verify Collection app navigation loads mobile login screen',
    'URL: URLS.collection',
    '1. Navigate to URLS.collection via page.goto()',
    'Mobile login screen renders with phone input and Submit button',
    'Smoke', 'Critical'),

tc('TC_LOGIN_010', 'Login & Logout', '', 'Verify mobile number field accepts 10-digit number',
    'Mobile: 9886996369',
    '1. Locate input[name="phone"]\n2. Fill: 9886996369',
    'Mobile field shows 9886996369',
    'Functional', 'High'),

tc('TC_LOGIN_011', 'Login & Logout', '', 'Verify Submit button after mobile entry navigates to PIN screen',
    'Mobile filled',
    '1. Locate #form-submit\n2. Click Submit',
    'PIN entry screen appears',
    'Functional', 'High'),

tc('TC_LOGIN_012', 'Login & Logout', '', 'Verify PIN input accepts 4-digit PIN',
    'PIN: 1234',
    '1. Locate input#pin\n2. Fill: 1234',
    'PIN field shows 4-digit value (masked)',
    'Functional', 'High'),

tc('TC_LOGIN_013', 'Login & Logout', '', 'Verify Submit button after PIN authenticates collection user',
    'PIN filled',
    '1. Click #form-submit',
    'User logged in; invoice list loads',
    'Smoke', 'Critical'),

tc('TC_LOGIN_014', 'Login & Logout', '', 'Verify modal-wrap is hidden before logout flow proceeds',
    'Pre-condition: any open modal must close',
    '1. Wait for .ant-modal-wrap to be hidden (10s timeout, soft fail)',
    'Modal closes or wait gracefully times out',
    'Functional', 'Medium'),

tc('TC_LOGIN_015', 'Login & Logout', '', 'Verify Profile Icon click opens user menu',
    'Selector: .sc-bczRLJ.sc-hlnMnd.ccyvke.dDbKHa',
    '1. Click profile icon\n2. Wait 1.5s',
    'Profile menu opens showing logout option',
    'Functional', 'High'),

tc('TC_LOGIN_016', 'Login & Logout', '', 'Verify Logout button click triggers confirmation',
    'Selector: #logout-btn',
    '1. Click logout button\n2. Wait 2s',
    'Logout confirmation dialog appears',
    'Functional', 'High'),

tc('TC_LOGIN_017', 'Login & Logout', '', 'Verify Yes button confirms logout (last visible Yes)',
    'Selector: :text("Yes")',
    '1. Click last Yes button (5s timeout, soft fail)',
    'User is logged out; redirected to login page',
    'Smoke', 'Critical'),

// ════════════════════════════════════════════════════════════════════════════
// 2. SO UPLOAD
// ════════════════════════════════════════════════════════════════════════════
tc('TC_SOU_001', 'SO Upload', 'FC = CMBT: Coimbatore (fc_id=16)', 'Verify Adapter Uploads link click navigates to uploads page',
    'Selector: getByRole(link, Adapter Uploads)',
    '1. Click Adapter Uploads link in sidebar',
    'Adapter Uploads page loads',
    'Smoke', 'Critical'),

tc('TC_SOU_002', 'SO Upload', '', 'Verify Upload button opens upload modal',
    'Selector: button:has-text("Upload")',
    '1. Click Upload button',
    'Upload modal opens with form fields',
    'Smoke', 'Critical'),

tc('TC_SOU_003', 'SO Upload', '', 'Verify Upload Type dropdown opens',
    'Selector: span.ant-select-selection-item',
    '1. Click upload type dropdown',
    'Dropdown options visible (Sales Order, OBC, Credit Adjustment, etc.)',
    'Functional', 'High'),

tc('TC_SOU_004', 'SO Upload', '', 'Verify Sales Order option can be selected',
    'Option: div[title="Sales Order"]',
    '1. Click Sales Order option in dropdown',
    'Sales Order is selected; SO/Invoice/SR upload fields appear',
    'Functional', 'High'),

tc('TC_SOU_005', 'SO Upload', '', 'Verify FC dropdown opens (filter Fc Type, nth 4)',
    'Selector: div.filter({hasText: /^Fc Type$/}).nth(4)',
    '1. Click FC dropdown',
    'FC dropdown opens',
    'Functional', 'High'),

tc('TC_SOU_006', 'SO Upload', 'FC change to CMBT', 'Verify typing CMBT filters FC dropdown options',
    'Search: CMBT',
    '1. Use page.keyboard.type("CMBT")',
    'FC list filtered to CMBT: Coimbatore',
    'Functional', 'High'),

tc('TC_SOU_007', 'SO Upload', '', 'Verify CMBT: Coimbatore can be selected from FC dropdown',
    'Option: text("CMBT: Coimbatore")',
    '1. Click CMBT: Coimbatore option',
    'FC = CMBT: Coimbatore is selected',
    'Smoke', 'Critical'),

tc('TC_SOU_008', 'SO Upload', '', 'Verify Brand dropdown opens via input#brand',
    'Selector: input[id="brand"]',
    '1. Click brand input',
    'Brand dropdown opens',
    'Functional', 'High'),

tc('TC_SOU_009', 'SO Upload', '', 'Verify typing BRIT filters brand dropdown',
    'Search: BRIT',
    '1. page.keyboard.type("BRIT")',
    'Brand list filtered to BRIT: Britannia',
    'Functional', 'High'),

tc('TC_SOU_010', 'SO Upload', '', 'Verify BRIT: Britannia can be selected',
    'Option: text("BRIT: Britannia")',
    '1. Click BRIT: Britannia option',
    'Brand = BRIT: Britannia is selected',
    'Smoke', 'Critical'),

tc('TC_SOU_011', 'SO Upload', '', 'Verify SO Report file upload triggers filechooser',
    'Selector: span:contains("Upload Sales Order Report (SO Report) File"), File: m1 6.csv',
    '1. Click SO Report upload\n2. Wait for filechooser event\n3. Set files via fileChooser.setFiles(filePath)\n4. Wait networkidle (30s, soft)',
    'File is attached to SO Report field',
    'Functional', 'High'),

tc('TC_SOU_012', 'SO Upload', '', 'Verify Invoice Report file upload',
    'Selector: span:contains("Upload Invoice Report File"), File: h1 6.csv',
    '1. Click Invoice Report upload\n2. Set file via filechooser',
    'File attached',
    'Functional', 'High'),

tc('TC_SOU_013', 'SO Upload', '', 'Verify Sales Register file upload',
    'Selector: span:contains("Upload Sales Register File"), File: sr 10.csv',
    '1. Click Sales Register upload\n2. Set file via filechooser',
    'File attached',
    'Functional', 'High'),

tc('TC_SOU_014', 'SO Upload', '', 'Verify Submit button triggers file processing',
    'Selector: getByRole(button, Submit)',
    '1. Click Submit',
    'Modal closes/submits; backend processing begins',
    'Smoke', 'Critical'),

tc('TC_SOU_015', 'SO Upload', '', 'Verify observeAfterSubmit captures screenshot, modal state, toasts',
    'Wait 5s, screenshot path: utils/afterSubmit.png',
    '1. Wait 5s\n2. Take fullPage screenshot\n3. Check ant-modal:visible\n4. Read toast/notification text from .ant-message-notice-content, .ant-notification-notice-message, .ant-notification-notice-description, .ant-form-item-explain-error, .ant-alert-message',
    'Screenshot saved; logs print modal visibility and any toast text',
    'Functional', 'Medium'),

tc('TC_SOU_016', 'SO Upload', '', 'Verify status page navigation reaches /adapter-uploads',
    'URL: cdms-preprod.ripplr.in/adapter-uploads, waitUntil: domcontentloaded',
    '1. page.goto(/adapter-uploads)\n2. Wait 2s\n3. waitForFunction: tbody rows > 0 (15s, soft)',
    'Status table renders with rows',
    'Functional', 'High'),

tc('TC_SOU_017', 'SO Upload', '', 'Verify Select File Type filter dropdown opens for status filter',
    'Selector: div.filter({hasText: /^Select File Type$/}).nth(1)',
    '1. Click Select File Type dropdown',
    'Filter dropdown opens',
    'Functional', 'Medium'),

tc('TC_SOU_018', 'SO Upload', '', 'Verify Sales Order filter option selectable',
    'Option: div[title="Sales Order"]',
    '1. Click Sales Order option',
    'Filter applied to Sales Order rows only',
    'Functional', 'High'),

tc('TC_SOU_019', 'SO Upload', '', 'Verify Search button refreshes status list',
    'Selector: getByRole(button, Search)',
    '1. Click Search',
    'Status table refreshes',
    'Functional', 'High'),

tc('TC_SOU_020', 'SO Upload', '', 'Verify status polling parses timestamp dd/MM/yyyy h:mm AM/PM',
    'Status cell contains date format like 09/05/2026, 12:26 PM',
    '1. Read status cell innerText\n2. Match regex: /(\\d{2})\\/(\\d{2})\\/(\\d{4}),\\s*(\\d{1,2}:\\d{2}\\s*[AP]M)/i',
    'Date parses correctly into Date object',
    'Functional', 'High'),

tc('TC_SOU_021', 'SO Upload', '', 'Verify stale entries (age >= 300s) are skipped during polling',
    'Threshold: 300s',
    '1. Compute diffSecs = (Date.now() - uploadTime) / 1000\n2. If diffSecs >= 300: log "Stale entry, retrying search..." and continue',
    'Stale rows are skipped; loop retries up to 24 times',
    'Functional', 'High'),

tc('TC_SOU_022', 'SO Upload', '', 'Verify "Validation Error" status throws and aborts',
    'Status text contains "validation error"',
    '1. If rawText.toLowerCase().includes("validation error"): throw Error',
    'Test fails fast with message: "Upload failed with Validation Error — fix the file and re-upload."',
    'Negative', 'Critical'),

tc('TC_SOU_023', 'SO Upload', '', 'Verify "Processing" status keeps polling',
    'Status: Processing... or Processing Error',
    '1. If !rawText.includes("fully processed"): wait 5s and retry',
    'Polling continues until Fully Processed or 24 retries',
    'Functional', 'High'),

tc('TC_SOU_024', 'SO Upload', '', 'Verify Fully Processed status triggers status icon click',
    'Status: Fully Processed',
    '1. statusIcon.first().dispatchEvent("click")',
    'Status detail/invoice list opens',
    'Smoke', 'Critical'),

tc('TC_SOU_025', 'SO Upload', '', 'Verify polling timeout throws after 24 attempts (2 min)',
    'maxRetries: 24, waitMs: 5000',
    '1. After 24 retries without success: throw Error',
    'Error: "Fully processed SO upload not found within 2 minutes"',
    'Negative', 'High'),

tc('TC_SOU_026', 'SO Upload', '', 'Verify captureInvoiceNumbers writes to soInvoices.json',
    'File: test-data/runtime/soInvoices.json',
    '1. Wait for ":text(\'Invoice no\')" visible\n2. Loop tbody rows\n3. Push first cell text to invoices array\n4. writeFileSync(soInvoices.json)',
    'soInvoices.json contains array of invoice numbers',
    'Functional', 'Critical'),

tc('TC_SOU_027', 'SO Upload', '', 'Verify upload with mismatched FC data results in Processing Error',
    'CSV with BTM data uploaded under CMBT FC',
    '1. Upload BTM-configured CSV under CMBT\n2. Submit\n3. Poll status',
    'Status shows Processing Error; no invoices captured',
    'Negative', 'High'),

// ════════════════════════════════════════════════════════════════════════════
// 3. DELIVERY ALLOCATION
// ════════════════════════════════════════════════════════════════════════════
tc('TC_DA_001', 'Delivery Allocation', '', 'Verify Logistics Management menu click expands sidebar',
    'Selector: span:normalize-space()="Logistics Management"',
    '1. Click Logistics Management',
    'Submenu expands showing Delivery Allocation, Return to FC',
    'Functional', 'High'),

tc('TC_DA_002', 'Delivery Allocation', '', 'Verify Delivery Allocation link navigates',
    'Selector: a:normalize-space()="Delivery Allocation"',
    '1. Click Delivery Allocation',
    'Delivery Allocation list page loads',
    'Smoke', 'Critical'),

tc('TC_DA_003', 'Delivery Allocation', '', 'Verify Create Delivery Allocation button opens form',
    'Selector: :text("Create Delivery Allocation")',
    '1. Click Create Delivery Allocation',
    'New allocation form / invoice list page loads',
    'Smoke', 'Critical'),

tc('TC_DA_004', 'Delivery Allocation', '', 'Verify table data wait detects loaded rows',
    'Selector: table tbody tr',
    '1. waitForFunction: rows > 0 with at least one non-empty td (10s)',
    'Table data loads with at least one row containing text',
    'Functional', 'High'),

tc('TC_DA_005', 'Delivery Allocation', '', 'Verify each invoice from soInvoices.json is selected via checkbox',
    'Source: test-data/runtime/soInvoices.json',
    '1. Read soInvoices.json\n2. For each invoice: locate //tr[td[contains(., invoice)]]//td[1]//input[@type="checkbox"]\n3. Click if visible; else log skipped',
    'All available invoices are checked; missing invoices are logged and skipped',
    'Functional', 'High'),

tc('TC_DA_006', 'Delivery Allocation', '', 'Verify Allocate Vehicle button click opens allocation modal',
    'Selector: :text("Allocate Vehicle")',
    '1. Click Allocate Vehicle',
    'Allocation modal opens with vehicle form',
    'Smoke', 'Critical'),

tc('TC_DA_007', 'Delivery Allocation', '', 'Verify "Skip" link is clicked when visible (defensive)',
    'Selector: :text("Skip")',
    '1. Check if Skip link visible\n2. If yes, click Skip',
    'Skip link clicked or skipped silently',
    'Functional', 'Low'),

tc('TC_DA_008', 'Delivery Allocation', '', 'Verify Pick Type dropdown opens',
    'Selector: div[name="pick_type"]//span.ant-select-selection-search',
    '1. Click Pick Type dropdown',
    'Dropdown opens with options including "Both"',
    'Functional', 'High'),

tc('TC_DA_009', 'Delivery Allocation', '', 'Verify "Both" option selectable in Pick Type',
    'Option: div(text=Both)',
    '1. Click Both',
    'Pick Type = Both',
    'Functional', 'High'),

tc('TC_DA_010', 'Delivery Allocation', '', 'Verify Vehicle Type dropdown opens',
    'Selector: div[name="vehicle_type"] span.ant-select-selection-search',
    '1. Click Vehicle Type dropdown',
    'Dropdown opens with options',
    'Functional', 'High'),

tc('TC_DA_011', 'Delivery Allocation', '', 'Verify Adhoc option selectable',
    'Option: div[title="Adhoc"]',
    '1. Click Adhoc',
    'Vehicle Type = Adhoc',
    'Functional', 'High'),

tc('TC_DA_012', 'Delivery Allocation', '', 'Verify Allocation Type dropdown opens',
    'Selector: div[name="allocation_type"] span.ant-select-selection-search',
    '1. Click Allocation Type dropdown',
    'Dropdown opens',
    'Functional', 'High'),

tc('TC_DA_013', 'Delivery Allocation', '', 'Verify Eco option selectable',
    'Option: div[title="Eco"]',
    '1. Click Eco',
    'Allocation Type = Eco',
    'Functional', 'High'),

tc('TC_DA_014', 'Delivery Allocation', '', 'Verify random vehicle number generated and persisted',
    'Format: AA##AA####, persisted to test-data/runtime/collectionRefs.json',
    '1. Generate random vehicle no\n2. persistVehicleNo(vehicleNo) writes to JSON',
    'Vehicle no generated; collectionRefs.json updated with delivery.vehicleNo',
    'Functional', 'Critical'),

tc('TC_DA_015', 'Delivery Allocation', '', 'Verify vehicle number input is filled',
    'Selector: input#vehicle_no',
    '1. Fill vehicle no',
    'Field shows generated vehicle no',
    'Functional', 'High'),

tc('TC_DA_016', 'Delivery Allocation', '', 'Verify driver name input filled',
    'Driver: Lakshman pad, Selector: input#driver_name',
    '1. Fill driver name',
    'Field shows driver name',
    'Functional', 'High'),

tc('TC_DA_017', 'Delivery Allocation', '', 'Verify vendor input filled',
    'Vendor: Lakshman pad, Selector: input#vendor',
    '1. Fill vendor',
    'Field shows vendor',
    'Functional', 'High'),

tc('TC_DA_018', 'Delivery Allocation', '', 'Verify driver mobile input filled',
    'Mobile: 8303111111, Selector: input#driver_mobile',
    '1. Fill driver mobile',
    'Field shows mobile',
    'Functional', 'High'),

tc('TC_DA_019', 'Delivery Allocation', '', 'Verify Delivery Boy dropdown opens',
    'Selector: div[name="delivery_boy"] span.ant-select-selection-search',
    '1. Click Delivery Boy dropdown',
    'Dropdown opens',
    'Functional', 'High'),

tc('TC_DA_020', 'Delivery Allocation', '', 'Verify Delivery Boy option selectable',
    'Option: div[title="Delivery Boy"]',
    '1. Click Delivery Boy option',
    'Delivery Boy assigned',
    'Functional', 'High'),

tc('TC_DA_021', 'Delivery Allocation', '', 'Verify Submit button click submits allocation',
    'Selector: button.filter({hasText: Submit}).last()',
    '1. Click last Submit button',
    'Allocation form submits',
    'Smoke', 'Critical'),

tc('TC_DA_022', 'Delivery Allocation', '', 'Verify primary button click confirms',
    'Selector: button[type="primary"]',
    '1. Click primary button',
    'Confirmation dialog progresses',
    'Functional', 'High'),

tc('TC_DA_023', 'Delivery Allocation', '', 'Verify Confirm text click finalizes allocation',
    'Selector: getByText(Confirm)',
    '1. Click Confirm',
    'Allocation finalized; vehicle visible in list',
    'Smoke', 'Critical'),

// ════════════════════════════════════════════════════════════════════════════
// 4. RETURN TO FC (RFC)
// ════════════════════════════════════════════════════════════════════════════
tc('TC_RFC_001', 'Return to FC', '', 'Verify Return to FC link navigates',
    'Selector: a:normalize-space()="Return to FC"',
    '1. Click Logistics Management\n2. Click Return to FC',
    'RFC list page loads',
    'Smoke', 'Critical'),

tc('TC_RFC_002', 'Return to FC', '', 'Verify Eye icon click opens RFC detail for vehicle',
    'Vehicle: TN09TN9090 (or saved), Selector: //tr[td[contains(., vehicleNo)]]//a[contains(@href, "return-to-fc-new")]',
    '1. Click first eye icon for vehicle',
    'RFC detail page loads',
    'Smoke', 'Critical'),

tc('TC_RFC_003', 'Return to FC', '', 'Verify scroll to bottom triggers all rows to render',
    'Action: window.scrollTo(0, document.body.scrollHeight)',
    '1. evaluate scrollTo bottom',
    'All invoice rows visible after scroll',
    'Functional', 'Medium'),

tc('TC_RFC_004', 'Return to FC', '', 'Verify rfcShowUrl is captured for re-navigation',
    'Variable: this.rfcShowUrl = page.url()',
    '1. Read page.url() and store',
    'URL stored for navigation back after each invoice',
    'Functional', 'High'),

tc('TC_RFC_005', 'Return to FC', '', 'Verify navigation back to RFC URL with waitUntil load',
    'page.goto(rfcShowUrl, {waitUntil: load})',
    '1. Navigate back\n2. Wait 2s',
    'Page loads; ready for next invoice',
    'Functional', 'High'),

tc('TC_RFC_006', 'Return to FC', 'Column index td[8] for delivery status', 'Verify delivery status dropdown is in column 8',
    'Selector: //tr[td[contains(., invoice)]]//td[8]//div[contains(@class,"ant-select-selector")]',
    '1. Locate dropdown for invoice in td[8]\n2. Wait visible (15s)',
    'Dropdown becomes visible',
    'Functional', 'Critical'),

tc('TC_RFC_007', 'Return to FC', '', 'Verify scrollIntoViewIfNeeded scrolls invoice row into view',
    'dropdown.scrollIntoViewIfNeeded()',
    '1. Scroll dropdown into view\n2. Wait 500ms',
    'Row visible in viewport',
    'Functional', 'High'),

tc('TC_RFC_008', 'Return to FC', '', 'Verify delivery status dropdown click opens options',
    'Click action',
    '1. Click dropdown\n2. Wait 500ms',
    'Status options panel opens',
    'Functional', 'High'),

tc('TC_RFC_009', 'Return to FC', '', 'Verify status option D (Delivered) selectable',
    'STATUS_MAP: D=Delivered, PD=Partial Delivered, DA=Delivery Attempted, C=Cancelled, Selector: //div[contains(@class,"ant-select-item-option") and @title=text]',
    '1. Click "Delivered" option',
    'Status set to Delivered',
    'Smoke', 'Critical'),

tc('TC_RFC_010', 'Return to FC', '', 'Verify OK button click after status change (when present)',
    'Selector: :text("OK")',
    '1. Try click OK (3s timeout, soft fail)',
    'OK clicked or skipped if not present',
    'Functional', 'Medium'),

tc('TC_RFC_011', 'Return to FC', '', 'Verify Yes button on confirmation dialog',
    'Selector: :text("Yes"), 10s timeout',
    '1. Click Yes',
    'Confirmation accepted',
    'Functional', 'High'),

tc('TC_RFC_012', 'Return to FC', '', 'Verify Update button click navigates to collection page',
    'Selector: :text("Update"), URL pattern: **/collection**',
    '1. Click Update\n2. Wait for URL collection (15s)\n3. waitForLoadState networkidle\n4. Wait 1.5s',
    'Page navigates to collection form',
    'Smoke', 'Critical'),

tc('TC_RFC_013', 'Return to FC', '', 'Verify scroll to collection form area',
    'Action: scrollTo(0, document.body.scrollHeight)',
    '1. Scroll to bottom\n2. Wait 1s',
    'Collection form visible in viewport',
    'Functional', 'Medium'),

tc('TC_RFC_014', 'Return to FC', '', 'Verify "Invoice Returned" radio is checked',
    'Selector: getByRole(radio, Invoice Returned)',
    '1. Check radio',
    'Invoice Returned radio is selected',
    'Functional', 'High'),

tc('TC_RFC_015', 'Return to FC', '', 'Verify cash amount field skipped when collection.cash is empty',
    'collection.cash: ""',
    '1. If collection.cash truthy: click + fill cash amount\n2. Else skip',
    'Cash field skipped when value empty',
    'Functional', 'High'),

tc('TC_RFC_016', 'Return to FC', '', 'Verify cash amount field click + fill when value provided',
    'Selector: getByRole(spinbutton, Amount).nth(0)',
    '1. Click cash amount\n2. Fill collection.cash\n3. Wait 500ms',
    'Cash amount filled',
    'Functional', 'High'),

tc('TC_RFC_017', 'Return to FC', '', 'Verify cheque section is filled when cheque value provided',
    'collection.cheque, generates random 6-digit cheque number',
    '1. Click cheque amount.nth(1)\n2. Fill amount\n3. Click cheque number\n4. Fill 6-digit random\n5. Click bank dropdown\n6. Click first ant-select-item-option\n7. Click due date\n8. Click .ant-picker-today-btn',
    'All cheque fields populated',
    'Functional', 'High'),

tc('TC_RFC_018', 'Return to FC', '', 'Verify UPI section filled when upi value provided',
    'collection.upi, ref = Date.now() padded to 14 chars',
    '1. Click upi amount.nth(2)\n2. Fill amount\n3. Click UPI Reference Number input\n4. Fill 14-char ref',
    'UPI fields populated',
    'Functional', 'High'),

tc('TC_RFC_019', 'Return to FC', '', 'Verify NEFT section filled when neft value provided',
    'collection.neft, ref = Date.now() padded to 12 chars',
    '1. Click neft amount.nth(3)\n2. Fill amount\n3. Click Reference Number input\n4. Fill 12-char ref',
    'NEFT fields populated',
    'Functional', 'High'),

tc('TC_RFC_020', 'Return to FC', '', 'Verify collection Update button submits collection form',
    'Selector: getByRole(button, Update)',
    '1. Click collection update\n2. Wait 5s',
    'Collection submitted; returns to RFC list',
    'Smoke', 'Critical'),

tc('TC_RFC_021', 'Return to FC', '', 'Verify verifyAllInvoices navigates back to rfcShowUrl',
    'Pre-condition: rfcShowUrl stored',
    '1. page.goto(rfcShowUrl, waitUntil: load)\n2. Wait 2s',
    'RFC show page loads ready for verification',
    'Functional', 'High'),

tc('TC_RFC_022', 'Return to FC', '', 'Verify check icon in column 10 is scrolled and clicked per invoice',
    'Selector: //tr[td[contains(., invoice)]]//td[10]//div[@cursor="pointer"][last()]',
    '1. Scroll into view\n2. Read circle fill attr\n3. If !== "#023047" click; else skip',
    'Invoice marked verified or skipped',
    'Functional', 'High'),

tc('TC_RFC_023', 'Return to FC', '', 'Verify already-verified invoices (fill=#023047) are skipped',
    'fill attribute === #023047',
    '1. Read fill\n2. Log "already verified, skipping"',
    'No duplicate verification',
    'Functional', 'Medium'),

tc('TC_RFC_024', 'Return to FC', '', 'Verify Upload Inv & Other Doc button opens upload modal',
    'Selector: button:has-text("Upload Inv & Other Doc")',
    '1. Scroll into view\n2. Click button',
    'Upload modal opens',
    'Functional', 'High'),

tc('TC_RFC_025', 'Return to FC', '', 'Verify modal scoped file input accepts files via setInputFiles',
    'Selector inside .ant-modal:visible: input[type="file"]',
    '1. Wait modal visible (10s)\n2. Wait 500ms\n3. modalFileInput.setInputFiles(absPaths)\n4. Wait 2s',
    'Files attached to modal\'s file input',
    'Functional', 'High'),

tc('TC_RFC_026', 'Return to FC', '', 'Verify Upload confirmation div clicks',
    'Selector: //div[@class="sc-bczRLJ iVToiv"][normalize-space()="Upload"]',
    '1. Click Upload\n2. waitForLoadState networkidle (8s, soft)',
    'Upload confirmed',
    'Functional', 'High'),

tc('TC_RFC_027', 'Return to FC', '', 'Verify modal is hidden after upload',
    'modal.waitFor({state: hidden}, 10s)',
    '1. Wait for hidden state (soft fail)\n2. Wait 1s',
    'Modal closes; ready for next round',
    'Functional', 'Medium'),

tc('TC_RFC_028', 'Return to FC', '', 'Verify two rounds of upload (rfc_doc1.jpg then rfc_doc2.jpg)',
    'Files: test-data/fixtures/rfc_doc1.jpg, rfc_doc2.jpg',
    '1. uploadRFCFiles([rfc_doc1.jpg])\n2. uploadRFCFiles([rfc_doc2.jpg])',
    'Both files uploaded in two rounds',
    'Functional', 'High'),

tc('TC_RFC_029', 'Return to FC', '', 'Verify Verify RFC button click triggers verification',
    'Selector: :text("Verify"), force click',
    '1. Wait 4s\n2. Scroll into view\n3. Click force\n4. Wait 3s',
    'RFC verification triggered',
    'Smoke', 'Critical'),

tc('TC_RFC_030', 'Return to FC', '', 'Verify isVerifyBtnEnabled checks disabled, aria-disabled, css',
    'Checks: btn.disabled, hasAttribute(disabled), aria-disabled=true, class disabled',
    '1. Locate verifyRFCBtn\n2. Evaluate disabled state',
    'Returns true if button enabled, false if disabled',
    'Functional', 'High'),

tc('TC_RFC_031', 'Return to FC', '', 'Verify Verify button re-clicked if still enabled after first click',
    'Logic: if stillEnabled after first click → click again',
    '1. After click + 3s wait\n2. If still enabled: click again + wait 3s',
    'Verify retry succeeds',
    'Functional', 'High'),

tc('TC_RFC_032', 'Return to FC', '', 'Verify error thrown if Verify button still enabled after retry',
    'Logic: throw Error if stillEnabled',
    '1. Final isVerifyBtnEnabled check',
    'Throws: "Verify button still enabled after click — RFC NOT completed."',
    'Negative', 'Critical'),

tc('TC_RFC_033', 'Return to FC', '', 'Verify subtractCollectionDate DB call for each invoice',
    'utils/dbHelper.js: subtractCollectionDate(invoice)',
    '1. Read soInvoices.json\n2. For each invoice: subtractCollectionDate(invoice)',
    'Collection date in DB decremented by 1 day for each invoice',
    'Functional', 'High'),

// ════════════════════════════════════════════════════════════════════════════
// 5. OBC UPLOAD
// ════════════════════════════════════════════════════════════════════════════
tc('TC_OBC_001', 'OBC Upload', 'FC = CMBT: Coimbatore', 'Verify Adapter Uploads link clickable from sidebar',
    'Selector: //span[@class="ant-menu-title-content"]//a[normalize-space()="Adapter Uploads"]',
    '1. Click Adapter Uploads',
    'Uploads page loads',
    'Smoke', 'Critical'),

tc('TC_OBC_002', 'OBC Upload', '', 'Verify Upload button opens upload modal',
    'Selector: button:has-text("Upload")',
    '1. Click Upload',
    'Modal opens',
    'Smoke', 'Critical'),

tc('TC_OBC_003', 'OBC Upload', '', 'Verify Upload Type dropdown opens',
    'Selector: span.ant-select-selection-item',
    '1. Click upload type dropdown',
    'Options visible',
    'Functional', 'High'),

tc('TC_OBC_004', 'OBC Upload', '', 'Verify OBC option selectable',
    'Option: div[title="OBC"]',
    '1. Click OBC option',
    'OBC type selected',
    'Smoke', 'Critical'),

tc('TC_OBC_005', 'OBC Upload', '', 'Verify FC dropdown opens',
    'Selector: div.filter(/^Fc Type$/).nth(4)',
    '1. Click FC dropdown',
    'FC dropdown opens',
    'Functional', 'High'),

tc('TC_OBC_006', 'OBC Upload', 'CMBT change', 'Verify CMBT typed and CMBT: Coimbatore selectable',
    'Type: CMBT, Option: CMBT: Coimbatore',
    '1. page.keyboard.type(CMBT)\n2. Click selectedFC',
    'FC = CMBT: Coimbatore',
    'Smoke', 'Critical'),

tc('TC_OBC_007', 'OBC Upload', '', 'Verify Brand dropdown opens',
    'Selector: input[id="brand"]',
    '1. Click brand input',
    'Brand dropdown opens',
    'Functional', 'High'),

tc('TC_OBC_008', 'OBC Upload', '', 'Verify BRIT typed and Britannia selectable',
    'Type: BRIT, Option: BRIT: Britannia',
    '1. page.keyboard.type(BRIT)\n2. Click selectedBrand',
    'Brand = BRIT: Britannia',
    'Smoke', 'Critical'),

tc('TC_OBC_009', 'OBC Upload', '', 'Verify "Upload a File" link triggers filechooser',
    'File: C:\\Users\\User\\Downloads\\preprodobc 2.xlsx',
    '1. Click Upload a File\n2. fileChooser.setFiles(filePath)',
    'File attached',
    'Smoke', 'Critical'),

tc('TC_OBC_010', 'OBC Upload', '', 'Verify Submit button clicks',
    'Selector: getByRole(button, Submit)',
    '1. Click Submit',
    'Upload submitted',
    'Smoke', 'Critical'),

tc('TC_OBC_011', 'OBC Upload', '', 'Verify Select File Type filter opens',
    'Selector: div.filter(/^Select File Type$/).nth(1)',
    '1. Click filter dropdown',
    'Filter dropdown opens',
    'Functional', 'High'),

tc('TC_OBC_012', 'OBC Upload', '', 'Verify OBC filter option selected',
    'Option: div[title="OBC"]',
    '1. Click OBC',
    'Filter applied',
    'Functional', 'High'),

tc('TC_OBC_013', 'OBC Upload', '', 'Verify Search button clicked twice (refresh)',
    'Selector: getByRole(button, Search)',
    '1. Click Search\n2. Wait 6s\n3. Click Search again\n4. Wait 3s',
    'Status table refreshed',
    'Functional', 'High'),

tc('TC_OBC_014', 'OBC Upload', '', 'Verify status icon (col 7, div 4) is dispatched click event',
    'Selector: //tbody/tr[1]/td[7]/div[1]/div[4]//span[@role="img"]',
    '1. dispatchEvent("click")',
    'Status detail modal opens',
    'Functional', 'High'),

tc('TC_OBC_015', 'OBC Upload', '', 'Verify Close button closes status detail modal',
    'Selector: getByRole(button, Close)',
    '1. Click Close',
    'Modal closes',
    'Functional', 'Medium'),

// ════════════════════════════════════════════════════════════════════════════
// 6. SEG ALLOCATION
// ════════════════════════════════════════════════════════════════════════════
tc('TC_SEG_001', 'SEG Allocation', '', 'Verify Allocation link in sidebar opens allocation page',
    'Selector: getByRole(link, Allocation)',
    '1. Click Allocation',
    'Allocation page loads',
    'Smoke', 'Critical'),

tc('TC_SEG_002', 'SEG Allocation', '', 'Verify FC dropdown #rc_select_0 opens',
    'Selector: #rc_select_0',
    '1. Click FC dropdown',
    'FC dropdown opens',
    'Functional', 'High'),

tc('TC_SEG_003', 'SEG Allocation', 'FC = CMBT', 'Verify CMBT: Coimbatore selectable',
    'Option: text(CMBT: Coimbatore)',
    '1. Click CMBT: Coimbatore',
    'FC selected',
    'Smoke', 'Critical'),

tc('TC_SEG_004', 'SEG Allocation', '', 'Verify Brand dropdown #rc_select_1 opens',
    'Selector: #rc_select_1',
    '1. Click brand dropdown',
    'Dropdown opens',
    'Functional', 'High'),

tc('TC_SEG_005', 'SEG Allocation', '', 'Verify BRIT: Britannia selectable',
    'Option: text(BRIT: Britannia)',
    '1. Click Britannia',
    'Brand selected',
    'Smoke', 'Critical'),

tc('TC_SEG_006', 'SEG Allocation', '', 'Verify Continue button proceeds to salesman selection',
    'Selector: getByRole(button, Continue)',
    '1. Click Continue',
    'Salesman search section visible',
    'Smoke', 'Critical'),

tc('TC_SEG_007', 'SEG Allocation', '', 'Verify Salesman dropdown #rc_select_3 opens',
    'Selector: #rc_select_3',
    '1. Click Salesman dropdown',
    'Dropdown opens with salesmen',
    'Functional', 'High'),

tc('TC_SEG_008', 'SEG Allocation', '', 'Verify Abdul (firstOBCData.salesman) selectable',
    'Source: utils/excelReader.js firstOBCData.salesman',
    '1. Click salesman name from Excel data',
    'Salesman selected',
    'Functional', 'High'),

tc('TC_SEG_009', 'SEG Allocation', '', 'Verify "Click here to Search" button triggers search',
    'Selector: getByRole(button, Click here to Search)',
    '1. Click Search\n2. Wait 5s',
    'Invoice list loads for salesman',
    'Functional', 'High'),

tc('TC_SEG_010', 'SEG Allocation', '', 'Verify scrollIntoViewIfNeeded scrolls invoice row',
    'Selector: invoice checkbox row',
    '1. scrollIntoViewIfNeeded()',
    'Invoice row visible',
    'Functional', 'Medium'),

tc('TC_SEG_011', 'SEG Allocation', '', 'Verify invoice checkbox (firstOBCData.invoiceNo) clickable',
    'Selector: //tr[td[6][contains(., invoiceNo)]]//td[1]//input[@type="checkbox"]',
    '1. Click checkbox',
    'Invoice selected',
    'Smoke', 'Critical'),

tc('TC_SEG_012', 'SEG Allocation', '', 'Verify Assign button activates with selection',
    'Selector: getByText(Assign, exact)',
    '1. Click Assign',
    'Assignment dialog opens',
    'Functional', 'High'),

tc('TC_SEG_013', 'SEG Allocation', '', 'Verify Submit button finalizes assignment',
    'Selector: getByRole(button, Submit)',
    '1. Click Submit\n2. Wait 5s',
    'Invoice assigned to salesman',
    'Smoke', 'Critical'),

// ════════════════════════════════════════════════════════════════════════════
// 7. COLLECTION (Salesman)
// ════════════════════════════════════════════════════════════════════════════
tc('TC_COL_001', 'Collection', '', 'Verify down arrow click expands invoice details',
    'Selector: img[alt="downArrow"]',
    '1. Click downArrow',
    'Invoice payment fields expand',
    'Smoke', 'Critical'),

tc('TC_COL_002', 'Collection', '', 'Verify cash field is filled when AMOUNTS.cash provided',
    'AMOUNTS.cash: 18, Selector: #cash',
    '1. If AMOUNTS.cash: fill 18',
    'Cash field shows 18',
    'Functional', 'High'),

tc('TC_COL_003', 'Collection', '', 'Verify cash field skipped when AMOUNTS.cash empty',
    'AMOUNTS.cash: ""',
    '1. If !AMOUNTS.cash: skip',
    'Cash section not interacted',
    'Functional', 'Medium'),

tc('TC_COL_004', 'Collection', '', 'Verify cheque amount filled when AMOUNTS.cheque provided',
    'AMOUNTS.cheque: 42, Selector: #chequeData[0].amount',
    '1. If AMOUNTS.cheque: fill 42',
    'Cheque amount = 42',
    'Functional', 'High'),

tc('TC_COL_005', 'Collection', '', 'Verify cheque ref number = random 6-digit, persisted',
    'random 6-digit, save to collectionRefs.json key=cheque',
    '1. Generate random refNumber\n2. Fill #chequeData[0].reference_number\n3. saveRef("cheque", {refNumber, amount})',
    'Cheque ref filled and persisted',
    'Functional', 'Critical'),

tc('TC_COL_006', 'Collection', '', 'Verify chequeBankId interactable check before click',
    'Logic: elementFromPoint check',
    '1. Evaluate if topElement matches\n2. Click chequeBankId or chequeBankFallback',
    'Bank dropdown opens via correct selector',
    'Functional', 'High'),

tc('TC_COL_007', 'Collection', '', 'Verify random bank selected from BANKS list',
    'BANKS: 8 bank names (Bank of Baroda, Bank of India, Bank of Maharashtra, Canara Bank, Central Bank of India, Indian Bank, Indian Overseas Bank, Punjab and Sind Bank)',
    '1. Random index\n2. Click //div[@title=bankName]',
    'A bank is selected',
    'Functional', 'High'),

tc('TC_COL_008', 'Collection', '', 'Verify cheque due date opens picker',
    'Selector: #chequeData[0].due_date',
    '1. Click due date',
    'Date picker opens',
    'Functional', 'High'),

tc('TC_COL_009', 'Collection', '', 'Verify Today link selects current date',
    'Selector: //a[normalize-space()="Today"]',
    '1. Click Today',
    'Due date set to today',
    'Functional', 'High'),

tc('TC_COL_010', 'Collection', '', 'Verify UPI flow detects existing entry via ManualMode icon count',
    'Selector: img[alt="ManualMode"]',
    '1. Count icons\n2. upiAlreadyAdded = count > 0',
    'Branch decision made: edit vs add new',
    'Functional', 'High'),

tc('TC_COL_011', 'Collection', '', 'Verify UPI edit branch (already added): clicks ManualMode, clears, fills',
    'AMOUNTS.qr: 12, Selector: ManualMode icon, amountInput, updateRefInput',
    '1. Click ManualMode.first()\n2. Clear amount input\n3. Fill 12\n4. Generate 14-digit ref\n5. Clear updateRefInput\n6. Fill ref\n7. saveRef("upi")\n8. Click Update',
    'UPI entry updated',
    'Functional', 'High'),

tc('TC_COL_012', 'Collection', '', 'Verify UPI new branch: Scan QR → Add Manually here → ref → Add manually → Submit',
    'AMOUNTS.qr: 12',
    '1. Click Scan QR\n2. Fill amount input\n3. Click Add Manually here\n4. Generate 14-digit ref\n5. Fill ref input\n6. saveRef("upi")\n7. Click Add manually\n8. Click Submit div',
    'New UPI entry added',
    'Functional', 'High'),

tc('TC_COL_013', 'Collection', '', 'Verify UPI ref number is 14-digit and persisted',
    'Range: 10000000000000-99999999999999, file: collectionRefs.json key=upi',
    '1. Math.floor(10^13 + Math.random()*9*10^13)\n2. saveRef("upi", {refNumber, amount})',
    'UPI ref persisted',
    'Functional', 'Critical'),

tc('TC_COL_014', 'Collection', '', 'Verify NEFT amount filled when AMOUNTS.neft provided',
    'AMOUNTS.neft: 19, Selector: input[name="neftData[0].amount"]',
    '1. Fill 19',
    'NEFT amount = 19',
    'Functional', 'High'),

tc('TC_COL_015', 'Collection', '', 'Verify NEFT ref number = random 12-digit, persisted',
    'Range: 100000000000-999999999999, file: collectionRefs.json key=neft',
    '1. Generate 12-digit ref\n2. Fill\n3. saveRef("neft", {refNumber, amount})',
    'NEFT ref persisted',
    'Functional', 'Critical'),

tc('TC_COL_016', 'Collection', '', 'Verify Auto button click triggers split view',
    'Selector: //div[contains(text(),"Auto")]',
    '1. Click Auto',
    'Auto split applied',
    'Functional', 'High'),

tc('TC_COL_017', 'Collection', '', 'Verify Split Reason dropdown opens',
    'Selector: #splitInvoices[0].reason',
    '1. Click split reason',
    'Reason dropdown opens',
    'Functional', 'High'),

tc('TC_COL_018', 'Collection', '', 'Verify Shop Permanently Closed selectable',
    'Selector: //div[contains(text(),"Shop Permanently Closed")]',
    '1. Click Shop Closed',
    'Reason set',
    'Functional', 'High'),

tc('TC_COL_019', 'Collection', '', 'Verify Final Submit triggers form submission',
    'Selector: button[type="submit"]',
    '1. Click final submit',
    'Form submits',
    'Smoke', 'Critical'),

tc('TC_COL_020', 'Collection', '', 'Verify Submit Collection text click',
    'Selector: :text("Submit Collection")',
    '1. Click Submit Collection',
    'Confirmation dialog appears',
    'Functional', 'High'),

tc('TC_COL_021', 'Collection', '', 'Verify Confirmation Yes button',
    'CONFIRMATION.submitCollection: Yes, Selector: getByRole(button, Yes, exact)',
    '1. Click Yes',
    'Collection submitted',
    'Smoke', 'Critical'),

// ── Mobile (Android) — pre-login landing screen (module picker) ───────────
tcMobile('TC_COL_022', 'Collection', '', 'Verify Collection module card is visible on the pre-login landing screen (Android)',
    'Page: LandingAppPage, Locator: LOCATORS.landing.collectionModule',
    '1. Launch app (lands on module picker)\n2. Call landingPage.isCollectionVisible()',
    'Collection module card is displayed on the landing screen before any login',
    'Smoke', 'Critical'),

tcMobile('TC_COL_023', 'Collection', '', 'Verify tapping Collection module navigates away from landing screen to login (Android)',
    'Page: LandingAppPage, Locator: LOCATORS.landing.collectionModule',
    '1. Tap Collection card via landingPage.tapCollection()\n2. Wait 3000ms\n3. Re-check landingPage.isCollectionVisible()',
    'Collection card is no longer visible — app has navigated to the salesman login screen',
    'Smoke', 'Critical'),

// ════════════════════════════════════════════════════════════════════════════
// 8. SEG VERIFICATION
// ════════════════════════════════════════════════════════════════════════════
tc('TC_SEGV_001', 'SEG Verification', '', 'Verify Verification link opens verification list',
    'Selector: //a[normalize-space()="Verification"]',
    '1. Click Verification',
    'Verification list page loads',
    'Smoke', 'Critical'),

tc('TC_SEGV_002', 'SEG Verification', '', 'Verify Deliverer tab clickable when verificationType=D',
    'Condition: SEG.verificationType === D, Selector: :text("Deliverer")',
    '1. Wait 3s\n2. Click Deliverer',
    'Deliverer tab active',
    'Functional', 'High'),

tc('TC_SEGV_003', 'SEG Verification', '', 'Verify Delivery Row clickable (col 17 cursor:pointer)',
    'Selector: //tr[td[contains(., DELIVERY.vehicleNo)]]//td[17]//div[@cursor="pointer"]',
    '1. Click delivery row',
    'Verification details page opens',
    'Functional', 'High'),

tc('TC_SEGV_004', 'SEG Verification', '', 'Verify Salesman row clickable (col 15) when verificationType=S',
    'Selector: //tr[td[2][contains(., salesman)]]//td[15]//div[@cursor="pointer"]',
    '1. Click salesman row',
    'Verification details opens',
    'Smoke', 'Critical'),

tc('TC_SEGV_005', 'SEG Verification', '', 'Verify Start Verification button clickable',
    'Selector: :text-is("Start Verification")',
    '1. Click Start Verification',
    'Verification mode activated',
    'Smoke', 'Critical'),

tc('TC_SEGV_006', 'SEG Verification', '', 'Verify Run Flow with V mode waits for green tick visible',
    'Selector: img[alt="greenTick"], 15s',
    '1. waitFor visible',
    'Green tick visible',
    'Functional', 'High'),

tc('TC_SEGV_007', 'SEG Verification', '', 'Verify already-verified ticks (src includes "fill") are skipped',
    'Logic: getAttribute(src).includes("fill")',
    '1. Read src\n2. If includes fill: log + skip',
    'Already verified items skipped',
    'Functional', 'Medium'),

tc('TC_SEGV_008', 'SEG Verification', '', 'Verify each green tick clicked with 500ms delay',
    'Loop count = greenTick.count()',
    '1. For each tick: click + wait 500ms',
    'All ticks clicked',
    'Smoke', 'Critical'),

tc('TC_SEGV_009', 'SEG Verification', '', 'Verify Save button clicked after all verifications',
    'Selector: :text("Save")',
    '1. Click Save',
    'Verifications saved',
    'Smoke', 'Critical'),

tc('TC_SEGV_010', 'SEG Verification', '', 'Verify rejection flow waits for red close visible',
    'Selector: img[alt="redClose"], 15s, verificationMode=R',
    '1. waitFor visible',
    'Red close visible',
    'Functional', 'High'),

tc('TC_SEGV_011', 'SEG Verification', '', 'Verify each red close clicked with Add Reason flow',
    'Loop: click red close → Add Reason → Data Correction → Add',
    '1. Click red close\n2. Wait 500ms\n3. Click Add Reason\n4. Click "Data Correction"\n5. Click Add (exact)',
    'Rejection reason recorded per invoice',
    'Functional', 'High'),

tc('TC_SEGV_012', 'SEG Verification', '', 'Verify Save called after all rejections',
    'Selector: :text("Save")',
    '1. Click Save',
    'Rejections saved',
    'Functional', 'High'),

// ════════════════════════════════════════════════════════════════════════════
// 9. CASH VERIFICATION (Cashier)
// ════════════════════════════════════════════════════════════════════════════
tc('TC_CASHV_001', 'Cash Verification', '', 'Verify Collection Settlement link clickable',
    'Selector: //a[normalize-space()="Collection Settlement"]',
    '1. Click Collection Settlement',
    'Settlement page loads',
    'Smoke', 'Critical'),

tc('TC_CASHV_002', 'Cash Verification', '', 'Verify Deliverer tab when verificationType=D',
    'Condition: SEG.verificationType === D',
    '1. Wait 3s\n2. Click Deliverer',
    'Deliverer tab active',
    'Functional', 'High'),

tc('TC_CASHV_003', 'Cash Verification', '', 'Verify Delivery Row click (col 12) for D mode',
    'Selector: //tr[td[contains(., DELIVERY.vehicleNo)]]//td[12]//div[@cursor="pointer"]',
    '1. Click delivery row',
    'Settlement details open',
    'Functional', 'High'),

tc('TC_CASHV_004', 'Cash Verification', '', 'Verify Salesman Settle row click (col 10) for S mode',
    'Selector: //tr[td[1][contains(., salesman)]]//td[10]//div[@cursor="pointer"]',
    '1. Click salesman settle row',
    'Settlement details open',
    'Smoke', 'Critical'),

tc('TC_CASHV_005', 'Cash Verification', '', 'Verify Start Verification clickable',
    'Selector: :text-is("Start Verification")',
    '1. Click Start Verification',
    'Verification mode opens',
    'Smoke', 'Critical'),

tc('TC_CASHV_006', 'Cash Verification', '', 'Verify waitForLoader handles networkidle + #loader.show',
    'Logic: waitForLoadState networkidle (15s) + #loader.show wait hidden',
    '1. Call waitForLoader',
    'Loader state cleared before next interaction',
    'Functional', 'High'),

tc('TC_CASHV_007', 'Cash Verification', '', 'Verify cash V mode: click green tick + Save',
    'PAYMENT_MODES.cash = V',
    '1. waitForLoader\n2. cashGreenTick.click({force: true})\n3. saveBtn.click',
    'Cash verified',
    'Smoke', 'Critical'),

tc('TC_CASHV_008', 'Cash Verification', '', 'Verify cash R mode: click red close + Add Reason + comment + Add + Save',
    'PAYMENT_MODES.cash = R',
    '1. cashRedClose.click(force)\n2. addReasonBtn.click\n3. fill comment "REJECT"\n4. addBtn.click\n5. saveBtn.click',
    'Cash rejection saved',
    'Functional', 'High'),

tc('TC_CASHV_009', 'Cash Verification', '', 'Verify cash NA mode: skip flow',
    'PAYMENT_MODES.cash = NA',
    '1. Mode check; skip',
    'No interaction',
    'Functional', 'Medium'),

tc('TC_CASHV_010', 'Cash Verification', '', 'Verify cheque V mode mirrors cash V flow',
    'PAYMENT_MODES.cheque = V',
    '1. waitForLoader\n2. greenTick.click(force)\n3. saveBtn.click',
    'Cheque verified',
    'Functional', 'High'),

tc('TC_CASHV_011', 'Cash Verification', '', 'Verify cheque R mode: redClose + Both + Submit + Save',
    'PAYMENT_MODES.cheque = R',
    '1. redClose.click\n2. bothBtn.click\n3. submitBtn.click\n4. saveBtn.click',
    'Cheque rejected',
    'Functional', 'High'),

tc('TC_CASHV_012', 'Cash Verification', '', 'Verify UPI Insert reads collectionRefs.json and inserts bank statement',
    'utils/dbHelper.js: insertBankStatement(UPI, refNumber, amount)',
    '1. getCollectionRefs() reads JSON\n2. insertBankStatement("UPI", upi.refNumber, upi.amount)',
    'UPI bank statement row inserted in DB',
    'Functional', 'Critical'),

tc('TC_CASHV_013', 'Cash Verification', '', 'Verify UPI flow V mode',
    'PAYMENT_MODES.upi = V',
    '1. waitForLoader\n2. greenTick.click(force)\n3. saveBtn.click',
    'UPI verified',
    'Functional', 'High'),

tc('TC_CASHV_014', 'Cash Verification', '', 'Verify UPI R mode: redClose + Both + Submit + Save',
    'PAYMENT_MODES.upi = R',
    '1. redClose.click\n2. bothBtn.click\n3. submitBtn.click\n4. saveBtn.click',
    'UPI rejected',
    'Functional', 'High'),

tc('TC_CASHV_015', 'Cash Verification', '', 'Verify NEFT Insert similar to UPI Insert',
    'insertBankStatement(NEFT, neft.refNumber, neft.amount)',
    '1. Read JSON\n2. Insert',
    'NEFT bank statement inserted',
    'Functional', 'Critical'),

tc('TC_CASHV_016', 'Cash Verification', '', 'Verify NEFT flow V/R mirrors others',
    'PAYMENT_MODES.neft',
    '1. Same V/R/NA branches',
    'NEFT verified or rejected',
    'Functional', 'High'),

tc('TC_CASHV_017', 'Cash Verification', '', 'Verify "verificationType D→S" switch updates seg.js file',
    'Regex: /verificationType:\\s*\'D\'/ → "verificationType: \'S\'"',
    '1. Read test-data/seg.js\n2. Replace D with S\n3. writeFileSync',
    'seg.js persisted with S; in-memory SEG.verificationType also updated',
    'Functional', 'Critical'),

// ════════════════════════════════════════════════════════════════════════════
// 10. CHEQUE BOUNCE (Admin / Cashier / SEG)
// ════════════════════════════════════════════════════════════════════════════
tc('TC_CBM_001', 'Cheque Bounce', '', 'Verify Cheque Bounce sidebar menu expands',
    'Selector: //span[@class="ant-menu-title-content" and normalize-space()="Cheque Bounce"]',
    '1. Click menu',
    'Submenu expands (Cheque Bounce List, Mark Bounce, Verification, etc.)',
    'Smoke', 'High'),

tc('TC_CBM_002', 'Cheque Bounce', '', 'Verify Cheque Bounce List link opens list',
    'Selector: a[normalize-space()="Cheque Bounce List"]',
    '1. Click Cheque Bounce List',
    'List page loads',
    'Functional', 'High'),

tc('TC_CBM_003', 'Cheque Bounce', '', 'Verify Add Cheque Bounce button opens form',
    'Selector: a[href="/cheque-bounce/add-cheque-bounce"]',
    '1. waitForLoader\n2. Click Add',
    'Form opens',
    'Smoke', 'Critical'),

tc('TC_CBM_004', 'Cheque Bounce', '', 'Verify Cheque Number field accepts cheque number',
    'CHEQUE_BOUNCE.chequeBounceNo: 962282 (or saved), Selector: [name="cheque_number"]',
    '1. Fill cheque number',
    'Field shows cheque number',
    'Functional', 'High'),

tc('TC_CBM_005', 'Cheque Bounce', '', 'Verify Invoice Mapping button opens mapping panel',
    'Selector: :text("Invoice Mapping")',
    '1. Click Invoice Mapping',
    'Mapping table visible',
    'Functional', 'High'),

tc('TC_CBM_006', 'Cheque Bounce', '', 'Verify FC checkbox row clickable',
    'CHEQUE_BOUNCE.fcText: BTM, Selector: //tr[td[2][contains(., BTM)]]//td[1]//input[@type="checkbox"]',
    '1. waitForLoader\n2. Click checkbox',
    'FC row checked',
    'Functional', 'High'),

tc('TC_CBM_007', 'Cheque Bounce', '', 'Verify Submit and Close button',
    'Selector: :text("Submit and Close")',
    '1. Click Submit and Close',
    'Bounce record created',
    'Smoke', 'Critical'),

tc('TC_CBM_008', 'Cheque Bounce', '', 'Verify Yes confirmation finalizes bounce',
    'Selector: :text-is("Yes")',
    '1. Click Yes',
    'Bounce confirmed',
    'Smoke', 'Critical'),

tc('TC_CBM_009', 'Cheque Bounce', '', 'Verify Mark Bounce navigates via origin/cheque-bounce/cheque-bounce-form',
    'URL: /cheque-bounce/cheque-bounce-form',
    '1. page.goto(`${origin}/cheque-bounce/cheque-bounce-form`)\n2. waitForLoader',
    'Mark Bounce page loads',
    'Functional', 'High'),

tc('TC_CBM_010', 'Cheque Bounce', '', 'Verify Cheque row image clickable',
    'Selector: //tr[td[normalize-space()="cheque"]]//img',
    '1. waitForLoader\n2. Click row image',
    'Mark bounce form opens',
    'Functional', 'High'),

tc('TC_CBM_011', 'Cheque Bounce', '', 'Verify CBM Reason "Signature Difference" selectable',
    'Selector: :text("Signature Difference")',
    '1. Click Signature Difference',
    'Reason selected',
    'Functional', 'High'),

tc('TC_CBM_012', 'Cheque Bounce', '', 'Verify uploadDocuments via setInputFiles',
    'Files: rfc_doc1.jpg, rfc_doc2.jpg, Selector: input[type="file"]',
    '1. setInputFiles(files)',
    'Files attached',
    'Functional', 'High'),

tc('TC_CBM_013', 'Cheque Bounce', '', 'Verify Submit button click on bounce form',
    'Selector: :text("Submit")',
    '1. Click Submit\n2. Wait 5s',
    'Bounce marked',
    'Smoke', 'Critical'),

tc('TC_CBM_014', 'Cheque Bounce', '', 'Verify Handover tab selectable via getByRole(tab)',
    'Selector: getByRole(tab, /Handover Bounce/)',
    '1. Click Handover tab\n2. Wait panel visible',
    'Handover panel visible',
    'Functional', 'High'),

tc('TC_CBM_015', 'Cheque Bounce', '', 'Verify Handover row hover and Action img click in td[8]',
    'Action: hover row + click td[8] [style*="cursor: pointer"]',
    '1. Wait panel visible (10s)\n2. Filter row by chequeBounceNo\n3. Hover row\n4. Click td[8] cursor pointer',
    'Action triggered',
    'Functional', 'High'),

tc('TC_CBM_016', 'Cheque Bounce', '', 'Verify Choose Segregator dropdown opens',
    'Selector: .ant-select-selector.filter({has: :text("Choose Segregator")})',
    '1. Click dropdown',
    'Segregator dropdown opens',
    'Functional', 'High'),

tc('TC_CBM_017', 'Cheque Bounce', '', 'Verify Segregator BTML option selectable',
    'Selector: :text("Segregator BTML (8888888884)")',
    '1. Click option',
    'Segregator chosen',
    'Functional', 'High'),

tc('TC_CBM_018', 'Cheque Bounce', '', 'Verify Assign Cheque button clicked',
    'Selector: :text("Assign Cheque")',
    '1. Click Assign Cheque',
    'Cheque handed over',
    'Smoke', 'Critical'),

tc('TC_CBM_019', 'Cheque Bounce', '', 'Verify Modal Close button clicks (with 10s soft fail)',
    'Selector: :text("Close")',
    '1. waitForLoader\n2. Click Close (timeout: 10000)',
    'Modal closes or skipped',
    'Functional', 'Medium'),

tc('TC_CBM_020', 'Cheque Bounce', '', 'Verify Acknowledge Now button clickable (SEG)',
    'Selector: :text("Acknowledge Now")',
    '1. Click Acknowledge Now',
    'Acknowledgement dialog opens',
    'Functional', 'High'),

tc('TC_CBM_021', 'Cheque Bounce', '', 'Verify first Yes button confirms acknowledgement',
    'Selector: :text("Yes").first()',
    '1. Click first Yes',
    'Acknowledged',
    'Functional', 'High'),

tc('TC_CBM_022', 'Cheque Bounce', '', 'Verify Submit2 button after acknowledgement',
    'Selector: :text("Submit")',
    '1. Click Submit',
    'Submitted',
    'Functional', 'High'),

tc('TC_CBM_023', 'Cheque Bounce', '', 'Verify Summary Action SVG clickable in col 12',
    'Selector: //tbody/tr[td[2][contains(., chequeBounceNo)]]/td[12]/div[1]//*[name()="svg"][1]',
    '1. Click SVG',
    'Summary action opens',
    'Functional', 'High'),

tc('TC_CBM_024', 'Cheque Bounce', '', 'Verify Choose Officer dropdown opens',
    'Selector: .ant-select-selector with :text("Choose Officer")',
    '1. Click dropdown',
    'Officer dropdown opens',
    'Functional', 'High'),

tc('TC_CBM_025', 'Cheque Bounce', '', 'Verify Officer option (Prajwal Kedlaya 9902646664) selectable',
    'CHEQUE_BOUNCE.salesOfficerName + mobile',
    '1. Click `:text(\'${salesOfficerName} (${salesOfficerMobile})\')`',
    'Officer assigned',
    'Functional', 'High'),

tc('TC_CBM_026', 'Cheque Bounce', '', 'Verify Assign Cheque 2 button finalizes officer assignment',
    'Selector: //button[normalize-space()="Assign Cheque"]',
    '1. Click Assign Cheque',
    'Officer assigned',
    'Smoke', 'Critical'),

// ════════════════════════════════════════════════════════════════════════════
// 11. CBM SEG VERIFICATION
// ════════════════════════════════════════════════════════════════════════════
tc('TC_CBMSV_001', 'CBM SEG Verification', '', 'Verify Cheque Bounce menu click expands sidebar',
    'Selector: ant-menu-title-content "Cheque Bounce"',
    '1. waitForLoader\n2. Click menu',
    'Submenu visible',
    'Smoke', 'High'),

tc('TC_CBMSV_002', 'CBM SEG Verification', '', 'Verify Verification navigation via /cheque-bounce/verification-list',
    'URL: ${origin}/cheque-bounce/verification-list',
    '1. page.goto(verification-list)\n2. waitForLoader',
    'Verification list opens',
    'Functional', 'High'),

tc('TC_CBMSV_003', 'CBM SEG Verification', '', 'Verify Ready for Verification row click',
    'Selector: //tr[td[2][contains(., salesOfficerMobile)]]//td[6]//div',
    '1. waitForLoader\n2. Click row',
    'Verification details open',
    'Functional', 'High'),

tc('TC_CBMSV_004', 'CBM SEG Verification', '', 'Verify Verify mode (V): click verify button + Save',
    'CBM_SEG.verificationMode = V, Selector: getByRole(button, check).first()',
    '1. waitForLoader\n2. Click verify\n3. waitForLoader\n4. Click Save',
    'CBM verified',
    'Smoke', 'Critical'),

tc('TC_CBMSV_005', 'CBM SEG Verification', '', 'Verify Reject mode (R): click reject button + Save',
    'CBM_SEG.verificationMode = R, Selector: getByRole(button, close).first()',
    '1. waitForLoader\n2. Click reject\n3. waitForLoader\n4. Click Save',
    'CBM rejected',
    'Functional', 'High'),

// ════════════════════════════════════════════════════════════════════════════
// 12. CBM CASH VERIFICATION
// ════════════════════════════════════════════════════════════════════════════
tc('TC_CBMCV_001', 'CBM Cash Verification', '', 'Verify Cheque Bounce menu click',
    'Selector: ant-menu-title-content "Cheque Bounce"',
    '1. waitForLoader\n2. Click menu',
    'Submenu expanded',
    'Smoke', 'High'),

tc('TC_CBMCV_002', 'CBM Cash Verification', '', 'Verify Cheque Bounce Recovery link',
    'Selector: div.filter({hasText: "Bounce Recovery Verification"}).last()',
    '1. Click Recovery link',
    'Recovery page opens',
    'Functional', 'High'),

tc('TC_CBMCV_003', 'CBM Cash Verification', '', 'Verify Ready for Verification row clicked by mobile match',
    'Selector: //tr[td[2][contains(., salesOfficerMobile)]]//td[6]//div',
    '1. waitForLoader\n2. Click row',
    'Verification details open',
    'Functional', 'High'),

tc('TC_CBMCV_004', 'CBM Cash Verification', '', 'Verify Start Verification button clicked',
    'Selector: :text("Start Verification")',
    '1. Click Start Verification',
    'Mode active',
    'Smoke', 'Critical'),

tc('TC_CBMCV_005', 'CBM Cash Verification', '', 'Verify cash V mode: click green tick + Save',
    'CBM_COLLECTION.cash.mode = V',
    '1. cashGreenTick.click\n2. saveBtn.click',
    'Cash verified',
    'Functional', 'High'),

tc('TC_CBMCV_006', 'CBM Cash Verification', '', 'Verify cash R mode: redClose + Add Reason + comment + Add + Save',
    'CBM_COLLECTION.cash.mode = R',
    '1. cashRedClose.click\n2. addReasonBtn.click\n3. Fill "REJECT"\n4. addBtn.click\n5. saveBtn.click',
    'Cash rejected',
    'Functional', 'High'),

tc('TC_CBMCV_007', 'CBM Cash Verification', '', 'Verify cash NA: skip',
    'CBM_COLLECTION.cash.mode = NA',
    '1. Skip',
    'No-op',
    'Functional', 'Medium'),

tc('TC_CBMCV_008', 'CBM Cash Verification', '', 'Verify cheque V/R mirrors cash flow except R uses Both+Submit',
    'CBM_COLLECTION.cheque.mode',
    '1. V: greenTick + Save\n2. R: redClose + Both + Submit + Save',
    'Cheque verified or rejected',
    'Functional', 'High'),

tc('TC_CBMCV_009', 'CBM Cash Verification', '', 'Verify UPI Insert via insertBankStatement(UPI, refNo, amount)',
    'CBM_COLLECTION.upi.refNo: 11111123, amount: 3',
    '1. insertBankStatement("UPI", refNo, amount)',
    'UPI bank statement inserted',
    'Functional', 'High'),

tc('TC_CBMCV_010', 'CBM Cash Verification', '', 'Verify UPI flow with reload after insert',
    'After Insert: page.reload()',
    '1. Insert\n2. Reload\n3. Run UPI flow (V/R)',
    'UPI verified or rejected',
    'Functional', 'High'),

tc('TC_CBMCV_011', 'CBM Cash Verification', '', 'Verify NEFT Insert + flow similar to UPI',
    'CBM_COLLECTION.neft.refNo: 22222233, amount: 4',
    '1. Insert\n2. Reload\n3. Run NEFT flow',
    'NEFT verified or rejected',
    'Functional', 'High'),

// ════════════════════════════════════════════════════════════════════════════
// 13. OBC ELIMINATION (Credit Adjustment)
// ════════════════════════════════════════════════════════════════════════════
tc('TC_OBCE_001', 'OBC Elimination', 'Brand=GDJGT: Godrej GT (id=3), FC=BYTI:Byrathi (id=1)', 'Verify ChampFcBrands DB row exists for FC+Brand',
    'fc_id=1, brand_id=3',
    '1. Query getChampFcBrandsConfig(1, 3)\n2. Assert config truthy',
    'Row exists; assertion passes',
    'Smoke', 'Critical'),

tc('TC_OBCE_002', 'OBC Elimination', '', 'Verify obc_adjustment_date is not NULL',
    'Field: obc_adjustment_date',
    '1. Read config.obc_adjustment_date\n2. Assert not null',
    'OBC Elimination is enabled for this FC+Brand',
    'Functional', 'Critical'),

tc('TC_OBCE_003', 'OBC Elimination', '', 'Verify invoice_threshold_date is read and logged',
    'Field: invoice_threshold_date',
    '1. Read config.invoice_threshold_date\n2. Log',
    'Threshold date logged for cutoff comparison',
    'Functional', 'High'),

tc('TC_OBCE_004', 'OBC Elimination', '', 'Verify generateNewFile=0 reads invoiceNo from existing file',
    'CFG.generateNewFile=0, file: CreditNoteadjustmentreport_GODREJ.csv',
    '1. readBillNoFromFile(FILE)\n2. Log invoiceNo',
    'invoiceNo read from CSV',
    'Functional', 'High'),

tc('TC_OBCE_005', 'OBC Elimination', '', 'Verify generateNewFile=1 fetches BillBack invoices and generates new file',
    'CFG.generateNewFile=1, getBillBackInvoices(fc_id, brand_id, 1)',
    '1. Fetch invoices\n2. Assert length > 0\n3. Pick invoices[0].invoice_no\n4. generateCollectionReport with generateCollectionNumber()\n5. Write to FILE',
    'New file generated; invoice picked from DB',
    'Functional', 'High'),

tc('TC_OBCE_006', 'OBC Elimination', '', 'Verify excelInvoices loaded and beforeState captured',
    'readAllInvoicesFromFile(FILE)',
    '1. Read all rows\n2. For each distinct invoice: capture DB state',
    'beforeState Map populated',
    'Functional', 'High'),

tc('TC_OBCE_007', 'OBC Elimination', '', 'Verify pre-check: no existing obc_adjustment_data entry',
    'getObcAdjustmentEntry(invoice)',
    '1. Query DB\n2. Assert null',
    'Clean state confirmed',
    'Functional', 'Critical'),

tc('TC_OBCE_008', 'OBC Elimination', '', 'Verify Adapter Uploads → Upload click sequence',
    'Selectors via obcEliminationPage',
    '1. clickAdapterUploads\n2. Wait 1s\n3. clickUpload\n4. Wait 1s',
    'Upload modal opens',
    'Smoke', 'Critical'),

tc('TC_OBCE_009', 'OBC Elimination', '', 'Verify Upload Type dropdown selects Credit Adjustment',
    'CFG.uploadType: Credit Adjustment',
    '1. clickUploadTypeDropdown\n2. selectUploadType (Credit Adjustment)',
    'Type set',
    'Smoke', 'Critical'),

tc('TC_OBCE_010', 'OBC Elimination', '', 'Verify FC dropdown opens via .ant-modal-body .ant-select-selector nth(1)',
    'Selector scoped to .ant-modal-body, nth(1)',
    '1. Click FC dropdown\n2. Wait 300ms',
    'FC dropdown opens (modal-scoped to avoid overlay click)',
    'Functional', 'Critical'),

tc('TC_OBCE_011', 'OBC Elimination', '', 'Verify FC search via .ant-select-dropdown:visible input.last() with fill',
    'Search: BYTI',
    '1. waitFor visible input (5s)\n2. fill BYTI',
    'FC dropdown filtered without dismissing modal',
    'Functional', 'Critical'),

tc('TC_OBCE_012', 'OBC Elimination', '', 'Verify FC selection (BYTI: Byrathi)',
    'CFG.fc: BYTI: Byrathi',
    '1. Click selectedFC',
    'FC chosen',
    'Smoke', 'Critical'),

tc('TC_OBCE_013', 'OBC Elimination', '', 'Verify Brand dropdown via .ant-modal-body .ant-select-selector nth(2)',
    'Modal-scoped nth(2)',
    '1. Click Brand dropdown\n2. Wait 300ms',
    'Brand dropdown opens',
    'Functional', 'Critical'),

tc('TC_OBCE_014', 'OBC Elimination', '', 'Verify Brand search GDJGT and select GDJGT: Godrej GT',
    'CFG.brandSearchText: GDJGT, CFG.brand: GDJGT: Godrej GT',
    '1. Fill input\n2. Click selectedBrand',
    'Brand selected',
    'Smoke', 'Critical'),

tc('TC_OBCE_015', 'OBC Elimination', '', 'Verify Collection Report file upload',
    'File: C:\\Users\\User\\Downloads\\CreditNoteadjustmentreport_GODREJ.csv',
    '1. uploadCollectionReport(filePath)',
    'File attached',
    'Functional', 'Critical'),

tc('TC_OBCE_016', 'OBC Elimination', '', 'Verify Submit button click',
    'Selector: Submit button',
    '1. clickSubmit',
    'Upload submitted',
    'Smoke', 'Critical'),

tc('TC_OBCE_017', 'OBC Elimination', '', 'Verify Wait for Fully Processed and click status icon',
    'Polling till Fully Processed',
    '1. waitForFullyProcessedAndClickStatus',
    'Status reaches Fully Processed; status icon clicked',
    'Functional', 'High'),

tc('TC_OBCE_018', 'OBC Elimination', '', 'Verify per-invoice DB queries: obc_adjustment_data, collection_invoice, payments, outstanding',
    'getObcAdjustmentEntry, getCollectionInvoiceEntry, getPaymentsByCollectionInvoiceId, getChampOutstandingInvoice',
    '1. Run all queries per invoice\n2. Compute deltas\n3. writeAutomationResultsToFile',
    'DB state reflects credit adjustment; deltas correct',
    'Functional', 'Critical'),

tc('TC_OBCE_019', 'OBC Elimination', '', 'Verify outstanding decreases by adjustedCrAmount',
    'testAdjustedCrAmount: 1.00',
    '1. Compute outstanding before vs after\n2. Assert delta == 1.00',
    'Outstanding reduced by 1.00',
    'Functional', 'Critical'),

tc('TC_OBCE_020', 'OBC Elimination', '', 'Verify duplicate detection re-uploads same file',
    'Same CSV uploaded twice',
    '1. Re-run upload flow\n2. Wait Fully Processed',
    'Re-upload reaches Fully Processed',
    'Negative', 'High'),

tc('TC_OBCE_021', 'OBC Elimination', '', 'Verify View shows Previously Captured > 0 and Unique Entries = 0',
    'View counts',
    '1. Open View\n2. Read Previously Captured count\n3. Read Unique Entries count',
    'Previously Captured > 0; Unique = 0',
    'Negative', 'High'),

tc('TC_OBCE_022', 'OBC Elimination', '', 'Verify duplicate post-check: no new obc_adjustment_data row',
    'DB query',
    '1. Compare row count before vs after',
    'No new rows added',
    'Negative', 'Critical'),

tc('TC_OBCE_023', 'OBC Elimination', '', 'Verify zero-amount file generation',
    'All cr_amount = 0.00',
    '1. generateCollectionReport with adjustedCrAmount=0.00',
    'File generated with zero amounts',
    'Functional', 'Medium'),

tc('TC_OBCE_024', 'OBC Elimination', '', 'Verify zero-amount upload skips all rows',
    'View: all counts = 0',
    '1. Upload zero-amount file\n2. Open View\n3. Verify counts = 0',
    'All entries skipped',
    'Negative', 'Medium'),

tc('TC_OBCE_025', 'OBC Elimination', '', 'Verify zero-amount post-check: DB has no obc_adjustment_data',
    'DB query',
    '1. Query obc_adjustment_data\n2. Assert empty',
    'No rows added',
    'Negative', 'Medium'),

// ════════════════════════════════════════════════════════════════════════════
// 14. SEG CA (Credit Adjustment Allocation)
// ════════════════════════════════════════════════════════════════════════════
tc('TC_SEGCA_001', 'SEG CA', '', 'Verify Allocation link clickable',
    'Selector: a:has-text("Allocation")',
    '1. Click Allocation\n2. Wait 1s',
    'Allocation page opens',
    'Smoke', 'High'),

tc('TC_SEGCA_002', 'SEG CA', '', 'Verify Select FC dropdown opens',
    'Selector: .ant-select-selector.filter({hasText: "Select FC"})',
    '1. Click FC dropdown\n2. Wait 1s',
    'Dropdown opens',
    'Functional', 'High'),

tc('TC_SEGCA_003', 'SEG CA', '', 'Verify BGRD: Begur Road option selectable',
    'Option: ant-select-item-option BGRD: Begur Road',
    '1. Click option\n2. Wait 1s',
    'FC selected',
    'Functional', 'High'),

tc('TC_SEGCA_004', 'SEG CA', '', 'Verify Select Brand dropdown opens',
    'Selector: .ant-select-selector.filter({hasText: "Select Brand"})',
    '1. Click Brand dropdown\n2. Wait 1s',
    'Brand dropdown opens',
    'Functional', 'High'),

tc('TC_SEGCA_005', 'SEG CA', '', 'Verify SNPR: Sunpure option selectable',
    'Option: getByText("SNPR: Sunpure")',
    '1. Click option\n2. Wait 1s',
    'Brand selected',
    'Functional', 'High'),

tc('TC_SEGCA_006', 'SEG CA', '', 'Verify Continue button proceeds',
    'Selector: button:has-text("Continue")',
    '1. Click Continue\n2. Wait 3s',
    'Invoice list loads',
    'Smoke', 'Critical'),

tc('TC_SEGCA_007', 'SEG CA', '', 'Verify invoice checkboxes selected from soInvoices.json',
    'Source: test-data/runtime/soInvoices.json, Selector: //tr[td[7][contains(., invoiceNo)]]//td[1]//input[@type="checkbox"]',
    '1. For each invoice: locate checkbox\n2. If count > 0: click + wait 300ms',
    'Selected/Skipped logged',
    'Functional', 'High'),

tc('TC_SEGCA_008', 'SEG CA', '', 'Verify Assign button clicked',
    'Selector: :text-is("Assign")',
    '1. Click Assign\n2. Wait 1s',
    'Assign dialog opens',
    'Functional', 'High'),

tc('TC_SEGCA_009', 'SEG CA', '', 'Verify Salesman dropdown opens',
    'Selector: .ant-select-selector.filter({hasText: "Select salesman"})',
    '1. Click dropdown\n2. Wait 1s',
    'Salesman dropdown opens',
    'Functional', 'High'),

tc('TC_SEGCA_010', 'SEG CA', '', 'Verify salesman option by mobile selectable',
    'USERS.collection.mobile: 9886996369, Selector: getByText(`(${mobile})`)',
    '1. Click salesman option\n2. Wait 1s',
    'Salesman selected',
    'Functional', 'High'),

tc('TC_SEGCA_011', 'SEG CA', '', 'Verify Confirm Assignment button clicked',
    'Selector: :text("Confirm Assignment")',
    '1. Click Confirm Assignment\n2. Wait 2s',
    'Assignment confirmed',
    'Smoke', 'Critical'),

tc('TC_SEGCA_012', 'SEG CA', '', 'Verify "Remove and Continue" handled if visible',
    'Selector: :text("Remove and Continue with Other Invoices")',
    '1. Wait 3s for visible (soft)\n2. If visible: click + log\n3. Else: log skipping',
    'Dialog dismissed gracefully',
    'Functional', 'Medium'),

tc('TC_SEGCA_013', 'SEG CA', '', 'Verify Pending Financial Adjustment modal detection',
    'Selector: :text("Pending Financial Adjustment")',
    '1. waitFor visible (2s)\n2. Return true/false',
    'Branch decision made',
    'Functional', 'High'),

tc('TC_SEGCA_014', 'SEG CA', '', 'Verify CA upload flow when Pending modal is shown',
    'Sunpure CA Config: BGRD + SNPR + CollectionReport_SUNPURE.xlsx',
    '1. Close modal\n2. Logout segCA\n3. Login OBC admin\n4. Run upload sequence (Adapter, Upload, Type, FC, Brand, file, Submit)',
    'Credit Adjustment uploaded',
    'Functional', 'High'),

tc('TC_SEGCA_015', 'SEG CA', '', 'Verify "Some invoices cannot be assigned" cancel handling',
    'Modal: :text("Some invoices cannot be assigned"), Cancel button',
    '1. waitFor visible (2s)\n2. Click Cancel\n3. Log',
    'Modal cancelled',
    'Negative', 'Medium'),

tc('TC_SEGCA_016', 'SEG CA', '', 'Verify Close button clicked if visible',
    'Selector: button:has-text("Close")',
    '1. waitFor visible (3s)\n2. Click first Close',
    'Modal closes or skipped',
    'Functional', 'Medium'),

tc('TC_SEGCA_017', 'SEG CA', '', 'Verify Handover Invoices button click',
    'Selector: //button[normalize-space()="Handover Invoices"]',
    '1. Click Handover Invoices\n2. Wait 2s',
    'Handover page loads',
    'Smoke', 'Critical'),

tc('TC_SEGCA_018', 'SEG CA', '', 'Verify Sunpure invoice count matches soInvoices.json',
    'Locator: //tr[td[2][contains(., "Sunpure")]]//td[4]//div',
    '1. Count Sunpure rows\n2. expect(actualCount).toBe(invoices.length)',
    'Counts match',
    'Functional', 'Critical'),

// ════════════════════════════════════════════════════════════════════════════
// 15. SMOKE TEST (E2E orchestration)
// ════════════════════════════════════════════════════════════════════════════
tc('TC_SMOKE_001', 'Smoke Test', '', 'Verify Login step (navigate + email + password + click)',
    'admin@ripplr.in / M@ver!ck',
    '1. Navigate\n2. Fill email\n3. Fill password\n4. Click Login',
    'Logged in',
    'Smoke', 'Critical'),

tc('TC_SMOKE_002', 'Smoke Test', '', 'Verify Return to FC step (full sub-flow)',
    'Vehicle: TN09TN9090, Status: D, RFC files: 2',
    '1. Logistics\n2. Return to FC\n3. Eye icon\n4. Scroll\n5. processAllInvoicesFlow\n6. verifyAllInvoices\n7. uploadRFCFiles (both)\n8. clickVerifyRFC\n9. Wait 6s\n10. subtractCollectionDatesForAllInvoices',
    'RFC complete',
    'Smoke', 'Critical'),

tc('TC_SMOKE_003', 'Smoke Test', 'CMBT FC', 'Verify OBC Upload step (full sub-flow + logout)',
    'CMBT FC, BRIT brand, preprodobc 2.xlsx',
    '1. Adapter Uploads\n2. Upload\n3. Type=OBC\n4. FC=CMBT\n5. Brand=BRIT\n6. Upload file\n7. Submit\n8. Filter OBC\n9. Search x2\n10. Status icon + Close\n11. Logout',
    'OBC upload + logout done',
    'Smoke', 'Critical'),

tc('TC_SMOKE_004', 'Smoke Test', 'CMBT FC', 'Verify SEG step (login + allocation)',
    'seg4@ripplr.in, CMBT, BRIT, Abdul',
    '1. Login as SEG\n2. Allocation\n3. CMBT\n4. BRIT\n5. Continue\n6. Salesman Abdul\n7. Search\n8. Wait 5s\n9. Scroll + checkbox + Assign + Submit',
    'SEG allocation done',
    'Smoke', 'Critical'),

tc('TC_SMOKE_005', 'Smoke Test', '', 'Verify Collection step (login + multi-mode)',
    'Mobile + PIN, all 4 modes',
    '1. Navigate\n2. Mobile + Submit\n3. PIN + Submit\n4. Down arrow\n5. Cash 18\n6. Cheque 42 + ref + bank + due\n7. UPI 12 (handleUPIFlow)\n8. NEFT 19 + ref\n9. Auto + Shop Closed\n10. Final Submit + Confirm',
    'Collection submitted',
    'Smoke', 'Critical'),

tc('TC_SMOKE_006', 'Smoke Test', '', 'Verify SEG Verification step (login + verify + logout)',
    'seg4@ripplr.in, verificationType=S',
    '1. Login as SEG\n2. Verification\n3. Salesman row\n4. Start Verification\n5. runFlow\n6. Wait 5s\n7. Logout',
    'SEG verification done',
    'Smoke', 'Critical'),

tc('TC_SMOKE_007', 'Smoke Test', '', 'Verify Cash Verification step (login + cash + cheque + UPI + NEFT)',
    'cash4@ripplr.in, all modes per cashier.js',
    '1. Login as Cash\n2. Collection Settlement\n3. Salesman Settle\n4. Start Verification\n5. runCashFlow\n6. runChequeFlow\n7. UPI: Insert + reload + flow\n8. NEFT: Insert + reload + flow',
    'Cash verification done',
    'Smoke', 'Critical'),

];

// Build worksheet data
const wsData = [headers, ...testCases];

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths
ws['!cols'] = [
    { wch: 16 },  // TESTCASE ID
    { wch: 22 },  // MODULE
    { wch: 32 },  // CHANGE REQUEST
    { wch: 10 },  // PLATFORM
    { wch: 55 },  // TEST SCENARIO
    { wch: 50 },  // TEST DATA
    { wch: 75 },  // TEST STEPS
    { wch: 55 },  // EXPECTED RESULTS
    { wch: 12 },  // TYPE
    { wch: 10 },  // SEVERITY
    { wch: 36 },  // SPEC_FILE
    { wch: 50 },  // TEST_TITLE
    { wch: 50 },  // STEP_NAME
    { wch: 10 },  // Result
    { wch: 60 },  // Screenshot
];

// Enable wrap text in all data cells
const range = XLSX.utils.decode_range(ws['!ref']);
for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddr]) continue;
        ws[cellAddr].s = { alignment: { wrapText: true, vertical: 'top' } };
    }
}

XLSX.utils.book_append_sheet(wb, ws, 'Test Cases');

// Save to project folder (backup first — always succeeds)
const localPath = resolve(process.cwd(), 'test-cases', 'TestCases_CollectionAuto.xlsx');
XLSX.writeFile(wb, localPath);
console.log(`Backup saved: ${localPath}`);

// Save to user's Downloads folder — may be locked if Excel has it open
const downloadsPath = resolve('C:\\Users\\User\\Downloads', 'TestCases_CollectionAuto.xlsx');
try {
    XLSX.writeFile(wb, downloadsPath);
    console.log(`Excel saved to Downloads: ${downloadsPath}`);
} catch (err) {
    if (err.code === 'EBUSY') {
        console.warn(`[WARN] Downloads file is locked (open in Excel). Using backup only: ${localPath}`);
    } else {
        throw err;
    }
}

console.log(`Total test cases: ${testCases.length}`);
