export class SegCAPage {
    constructor(page) {
        this.page = page;

        this.allocationLink = this.page.locator("a:has-text('Allocation')");

        this.selectFcDropdown = this.page
            .locator('.ant-select-selector')
            .filter({ hasText: 'Select FC' });
        this.fcOption = this.page
            .locator('.ant-select-item-option')
            .filter({ hasText: 'BGRD: Begur Road' });

        this.selectBrandDropdown = this.page
            .locator('.ant-select-selector')
            .filter({ hasText: 'Select Brand' });
        this.brandOption = this.page.getByText('SNPR: Sunpure');

        this.continueBtn = this.page.locator("button:has-text('Continue')");

        this.assignBtn = this.page.locator(":text-is('Assign')");

        this.selectSalesmanDropdown = this.page
            .locator('.ant-select-selector')
            .filter({ hasText: 'Select salesman' });

        this.invoiceSearchInput = this.page.getByRole('textbox', { name: 'Invoice Number' });
        this.searchBtn = this.page.locator("//button[normalize-space()='Search']");
    }

    async searchInvoice(invoiceNo) {
        await this.invoiceSearchInput.fill(invoiceNo);
        // Press Enter as the primary trigger (Ant Design search forms usually submit on Enter),
        // then click Search as a backup in case Enter is not wired to the form.
        await this.invoiceSearchInput.press('Enter');
        await this.searchBtn.click({ timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(1500);  // let the table re-render with filtered results
    }

    salesmanOption(mobile) {
        return this.page.getByText(`(${mobile})`);
    }

    get selectSalesmanTrigger() {
        // Click the .ant-select-selector wrapper, NOT the inner :text('Select salesman') span —
        // Ant Design overlays an invisible search <input> on top of the placeholder and the input
        // intercepts pointer events, so a direct click on the placeholder text never actuates.
        return this.page.locator('.ant-select-selector').filter({ hasText: 'Select salesman' });
    }

    async selectSalesmanByMobile(mobile) {
        await this.selectSalesmanTrigger.click({ timeout: 10000 });
        await this.page.waitForTimeout(400);
        await this.page.keyboard.type(mobile);
        await this.page.waitForTimeout(800);  // let the dropdown filter
        await this.salesmanOption(mobile).first().click({ timeout: 10000 });
    }

    get confirmAssignmentBtn() {
        return this.page.locator(":text('Confirm Assignment')");
    }

    get removeAndContinueBtn() {
        return this.page.locator(":text('Remove and Continue with Other Invoices')");
    }

    get closeBtn() {
        return this.page.locator("button:has-text('Close')");
    }

    get handoverInvoicesBtn() {
        return this.page.locator("//button[normalize-space()='Handover Invoices']");
    }

    get loaderOverlay() {
        return this.page.locator('#loader.show');
    }

    /**
     * Clicks the Handover Invoices tab. The app renders a full-screen #loader.show
     * overlay after assignment that intercepts pointer events — without waiting for it
     * to clear, Playwright keeps retrying the click until the test timeout (the same
     * class of bug fixed for Delivery Allocation). Wait for the loader to hide first.
     */
    async clickHandoverInvoices() {
        await this.loaderOverlay.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
        await this.handoverInvoicesBtn.waitFor({ state: 'visible', timeout: 15000 });
        await this.handoverInvoicesBtn.click({ timeout: 15000 });
    }


    get someInvoicesCannotBeAssignedModal() {
        return this.page.locator(":text('Some invoices cannot be assigned')");
    }

    get someInvoicesCancelBtn() {
        return this.page.locator(":text('Cancel')");
    }

    get someInvoicesModalContainer() {
        return this.page
            .locator('.ant-modal-content')
            .filter({ hasText: 'Some invoices cannot be assigned' });
    }

    /**
     * Reads the INVOICE NUMBER column (first cell of each data row) from the
     * "Some invoices cannot be assigned" modal. Returns [] if the modal is not shown.
     * These invoices are blocked because they're still pending cashier verification.
     */
    async extractUnassignableInvoices(timeoutMs = 3000) {
        try {
            await this.someInvoicesCannotBeAssignedModal.first().waitFor({ state: 'visible', timeout: timeoutMs });
        } catch {
            console.log('"Some invoices cannot be assigned" modal not shown — no invoices to extract.');
            return [];
        }
        const firstCells = this.someInvoicesModalContainer.first().locator('tbody tr td:first-child');
        const count = await firstCells.count();
        const invoices = [];
        for (let i = 0; i < count; i++) {
            const text = (await firstCells.nth(i).innerText()).trim();
            if (text) invoices.push(text);
        }
        console.log(`Extracted ${invoices.length} unassignable invoice(s): ${invoices.join(', ') || '(none)'}`);
        return invoices;
    }

    async clickCancelIfSomeInvoicesCannotBeAssigned(timeoutMs = 2000) {
        try {
            await this.someInvoicesCannotBeAssignedModal.first().waitFor({ state: 'visible', timeout: timeoutMs });
            await this.someInvoicesCancelBtn.first().click();
            console.log('"Some invoices cannot be assigned" modal appeared — Cancel clicked.');
            return true;
        } catch {
            console.log('"Some invoices cannot be assigned" modal not shown — skipping.');
            return false;
        }
    }

    get pendingFinancialAdjustmentModal() {
        return this.page.locator(":text('Pending Financial Adjustment')");
    }

    get pendingFinancialAdjustmentCloseBtn() {
        return this.page
            .locator(".ant-modal:has-text('Pending Financial Adjustment')")
            .locator("button:has-text('Close')");
    }

    async isPendingFinancialAdjustmentVisible(timeoutMs = 2000) {
        try {
            await this.pendingFinancialAdjustmentModal.first().waitFor({ state: 'visible', timeout: timeoutMs });
            return true;
        } catch {
            return false;
        }
    }

    async clickRemoveAndContinueIfVisible(timeoutMs = 3000) {
        try {
            await this.removeAndContinueBtn.first().waitFor({ state: 'visible', timeout: timeoutMs });
            await this.removeAndContinueBtn.first().click();
            console.log('"Remove and Continue with Other Invoices" appeared — clicked.');
            return true;
        } catch {
            console.log('"Remove and Continue with Other Invoices" not shown — skipping.');
            return false;
        }
    }

    invoiceCheckbox(invoiceNo) {
        return this.page.locator(
            `//tr[td[7][contains(., '${invoiceNo}')]]//td[1]//input[@type='checkbox']`
        );
    }

    async selectInvoiceCheckboxes(invoices) {
        const selected = [];
        const skipped = [];
        for (const invoice of invoices) {
            await this.searchInvoice(invoice);
            const checkbox = this.invoiceCheckbox(invoice);
            if (await checkbox.count() > 0) {
                await checkbox.first().click();
                selected.push(invoice);
                await this.page.waitForTimeout(300);
            } else {
                skipped.push(invoice);
                console.log(`Skipped (not on filtered page): ${invoice}`);
            }
        }
        console.log(`Selected: ${selected.join(', ') || '(none)'}`);
        console.log(`Skipped:  ${skipped.join(', ') || '(none)'}`);
        return { selected, skipped };
    }
}
