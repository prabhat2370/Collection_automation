import { readFileSync } from 'fs';
import { resolve } from 'path';
import { subtractCollectionDate } from '../utils/dbHelper.js';

const SO_INVOICES_FILE = resolve(process.cwd(), 'utils/soInvoices.json');

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
        this.eyeIcon = (driverName) => this.page.locator(`//tr[td[contains(., '${driverName}')]]//a[contains(@href, 'return-to-fc-new')]`);
        this.deliveryStatusDropdown = (invoice) => this.page.locator(`//tr[td[contains(., '${invoice}')]]//td[7]//div[contains(@class,'ant-select-selector')]`);
        this.statusOption = (text) => this.page.locator(`//div[contains(@class,'ant-select-item-option') and @title='${text}']`);
        this.okBtn = this.page.locator(":text('OK')");
        this.yesBtn = this.page.locator(":text('Yes')");
        this.updateBtn = this.page.locator(":text('Update')");

        // Collection form locators
        this.invoiceReturnedRadio = this.page.getByRole('radio', { name: 'Invoice Returned' });
        this.cashAmount     = this.page.getByRole('spinbutton', { name: 'Amount' }).nth(0);
        this.chequeAmount   = this.page.getByRole('spinbutton', { name: 'Amount' }).nth(1);
        this.chequeNumber   = this.page.getByPlaceholder('Cheque Number');
        this.bankDropdown   = this.page.locator("//div[.//span[normalize-space()='Select Bank']]");
        this.dueDate        = this.page.getByPlaceholder('Select date');
        this.todayBtn       = this.page.locator(".ant-picker-today-btn");
        this.upiAmount      = this.page.getByRole('spinbutton', { name: 'Amount' }).nth(2);
        this.upiRefNumber   = this.page.getByPlaceholder('UPI Reference Number');
        this.neftAmount     = this.page.getByRole('spinbutton', { name: 'Amount' }).nth(3);
        this.neftRefNumber  = this.page.getByPlaceholder('Reference Number');
        this.collectionUpdateBtn = this.page.getByRole('button', { name: 'Update' });

        // Verify invoices + RFC close locators
        this.checkIcon = (invoice) => this.page.locator(`//tr[td[contains(., '${invoice}')]]//td[10]//div[@cursor='pointer'][last()]`);
        this.uploadInvBtn = this.page.locator("button:has-text('Upload Inv & Other Doc')");
        this.fileInput = this.page.locator("input[type='file']");
        this.uploadConfirmBtn = this.page.locator("//div[@class='sc-bczRLJ iVToiv'][normalize-space()='Upload']");
        this.filesUploadedIndicator = this.page.locator("//div[contains(normalize-space(), 'files uploaded')]");
        this.verifyRFCBtn = this.page.locator(":text('Verify')");
    }

    async clickLogisticsManagement() { await this.logisticsManagement.click(); }
    async clickReturnToFC() { await this.returnToFC.click(); }
    async clickEyeIcon(driverName) { await this.eyeIcon(driverName).first().click(); }

    async clickOK() { await this.okBtn.click(); }
    async clickYes() { await this.yesBtn.click(); }
    async clickUpdate() { await this.updateBtn.click(); }

    async processAllInvoicesFlow(statusCode, collection) {
        const invoices = JSON.parse(readFileSync(SO_INVOICES_FILE, 'utf-8'));
        const statusText = STATUS_MAP[statusCode];
        const rfcShowUrl = this.page.url(); // save RFC show URL to navigate back each time

        for (const invoice of invoices) {
            console.log(`\n--- Processing invoice: ${invoice} | status: ${statusText} ---`);

            // Navigate back to RFC show page
            await this.page.goto(rfcShowUrl, { waitUntil: 'networkidle' });
            await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await this.page.waitForTimeout(1500);

            // Set delivery status for this invoice
            await this.deliveryStatusDropdown(invoice).click();
            await this.page.waitForTimeout(500);
            await this.statusOption(statusText).click();
            await this.page.waitForTimeout(1500);

            // Click OK if present (toast/modal)
            try {
                await this.okBtn.click({ timeout: 3000 });
                await this.page.waitForTimeout(500);
            } catch (_) { /* no OK button, continue */ }

            // Click Yes on confirmation
            await this.yesBtn.click({ timeout: 10000 });
            await this.page.waitForTimeout(500);

            // Click Update → wait for collection page
            await Promise.all([
                this.page.waitForURL('**/collection**', { timeout: 15000 }),
                this.updateBtn.click(),
            ]);
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
            await this.todayBtn.click();
            await this.page.waitForTimeout(300);
        }

        // UPI — skip if empty
        if (collection.upi) {
            await this.upiAmount.click();
            await this.upiAmount.fill(collection.upi);
            await this.page.waitForTimeout(1000);
            await this.upiRefNumber.click();
            await this.upiRefNumber.fill(String(Date.now()).padEnd(14, '0').slice(0, 14));
            await this.page.waitForTimeout(300);
        }

        // NEFT — skip if empty
        if (collection.neft) {
            await this.neftAmount.click();
            await this.neftAmount.fill(collection.neft);
            await this.page.waitForTimeout(1000);
            await this.neftRefNumber.click();
            await this.neftRefNumber.fill(String(Date.now()).padEnd(12, '0').slice(0, 12));
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
        await this.page.waitForTimeout(1500);

        // File input is always in DOM (hidden) — set both files at once (input has multiple attr)
        await this.fileInput.setInputFiles(absPaths);
        await this.page.waitForTimeout(2000);

        // Click Upload to confirm
        await this.uploadConfirmBtn.click();
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 8000 });
        } catch (_) { /* upload may navigate */ }
        await this.page.waitForTimeout(2000);

        console.log('--- Files uploaded ---');
    }

    async clickVerifyRFC() {
        // Wait for Verify button to load properly
        await this.page.waitForTimeout(4000);
        await this.verifyRFCBtn.scrollIntoViewIfNeeded();
        await this.verifyRFCBtn.click({ force: true });
        await this.page.waitForTimeout(3000);

        // If Verify button still visible, click again
        if (await this.verifyRFCBtn.isVisible()) {
            console.log('Verify button still visible — clicking again...');
            await this.verifyRFCBtn.click({ force: true });
            await this.page.waitForTimeout(3000);
        }

        console.log('--- RFC Verified (Closed) ---');
    }
}
