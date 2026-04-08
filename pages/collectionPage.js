export class CollectionPage {
    constructor(page) {
        this.page = page;

        this.mobileInput = this.page.locator("input[name='phone']");
        this.pinInput = this.page.locator('#pin');
        this.submitBtn = this.page.locator('#form-submit');
        this.downArrow = this.page.locator("//img[@alt='downArrow']");
        this.cash = this.page.locator('#cash');
        this.chequeAmount = this.page.locator('#chequeData\\[0\\]\\.amount');
        this.chequeRefNumber = this.page.locator('#chequeData\\[0\\]\\.reference_number');
        this.chequeBankId = this.page.locator('#chequeData\\[0\\]\\.bank_id');
        this.bankOfBaroda = this.page.locator("//div[@title='Bank of Baroda']");
        this.chequeDueDate = this.page.locator('#chequeData\\[0\\]\\.due_date');
        this.todayLink = this.page.locator("//a[normalize-space()='Today']");
        this.scanQRBtn = this.page.locator('button').filter({ hasText: 'Scan QR' }).first();
        this.amountInput = this.page.locator("//input[@placeholder='₹']");
        this.addManuallyHere = this.page.locator(":text-is('Add Manually here')");
        this.referenceNumberInput = this.page.locator("//input[@placeholder='Enter reference number(minimum 12 characters)']");
        this.addManually = this.page.locator(":text('Add manually')");
        this.submitDiv = this.page.locator("//div[contains(text(),'Submit')]");
        this.neftAmount = this.page.locator("input[name='neftData[0].amount']");
        this.neftRefNumber = this.page.locator("[name='neftData[0].reference_number']");
        this.autoDiv = this.page.locator("//div[contains(text(),'Auto')]");
        this.splitReason = this.page.locator('#splitInvoices\\[0\\]\\.reason');
        this.shopClosedOption = this.page.locator("//div[contains(text(),'Shop Permanently Closed')]");
        this.submitBtn2 = this.page.locator("button[type='submit']");
        this.submitCollection = this.page.locator(":text('Submit Collection')");
        
    }

    async navigate() { await this.page.goto('https://collection-preprod.ripplr.in/login'); }
    async fillMobile() { await this.mobileInput.fill('9739492646'); }
    async fillPin() { await this.pinInput.fill('1234'); }
    async clickSubmit() { await this.submitBtn.click(); }
    async clickDownArrow() { await this.downArrow.click(); }
    async clickCash() { await this.cash.click(); }
    async fillCash(amount) { await this.cash.fill(amount); }
    async fillChequeAmount(amount) { await this.chequeAmount.fill(amount); }
    async fillChequeRefNumber() {
        const refNumber = Math.floor(100000 + Math.random() * 900000).toString();
        await this.chequeRefNumber.fill(refNumber);
    }
    async clickChequeBankId() { await this.chequeBankId.click(); }
    async selectBankOfBaroda() { await this.bankOfBaroda.click(); }
    async clickChequeDueDate() { await this.chequeDueDate.click(); }
    async clickToday() { await this.todayLink.click(); }
    async clickScanQR() { await this.scanQRBtn.click(); }
    async fillAmount() { await this.amountInput.fill('3'); }
    async clickAddManuallyHere() { await this.addManuallyHere.click(); }
    async fillReferenceNumber() {
        const refNumber = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
        await this.referenceNumberInput.fill(refNumber);
    }
    async clickAddManually() { await this.addManually.click(); }
    async clickSubmitDiv() { await this.submitDiv.click(); }
    async fillNeftAmount() { await this.neftAmount.fill('4'); }
    async fillNeftRefNumber() {
        const refNumber = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        await this.neftRefNumber.fill(refNumber);
    }
    async clickAuto() { await this.autoDiv.click(); }
    async clickSplitReason() { await this.splitReason.click(); }
    async selectShopClosed() { await this.shopClosedOption.click(); }
    async clickSubmitBtn2() { await this.submitBtn2.click(); }
    async clickSubmitCollection() { await this.submitCollection.click(); }

}
