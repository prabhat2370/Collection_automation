import { OBC_ELIMINATION } from '../config/testData.js';

export class ObcEliminationPage {
    /**
     * @param {import('@playwright/test').Page} page
     * @param {Object} [config] - Brand/FC config (defaults to OBC_ELIMINATION / Nestlé)
     * @param {string} config.fc           - FC display text for dropdown (e.g. 'MKLI: Makali')
     * @param {string} config.brand        - Brand display text for dropdown (e.g. 'NESL: NESTLE')
     * @param {string} config.fcSearchText - Text typed into FC search (e.g. 'MKLI')
     * @param {string} config.brandSearchText - Text typed into Brand search (e.g. 'NESL')
     */
    constructor(page, config = null) {
        this.page = page;
        this.config = config || {
            fc: OBC_ELIMINATION.fc,
            brand: OBC_ELIMINATION.brand,
            fcSearchText: 'MKLI',
            brandSearchText: 'NESL',
            uploadType: 'Credit Adjustment',
        };
        // Default uploadType to "Credit Adjustment" (Nestlé) if not specified
        const uploadType = this.config.uploadType || 'Credit Adjustment';

        // ── Navigation ──────────────────────────────────────────────────────
        this.adapterUploads = this.page.locator(
            "//span[@class='ant-menu-title-content']//a[normalize-space()='Adapter Uploads']"
        );
        this.uploadBtn = this.page.locator("button:has-text('Upload')");

        // ── Upload modal — type dropdown ─────────────────────────────────────
        this.uploadTypeDropdown = this.page.locator("span.ant-select-selection-item").first();
        this.uploadTypeOption = this.page.locator(`//div[@title='${uploadType}']`);

        // ── Upload modal — FC(s) dropdown ────────────────────────────────────
        this.fcDropdown = this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4);
        this.selectedFC = this.page.getByText(this.config.fc, { exact: true });

        // ── Upload modal — Brand dropdown ────────────────────────────────────
        this.brandDropdown = this.page.locator('div').filter({ hasText: /^Select Brand$/ }).nth(4);
        this.selectedBrand = this.page.getByText(this.config.brand, { exact: true });

        // ── Upload modal — file upload button ────────────────────────────────
        // "Credit Adjustment" → button text "Credit Adjustment"
        // "OBC" → button text "Upload a File"
        const uploadBtnText = uploadType === 'OBC' ? 'Upload a File' : uploadType;
        this.collectionReportUpload = this.page.locator(
            `//button[.//span[normalize-space()='${uploadBtnText}']]`
        );

        // ── Upload modal — submit ────────────────────────────────────────────
        this.submitBtn = this.page.getByRole('button', { name: 'Submit' });

        // ── Status list — search bar ─────────────────────────────────────────
        this.selectFileTypeDropdown = this.page.locator(
            'div').filter({ hasText: /^Select File Type$/ }).nth(1);
        this.fileTypeFilterOption = this.page.locator(`//div[@title='${uploadType}']`);

        // FC filter dropdown in status list search bar (modal is closed, so .first() targets filter bar)
        this.statusFcDropdown = this.page.locator('div').filter({ hasText: /^Select FC$/ }).first();
        // Brand filter dropdown in status list search bar
        this.statusBrandDropdown = this.page.locator('div').filter({ hasText: /^Select Brand$/ }).first();

        this.searchBtn = this.page.getByRole('button', { name: 'Search' });

