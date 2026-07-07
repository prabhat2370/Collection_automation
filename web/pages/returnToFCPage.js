import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { subtractCollectionDate } from '../../utils/dbHelper.js';

const SO_INVOICES_FILE = resolve(process.cwd(), 'test-data/runtime/soInvoices.json');
const COLLECTION_REFS_FILE = resolve(process.cwd(), 'test-data/runtime/collectionRefs.json');

// Persist a payment reference (upi/neft/cheque) to collectionRefs.json so Cash
// Verification can insert the matching bank statement and reconcile it.
// Mirrors saveRef() in web/pages/collectionPage.js; preserves existing keys (e.g. delivery).
function saveRef(key, data) {
    const existing = existsSync(COLLECTION_REFS_FILE) ? JSON.parse(readFileSync(COLLECTION_REFS_FILE)) : {};
    existing[key] = data;
    writeFileSync(COLLECTION_REFS_FILE, JSON.stringify(existing, null, 2));
}

const STATUS_MAP = {
    D: 'Delivered',
    PD: 'Partial Delivered',
    DA: 'Delivery Attempted',
    C: 'Cancelled',
};

export class ReturnToFCPage {
    constructor(page) {
        this.page = page;

        this.logisticsManagement = this.page.locator("//span[normalize-space()='Logistics Management']");
        this.returnToFC = this.page.locator("//a[normalize-space()='Return to FC']");
        this.eyeIcon = (vehicleNo) => this.page.locator(`//tr[td[contains(., '${vehicleNo}')]]//a[contains(@href, 'return-to-fc-new')]`);
        this.deliveryStatusDropdown = (invoice) => this.page.locator(`//tr[td[contains(., '${invoice}')]]//td[8]//div[contains(@class,'ant-select-selector')]`);
        this.statusOption = (text) => this.page.locator(`//div[contains(@class,'ant-select-item-option') and @title='${text}']`);
        this.okBtn = this.page.locator(":text('OK')");
        this.yesBtn = this.page.locator(":text('Yes')");
        this.updateBtn = this.page.locator(":text('Update')");

        // Collection form locators
        this.invoiceReturnedRadio = this.page.getByRole('radio', { name: 'Invoice Returned' });
        this.cashAmount     = this.page.getByRole('spinbutton', { name: 'Amount' }).nth(0);
        this.chequeAmount   = this.page.getByRole('spinbutton', { name: 'Amount' }).nth(1);
        this.chequeNumber   = this.page.getByRole('textbox', { name: 'Cheque Number' });
        this.bankDropdown   = this.page.locator('.ant-select:has(.ant-select-selection-placeholder:text-is("Select Bank"))');
        this.dueDate        = this.page.getByRole('textbox', { name: 'Due Date' });
        this.pickerPanel    = this.page.locator('.ant-picker-dropdown:visible').first();
        this.todayBtn       = this.page.locator('.ant-picker-dropdown:visible .ant-picker-today-btn');
        this.upiAmount      = this.page.getByRole('spinbutton', { name: 'Amount' }).nth(2);
        this.upiRefNumber   = this.page.getByRole('textbox', { name: 'UPI Reference Number' });
        this.neftAmount     = this.page.getByRole('spinbutton', { name: 'Amount' }).nth(3);
        this.neftRefNumber  = this.page.getByRole('textbox', { name: 'Reference Number', exact: true });
        this.collectionUpdateBtn = this.page.getByRole('button', { name: 'Update' });

        // Verify invoices + RFC close locators
        this.checkIcon = (invoice) => this.page.locator(`//tr[td[contains(., '${invoice}')]]//td[11]//div[@cursor='pointer'][last()]`);
        this.uploadInvBtn = this.page.locator("button:has-text('Upload Inv & Other Doc')");
        this.fileInput = this.page.locator("input[type='file']");
        this.uploadConfirmBtn = this.page.locator("//div[@class='sc-bczRLJ iVToiv'][normalize-space()='Upload']");
        this.filesUploadedIndicator = this.page.locator("//div[contains(normalize-space(), 'files uploaded')]");
        this.verifyRFCBtn = this.page.locator(":text('Verify')");
    }

    async clickLogisticsManagement() { await this.logisticsManagement.click(); }
    async clickReturnToFC() { await this.returnToFC.click(); }
    async clickEyeIcon(vehicleNo) { await this.eyeIcon(vehicleNo).first().click(); }

    async clickOK() { await this.okBtn.click(); }
    async clickYes() { await this.yesBtn.click(); }
    async clickUpdate() { await this.updateBtn.click(); }

