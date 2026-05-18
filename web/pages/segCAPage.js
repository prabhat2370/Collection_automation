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
    }

    salesmanOption(mobile) {
        return this.page.getByText(`(${mobile})`);
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


    get someInvoicesCannotBeAssignedModal() {
        return this.page.locator(":text('Some invoices cannot be assigned')");
    }

    get someInvoicesCancelBtn() {
        return this.page.locator(":text('Cancel')");
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
            const checkbox = this.invoiceCheckbox(invoice);
            if (await checkbox.count() > 0) {
                await checkbox.first().click();
                selected.push(invoice);
                await this.page.waitForTimeout(300);
            } else {
                skipped.push(invoice);
            }
        }
        console.log(`Selected: ${selected.join(', ') || '(none)'}`);
        console.log(`Skipped:  ${skipped.join(', ') || '(none)'}`);
        return { selected, skipped };
    }
}
