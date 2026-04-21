import { OBC } from '../config/testData.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const SO_INVOICES_FILE = resolve(process.cwd(), 'utils/soInvoices.json');

export class SOUploadPage {
    constructor(page) {
        this.page = page;

        this.adapterUploads = this.page.locator("//span[@class='ant-menu-title-content']//a[normalize-space()='Adapter Uploads']");
        this.uploadBtn = this.page.locator("button:has-text('Upload')");
        this.uploadTypeDropdown = this.page.locator("span.ant-select-selection-item");
        this.salesOrderOption = this.page.locator("//div[@title='Sales Order']");
        this.soReportUpload = this.page.locator("//span[contains(text(),'Upload Sales Order Report (SO Report) File')]");
        this.invoiceReportUpload = this.page.locator("//span[contains(text(),'Upload Invoice Report File')]");
        this.salesRegisterUpload = this.page.locator("//span[contains(text(),'Upload Sales Register File')]");
        this.submitBtn = this.page.getByRole('button', { name: 'Submit' });
        this.selectFileTypeDropdown = this.page.locator('div').filter({ hasText: /^Select File Type$/ }).nth(1);
        this.soOption = this.page.locator("//div[@title='Sales Order']");
        this.searchBtn = this.page.getByRole('button', { name: 'Search' });
        this.statusIcon = this.page.locator("//tbody/tr[td[contains(., 'Sales Order')]][1]//td[7]//span[@aria-label='warning']");
        this.statusIconFallback = this.page.locator("body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(3) > tr:nth-child(1) > td:nth-child(7) > div:nth-child(1) > div:nth-child(1) > img:nth-child(1)");
        this.closeBtn = this.page.getByRole('button', { name: 'Close' });
        this.fcOption = this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4);
        this.selectedFC = this.page.getByText(OBC.fc);
        this.brandOption = this.page.locator("//input[@id='brand']");
        this.selectedBrand = this.page.getByText(OBC.brand);
    }

    async clickAdapterUploads() { await this.adapterUploads.click(); }
    async clickUpload() { await this.uploadBtn.click(); }
    async clickUploadTypeDropdown() { await this.uploadTypeDropdown.click(); }
    async selectSalesOrder() { await this.salesOrderOption.click(); }
    async uploadSOReport(filePath) {
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.soReportUpload.click(),
        ]);
        await fileChooser.setFiles(filePath);
    }
    async uploadInvoiceReport(filePath) {
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.invoiceReportUpload.click(),
        ]);
        await fileChooser.setFiles(filePath);
    }
    async uploadSalesRegister(filePath) {
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.salesRegisterUpload.click(),
        ]);
        await fileChooser.setFiles(filePath);
    }
    async clickSubmit() { await this.submitBtn.click(); }
    async clickSelectFileTypeDropdown() { await this.selectFileTypeDropdown.click(); }
    async clickSOOption() { await this.soOption.click(); }
    async clickSearch() { await this.searchBtn.click(); }
    async clickStatusIcon() { await this.statusIcon.dispatchEvent('click'); }
    
    async waitForFreshUploadAndClickStatus() {
        const maxRetries = 24; // 24 x 5s = 2 min max wait
        const waitMs = 5000;

        // Step 1: Navigate back to adapter-uploads once
        await this.page.goto('https://cdms-preprod.ripplr.in/adapter-uploads', { waitUntil: 'domcontentloaded' });
        await this.page.waitForTimeout(2000);

        // Step 2: Select SO dropdown once
        await this.selectFileTypeDropdown.click();
        await this.page.waitForTimeout(500);
        await this.soOption.click();
        await this.page.waitForTimeout(500);

        // Step 3: Click Search and check — repeat until fresh fully processed entry found
        for (let i = 0; i < maxRetries; i++) {
            await this.searchBtn.click();

            // Wait for table data to load
            await this.page.waitForFunction(() => {
                const rows = document.querySelectorAll('table tbody tr');
                return rows.length > 0 && [...rows[0].querySelectorAll('td')].some(td => td.innerText.trim() !== '');
            }, { timeout: 10000 }).catch(() => {});

            const statusCell = this.page.locator("//tbody/tr[td[contains(., 'Sales Order')]][1]//td[6]");
            const found = await statusCell.isVisible().catch(() => false);
            if (!found) {
                console.log('Attempt ' + (i + 1) + ': No Sales Order row yet, retrying search...');
                await this.page.waitForTimeout(waitMs);
                continue;
            }

            const rawText = await statusCell.innerText();
            console.log('Attempt ' + (i + 1) + ': Status: ' + rawText.replace(/\n/g, ' '));

            // Fail immediately on validation error
            if (rawText.toLowerCase().includes('validation error')) {
                throw new Error('Upload failed with Validation Error — fix the file and re-upload.');
            }

            // Keep retrying if not fully processed yet
            if (!rawText.toLowerCase().includes('fully processed')) {
                console.log('Attempt ' + (i + 1) + ': Not fully processed yet, retrying search...');
                await this.page.waitForTimeout(waitMs);
                continue;
            }

            // Fully processed — check timestamp
            const match = rawText.match(/(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
            if (!match) {
                console.log('Attempt ' + (i + 1) + ': Could not parse timestamp, retrying...');
                await this.page.waitForTimeout(waitMs);
                continue;
            }

            const uploadTime = new Date(match[2] + '/' + match[1] + '/' + match[3] + ' ' + match[4]);
            const diffSecs = (Date.now() - uploadTime.getTime()) / 1000;
            console.log('Attempt ' + (i + 1) + ': Fully Processed, age ' + Math.round(diffSecs) + 's');

            if (diffSecs < 60) {
                console.log('Fresh entry found! Clicking status icon...');
                await this.statusIcon.first().dispatchEvent('click');
                return;
            }

            console.log('Stale entry, retrying search...');
            await this.page.waitForTimeout(waitMs);
        }

        throw new Error('Fully processed SO upload not found within 2 minutes');
    }
    async clickClose() { await this.closeBtn.click(); }
    async captureInvoiceNumbers() {
        const invoiceLocator = this.page.locator(":text('Invoice no')");
        await invoiceLocator.first().waitFor({ state: 'visible' });
        const rows = await this.page.locator("table tbody tr").all();
        const invoices = [];
        for (const row of rows) {
            const cells = await row.locator('td').allTextContents();
            if (cells[0]) invoices.push(cells[0].trim());
        }
        writeFileSync(SO_INVOICES_FILE, JSON.stringify(invoices, null, 2));  // replaces old data only when new invoices captured
        console.log('Captured SO invoices:', invoices);
    }
    async clickFCDropdown() { await this.fcOption.click(); }
    async typeBTM() { await this.page.keyboard.type('BTM'); }
    async selectBTM() { await this.selectedFC.click(); }
    async clickBrandDropdown() { await this.brandOption.click(); }
    async typeBRIT() { await this.page.keyboard.type('BRIT'); }
    async selectBritannia() { await this.selectedBrand.click(); }
}