    async processAllInvoicesFlow(statusCode, collection) {
        const invoices = JSON.parse(readFileSync(SO_INVOICES_FILE, 'utf-8'));
        const statusText = STATUS_MAP[statusCode];
        this.rfcShowUrl = this.page.url(); // save for verifyAllInvoices to navigate back
        const rfcShowUrl = this.rfcShowUrl;

        for (const invoice of invoices) {
            console.log(`\n--- Processing invoice: ${invoice} | status: ${statusText} ---`);

            // Navigate back to RFC show page
            await this.page.goto(rfcShowUrl, { waitUntil: 'load' });
            await this.page.waitForTimeout(2000);

            // Scroll to the invoice row's delivery dropdown and click
            const dropdown = this.deliveryStatusDropdown(invoice);
            await dropdown.waitFor({ state: 'visible', timeout: 15000 });
            await dropdown.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(500);
            await dropdown.click();
            await this.page.waitForTimeout(500);
            await this.statusOption(statusText).click();
            await this.page.waitForTimeout(1500);

            // Click OK if present (toast/modal)
            try {
                await this.okBtn.click({ timeout: 3000 });
                await this.page.waitForTimeout(500);
            } catch (_) { /* no OK button, continue */ }

            // Click Yes on confirmation (may not appear if status was already set)
            try {
                await this.yesBtn.click({ timeout: 5000 });
                await this.page.waitForTimeout(500);
            } catch (_) { /* no confirmation modal, continue */ }

            // Click Update → wait for collection page
            try {
                await Promise.all([
                    this.page.waitForURL('**/collection**', { timeout: 20000 }),
                    this.updateBtn.click(),
                ]);
            } catch (_) {
                const currentUrl = this.page.url();
                if (!/collection/i.test(currentUrl)) {
                    console.log(`⚠ Update did not advance to collection step for ${invoice} (still at ${currentUrl}). Skipping — likely already processed.`);
                    continue;
                }
            }
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(1500);

            // Scroll to collection form
            await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await this.page.waitForTimeout(1000);

            // Fill collection form
            await this.fillCollectionForm(collection);
            await this.page.waitForTimeout(500);

            // Submit collection
            await this.collectionUpdateBtn.click();
            await this.page.waitForTimeout(5000);

            console.log(`--- Done: ${invoice} ---`);
        }
    }

    async fillCollectionForm(collection) {
        await this.invoiceReturnedRadio.check();
        await this.page.waitForTimeout(500);

        // Cash — skip if empty
        if (collection.cash) {
            await this.cashAmount.click();
            await this.cashAmount.fill(collection.cash);
            await this.page.waitForTimeout(500);
        }

        // Cheque — skip if empty
        if (collection.cheque) {
            await this.chequeAmount.click();
            await this.chequeAmount.fill(collection.cheque);
            await this.page.waitForTimeout(1000);
            await this.chequeNumber.click();
            await this.chequeNumber.fill(String(100000 + Math.floor(Math.random() * 900000)));
            await this.page.waitForTimeout(300);
            await this.bankDropdown.click();
            await this.page.waitForTimeout(500);
            await this.page.locator('.ant-select-item-option').first().click();
            await this.page.waitForTimeout(300);
            await this.dueDate.click();
            await this.page.waitForTimeout(500);
            // Wait for the date-picker panel, then pick today — fall back to the
            // "today" cell (or first selectable cell) if the quick-select button is absent.
            await this.pickerPanel.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
            if (await this.todayBtn.isVisible().catch(() => false)) {
                await this.todayBtn.click();
            } else {
                await this.pickerPanel.locator('.ant-picker-cell-today').first().click()
                    .catch(async () => {
                        await this.pickerPanel.locator('.ant-picker-cell-in-view').first().click();
                    });
            }
            await this.page.waitForTimeout(300);
        }

        // UPI — skip if empty
        if (collection.upi) {
            await this.upiAmount.click();
            await this.upiAmount.fill(collection.upi);
            await this.page.waitForTimeout(1000);
            const upiRef = String(Date.now()).padEnd(14, '0').slice(0, 14);
            await this.upiRefNumber.click();
            await this.upiRefNumber.fill(upiRef);
            // Persist so Cash Verification can insert a matching UPI bank statement.
            saveRef('upi', { refNumber: upiRef, amount: collection.upi });
            await this.page.waitForTimeout(300);
        }

        // NEFT — skip if empty
        if (collection.neft) {
            await this.neftAmount.click();
            await this.neftAmount.fill(collection.neft);
            await this.page.waitForTimeout(1000);
            const neftRef = String(Date.now()).padEnd(12, '0').slice(0, 12);
            await this.neftRefNumber.click();
            await this.neftRefNumber.fill(neftRef);
            // Persist so Cash Verification can insert a matching NEFT bank statement.
            saveRef('neft', { refNumber: neftRef, amount: collection.neft });
            await this.page.waitForTimeout(300);
        }
    }

