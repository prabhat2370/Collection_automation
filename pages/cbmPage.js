import { CHEQUE_BOUNCE } from '../config/testData.js';

export class ChequeBouncePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // ── Sidebar navigation ────────────────────────────────────────────────
        this.chequeBounceMenu = this.page.locator(
            "//span[@class='ant-menu-title-content' and normalize-space()='Cheque Bounce']"
        );
        this.chequeBounceList = this.page.locator(
            "//span[@class='ant-menu-title-content']//a[normalize-space()='Cheque Bounce List']"
        );
        this.summaryMenu = this.page.locator(
            "//span[@class='ant-menu-title-content']//a[normalize-space()='Summary']"
        );

        // ── Add Cheque Bounce page ────────────────────────────────────────────
        this.addChequeBounceBtn = this.page.locator("a[href='/cheque-bounce/add-cheque-bounce']");
        this.chequeNumberInput  = this.page.locator("[name='cheque_number']");
        this.invoiceMappingBtn  = this.page.locator(":text('Invoice Mapping')");

        // ── Invoice Mapping — FC checkbox row ────────────────────────────────
        this.fcCheckbox = this.page.locator(
            `//tr[td[2][contains(., '${CHEQUE_BOUNCE.fcText}')]]//td[1]//input[@type='checkbox']`
        );
        this.submitAndAddMoreBtn = this.page.locator(":text('Submit and Close')");
        this.yesBtn              = this.page.locator(":text('Yes')");

        // ── Cashier navigation ────────────────────────────────────────────────
        this.markBounceLink = this.page.locator(
            "//span[@class='ant-menu-title-content']//a[normalize-space()='Mark Bounce']"
        );

        // ── Mark Bounce table ─────────────────────────────────────────────────
        this.chequeRowImg = this.page.locator(
            `//tr[td[normalize-space()='${CHEQUE_BOUNCE.chequeBounceNo}']]//img`
        );

        // ── Mark Bounce form ──────────────────────────────────────────────────
        this.cbmReasonOption = this.page.locator(":text('Signature Difference')");
        this.docUploadInput  = this.page.locator('input[type="file"]');
        this.submitBtn       = this.page.locator(":text('Submit')");

        // ── Handover tab ──────────────────────────────────────────────────────
        this.handoverTab = this.page.getByRole('tab', { name: /Handover Bounce/ });
        this.handoverPanel = this.page.getByRole('tabpanel', { name: /Handover Bounce/ });

        // ── Handover table — row actions for the cheque number ────────────────
        this.handoverRowExpand = this.page.locator(
            `//tr[td[2][contains(., '${CHEQUE_BOUNCE.chequeBounceNo}')]]//button[contains(@class,'ant-table-row-expand-icon')]`
        );
        this.handoverRowEye = this.page.locator(
            `//tr[td[2][contains(., '${CHEQUE_BOUNCE.chequeBounceNo}')]]//td[10]//img`
        );
        this.handoverActionImgRow = () => this.handoverPanel.locator('tbody tr').filter({
            hasText: CHEQUE_BOUNCE.chequeBounceNo
        }).first();

        // ── Assign Cheque modal ───────────────────────────────────────────────
        this.chooseSegregatorSelect = this.page.locator('.ant-select-selector').filter({
            has: this.page.locator(":text('Choose Segregator')")
        });
        this.segregatorOption    = this.page.locator(":text('Segregator BTML (8888888884)')");
        this.assignChequeBtn     = this.page.locator(":text('Assign Cheque')");
        this.modalCloseBtn       = this.page.locator(":text('Close')");
        this.acknowledgeNowBtn      = this.page.locator(":text('Acknowledge Now')");
        this.confirmYesBtn          = this.page.locator(":text('Yes')").first();
        this.submitBtn2             = this.page.locator(":text('Submit')");
        this.chooseOfficerSelect    = this.page.locator('.ant-select-selector').filter({
            has: this.page.locator(":text('Choose Officer')")
        });
        this.officerOption          = this.page.locator(`:text('${CHEQUE_BOUNCE.salesOfficerName} (${CHEQUE_BOUNCE.salesOfficerMobile})')`);
        this.assignChequeBtn2       = this.page.locator("//button[normalize-space()='Assign Cheque']");
        this.summaryActionSvg    = this.page.locator(
            `//tbody/tr[td[2][contains(., '${CHEQUE_BOUNCE.chequeBounceNo}')]]/td[12]/div[1]//*[name()='svg'][1]`
        );
    }

    async waitForLoader() {
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        const loader = this.page.locator('#loader.show');
        if (await loader.isVisible().catch(() => false)) {
            await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        }
    }

    async clickChequeBounceMenu()    { await this.chequeBounceMenu.click(); }
    async clickChequeBounceList()    { await this.chequeBounceList.click(); }
    async clickSummaryMenu() {
        const origin = new URL(this.page.url()).origin;
        await this.page.goto(`${origin}/cheque-bounce/summary`);
        await this.waitForLoader();
    }
    async clickAddChequeBounce()     { await this.waitForLoader(); await this.addChequeBounceBtn.click(); }
    async fillChequeNumber(no)       { await this.chequeNumberInput.fill(no); }
    async clickInvoiceMapping()      { await this.invoiceMappingBtn.click(); }
    async clickFCCheckbox()          { await this.waitForLoader(); await this.fcCheckbox.click(); }
    async clickSubmitAndClose()      { await this.submitAndAddMoreBtn.click(); }
    async clickYes()                 { await this.yesBtn.click(); }
    async clickChequeRowImg()        { await this.waitForLoader(); await this.chequeRowImg.click(); }

    async clickCBMReason()           { await this.cbmReasonOption.click(); }
    async uploadDocuments(files)     { await this.docUploadInput.setInputFiles(files); }
    async clickSubmit()              { await this.submitBtn.click(); }
    async clickHandoverTab() {
        await this.handoverTab.click();
        await this.handoverPanel.waitFor({ state: 'visible', timeout: 10000 });
    }
    async clickHandoverRowExpand()   { await this.waitForLoader(); await this.handoverRowExpand.click(); }
    async clickHandoverRowEye()      { await this.waitForLoader(); await this.handoverRowEye.click(); }
    async clickHandoverActionImg() {
        await this.handoverPanel.waitFor({ state: 'visible', timeout: 10000 });
        const row = this.handoverActionImgRow();
        await row.waitFor({ state: 'visible', timeout: 10000 });
        await row.hover();
        // Actions column (td[8]) uses a styled div, not an img tag
        await row.locator('td').nth(8).locator('[style*="cursor: pointer"]').click();
    }

    async clickChooseSegregator() { await this.chooseSegregatorSelect.click(); }
    async clickSegregatorOption()  { await this.segregatorOption.click(); }
    async clickAssignCheque()      { await this.assignChequeBtn.click(); }
    async clickModalClose() {
        await this.waitForLoader();
        await this.modalCloseBtn.click({ timeout: 10000 }).catch(() => {});
    }
    async clickAcknowledgeNow()    { await this.acknowledgeNowBtn.click(); }
    async clickSummaryActionSvg()  { await this.summaryActionSvg.click(); }
    async clickChooseOfficer()     { await this.chooseOfficerSelect.click(); }
    async clickOfficerOption()     { await this.officerOption.click(); }
    async clickAssignCheque2()     { await this.assignChequeBtn2.click(); }
    async clickConfirmYes()        { await this.confirmYesBtn.click(); }
    async clickSubmit2()           { await this.submitBtn2.click(); }

    async clickMarkBounce() {
        const origin = new URL(this.page.url()).origin;
        await this.page.goto(`${origin}/cheque-bounce/cheque-bounce-form`);
        await this.waitForLoader();
    }
}