        // Status cell (col 6) and view icon (col 7) for first row matching uploadType
        this.latestStatusCell = this.page.locator(
            `//tbody/tr[td[contains(., '${uploadType}')]][1]//td[6]`
        );
        this.latestStatusIcon = this.page.locator(
            `//tbody/tr[td[contains(., '${uploadType}')]][1]//img[contains(@class, 'view_icon')]`
        );
    }

    // ── Navigation ───────────────────────────────────────────────────────────
    async clickAdapterUploads() { await this.adapterUploads.click(); }
    async clickUpload() { await this.uploadBtn.click(); }

    // ── Upload form ──────────────────────────────────────────────────────────
    async clickUploadTypeDropdown() { await this.uploadTypeDropdown.click(); }
    async selectUploadType() { await this.uploadTypeOption.click(); }

    async clickFCDropdown() { await this.fcDropdown.click(); }
    async typeFC() { await this.page.keyboard.type(this.config.fcSearchText); }
    async selectFC() { await this.selectedFC.click(); }

    async clickBrandDropdown() { await this.brandDropdown.click(); }
    async typeBrand() { await this.page.keyboard.type(this.config.brandSearchText); }
    async selectBrand() { await this.selectedBrand.click(); }

    async uploadCollectionReport(filePath) {
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.collectionReportUpload.click(),
        ]);
        await fileChooser.setFiles(filePath);
    }

    async clickSubmit() {
        // Submit navigates to adapter-uploads page directly (no confirmation dialog)
        await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
            this.submitBtn.click(),
        ]);
        await this.page.waitForTimeout(2000);
    }

    // ── Wait for upload entry & open view ──────────────────────────────────
    // Click Search up to 3 times. On each attempt, find the top Credit Adjustment
    // row's eye icon and click it to open the view. Stop after 3 attempts.
    async waitForProcessingAndClickStatus() {
        const maxSearchClicks = 3;

        // Wait for the upload to register on the server
        await this.page.waitForTimeout(10000);

        // Select Credit Adjustment in file type filter dropdown
        await this.selectFileTypeDropdown.click();
        await this.page.waitForTimeout(500);
        await this.fileTypeFilterOption.click();
        await this.page.waitForTimeout(500);

        // Select our FC in FC filter dropdown
        try {
            await this.statusFcDropdown.click({ timeout: 3000 });
            await this.page.waitForTimeout(500);
            await this.page.keyboard.type(this.config.fcSearchText);
            await this.page.waitForTimeout(500);
            await this.page.getByText(this.config.fc, { exact: true }).click({ timeout: 3000 });
            await this.page.waitForTimeout(500);
            console.log(`[Filter] Selected FC: ${this.config.fc}`);
        } catch (e) {
            console.log(`[Filter] Could not apply FC filter: ${e.message}`);
        }

        // Select our Brand in Brand filter dropdown
        try {
            await this.statusBrandDropdown.click({ timeout: 3000 });
            await this.page.waitForTimeout(500);
            await this.page.keyboard.type(this.config.brandSearchText);
            await this.page.waitForTimeout(500);
            await this.page.getByText(this.config.brand, { exact: true }).click({ timeout: 3000 });
            await this.page.waitForTimeout(500);
            console.log(`[Filter] Selected Brand: ${this.config.brand}`);
        } catch (e) {
            console.log(`[Filter] Could not apply Brand filter: ${e.message}`);
        }

        for (let i = 0; i < maxSearchClicks; i++) {
            console.log(`Search attempt ${i + 1} of ${maxSearchClicks}...`);
            await this.searchBtn.click();

            // Wait for table rows to load
            await this.page.waitForFunction(() => {
                const rows = document.querySelectorAll('table tbody tr');
                return rows.length > 0 &&
                    [...rows[0].querySelectorAll('td')].some(td => td.innerText.trim() !== '');
            }, { timeout: 10000 }).catch(() => {});

            // Read status of top row
            const found = await this.latestStatusCell.isVisible().catch(() => false);
            if (!found) {
                console.log(`Attempt ${i + 1}: No Credit Adjustment row found.`);
                await this.page.waitForTimeout(3000);
                continue;
            }

            const rawText = await this.latestStatusCell.innerText();
            const statusText = rawText.split('\n')[0].trim();
            const statusLower = statusText.toLowerCase();
            console.log(`Attempt ${i + 1}: Top row status — "${statusText}"`);

            // Eye/view icon: the app renders <img class="view_icon" src="...eye-icon.svg">
            // in column 7 of the first Credit Adjustment row. Click the parent div (cursor=pointer).
            const viewIconVisible = await this.latestStatusIcon.isVisible().catch(() => false);
            console.log(`Attempt ${i + 1}: view_icon visible: ${viewIconVisible}`);

            if (!viewIconVisible) {
                console.log(`Attempt ${i + 1}: view_icon not visible yet.`);
                await this.page.waitForTimeout(3000);
                continue;
            }

            console.log(`Attempt ${i + 1}: Clicking view_icon...`);
            await this.latestStatusIcon.click({ force: true });
            await this.page.waitForURL('**/adapter-uploads/**', { timeout: 15000 }).catch(() => {});
            await this.page.waitForTimeout(2000);

            // Any status (Fully Processed / Partially Processed / Validation Error / Processing Error)
            // lands on the same View page. The per-invoice report classifies each row — no throw here.
            if (statusLower.includes('error')) {
                console.log(`⚠  Upload top-row status is "${statusText}" — proceeding to per-invoice report.`);
            }

            return;
        }

        throw new Error('Could not click eye icon after 3 Search attempts — entry not found or icon not visible');
    }

    // ── Capture results from the View page ───────────────────────────────────
    // View page URL: /adapter-uploads/{id}?fileType=credit_adjustment
    // Stat boxes: "Unique Entries : N", "Previously captured : N", "Error : N"
    // Table column "Entry Type": "Unique" | "Previously captured" | "Error: ..."
    //
    // Returns:
    //   { uniqueEntries, previouslyCaptured, errors, rowDetails }
    //   rowDetails: [{ invoiceNo, amount, entryType }]
    async captureViewResults() {
        await this.page.waitForTimeout(2000); // let stat boxes render

        const parseStatCount = async (label) => {
            // Stat box text looks like "Unique Entries : 2"
            const el = this.page.locator(`text=/${label}/i`).first();
            const visible = await el.isVisible().catch(() => false);
            if (!visible) return 0;
            const text = await el.innerText();
            const match = text.match(/:\s*(\d+)/);
            return match ? parseInt(match[1]) : 0;
        };

        const uniqueEntries      = await parseStatCount('Unique Entries');
        const previouslyCaptured = await parseStatCount('Previously captured');
        const errors             = await parseStatCount('Error');
        const expectedTotal = uniqueEntries + previouslyCaptured + errors;

        console.log(`[View] Unique: ${uniqueEntries} | Prev Captured: ${previouslyCaptured} | Error: ${errors} | Expected total: ${expectedTotal}`);

        // ── Target the correct results table (not any table on the page) ─────
        const resultsTable = this.page.locator('table').filter({
            has: this.page.locator('th:has-text("Entry Type")')
        }).first();

        const tableFound = await resultsTable.isVisible({ timeout: 5000 }).catch(() => false);
        if (!tableFound) {
            console.log('[View] ⚠ Results table with "Entry Type" header not found — using last table on page');
        }
        const table = tableFound ? resultsTable : this.page.locator('table').last();

        // ── Detect column indices from headers (avoids hardcoded offset bugs) ─
        const headerTexts = await table.locator('thead th').allTextContents();
        const hdrs = headerTexts.map(h => h.trim().toLowerCase());
        const colInvoice   = hdrs.findIndex(h => h.includes('invoice') || h.includes('bill no'));
        const colAmount    = hdrs.findIndex(h => h.includes('adjusted amount') || h.includes('adjusted cr') || (h.includes('amount') && !h.includes('bill')));
        const colEntryType = hdrs.findIndex(h => h.includes('entry type'));
        console.log(`[View] Headers: [${hdrs.join(' | ')}]`);
        console.log(`[View] Column indices — invoice:${colInvoice} amount:${colAmount} entryType:${colEntryType}`);

        // ── Read rows across all pagination pages ────────────────────────────
        const rowDetails = [];
        let pageNum = 1;

        while (pageNum <= 10) {
            const trs = await table.locator('tbody tr').all();
            for (const tr of trs) {
                const cells = await tr.locator('td').allTextContents();
                if (cells.length < 2) continue;
                const detail = {
                    invoiceNo: (colInvoice >= 0   ? cells[colInvoice]   : cells[0])?.trim(),
                    amount:    (colAmount >= 0     ? cells[colAmount]    : cells[1])?.trim(),
                    entryType: (colEntryType >= 0  ? cells[colEntryType] : cells[cells.length - 1])?.trim(),
                };
                rowDetails.push(detail);
                console.log(`[View Row p${pageNum}] ${detail.invoiceNo} | amt:${detail.amount} | type:${detail.entryType}`);
            }

            // Stop if we already have all expected rows
            if (rowDetails.length >= expectedTotal) break;

            // Check for Ant Design pagination "Next" button (not disabled)
            const nextBtn = this.page.locator('li.ant-pagination-next:not(.ant-pagination-disabled)');
            const hasNext = await nextBtn.isVisible().catch(() => false);
            if (!hasNext) break;

            console.log(`[View] Page ${pageNum} captured ${rowDetails.length}/${expectedTotal} rows — clicking Next...`);
            await nextBtn.click();
            await this.page.waitForTimeout(1000);
            pageNum++;
        }

        // ── Validate captured count vs expected ──────────────────────────────
        if (rowDetails.length !== expectedTotal) {
            console.log(`⚠  [View] Row count mismatch: captured ${rowDetails.length} rows, expected ${expectedTotal} (Unique:${uniqueEntries} + Prev:${previouslyCaptured} + Error:${errors})`);
        } else {
            console.log(`[View] ✓ All ${rowDetails.length} rows captured successfully`);
        }

        return { uniqueEntries, previouslyCaptured, errors, rowDetails };
    }
}