    async clickCollectionUpdate() { await this.collectionUpdateBtn.click(); }

    async subtractCollectionDatesForAllInvoices() {
        const invoices = JSON.parse(readFileSync(SO_INVOICES_FILE, 'utf-8'));
        for (const invoice of invoices) {
            console.log(`\n--- Subtracting 1 day from collection_date for: ${invoice} ---`);
            await subtractCollectionDate(invoice);
            console.log(`--- Done: ${invoice} ---`);
        }
    }

    async verifyAllInvoices() {
        const invoices = JSON.parse(readFileSync(SO_INVOICES_FILE, 'utf-8'));
        if (this.rfcShowUrl) {
            await this.page.goto(this.rfcShowUrl, { waitUntil: 'load' });
            await this.page.waitForTimeout(2000);
        }
        for (const invoice of invoices) {
            console.log(`\n--- Verifying invoice: ${invoice} ---`);
            const icon = this.checkIcon(invoice);
            await icon.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(500);

            // Check if already verified (circle fill = #023047), if not click to verify
            const fill = await icon.locator('circle').getAttribute('fill');
            if (fill !== '#023047') {
                await icon.click();
                await this.page.waitForTimeout(1000);
            } else {
                console.log(`Invoice ${invoice} already verified, skipping.`);
            }
        }
        console.log('--- All invoices verified ---');
    }

    async uploadRFCFiles(filePaths) {
        const absPaths = filePaths.map(f => resolve(process.cwd(), f));
        console.log(`\n--- Uploading files: ${absPaths.join(', ')} ---`);

        // Open the upload modal
        await this.uploadInvBtn.scrollIntoViewIfNeeded();
        await this.uploadInvBtn.click();

        // Wait for modal to actually become visible
        const modal = this.page.locator('.ant-modal:visible').first();
        await modal.waitFor({ state: 'visible', timeout: 10000 });
        await this.page.waitForTimeout(500);

        // Scope file input to the visible modal — avoids matching stale inputs
        const modalFileInput = modal.locator("input[type='file']");
        await modalFileInput.setInputFiles(absPaths);
        await this.page.waitForTimeout(2000);

        // Click Upload to confirm
        await this.uploadConfirmBtn.click();
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 8000 });
        } catch (_) { /* upload may navigate */ }

        // Wait for modal to close so the next upload iteration starts fresh
        await modal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        await this.page.waitForTimeout(1000);

        console.log('--- Files uploaded ---');
    }

    async isVerifyBtnEnabled() {
        const count = await this.verifyRFCBtn.count();
        if (count === 0) return false;
        const first = this.verifyRFCBtn.first();
        if (!(await first.isVisible().catch(() => false))) return false;

        return await first.evaluate(node => {
            const btn = node.tagName === 'BUTTON' ? node : (node.closest('button') || node);
            if (btn.disabled === true) return false;
            if (btn.hasAttribute('disabled')) return false;
            if (btn.getAttribute('aria-disabled') === 'true') return false;
            const cls = btn.className || '';
            if (/(?:^|\s)(?:ant-btn-)?disabled(?:\s|$)/i.test(cls)) return false;
            return true;
        }).catch(() => false);
    }

    async clickVerifyRFC() {
        await this.page.waitForTimeout(4000);
        await this.verifyRFCBtn.scrollIntoViewIfNeeded();
        await this.verifyRFCBtn.click({ force: true });
        await this.page.waitForTimeout(3000);

        let stillEnabled = await this.isVerifyBtnEnabled();

        if (stillEnabled) {
            console.log('Verify button still enabled — clicking again...');
            await this.verifyRFCBtn.click({ force: true });
            await this.page.waitForTimeout(3000);
            stillEnabled = await this.isVerifyBtnEnabled();
        }

        if (stillEnabled) {
            throw new Error('Verify button still enabled after click — RFC NOT completed.');
        }

        console.log('--- ✓ Verify button disabled → RFC completed ---');
    }
}
