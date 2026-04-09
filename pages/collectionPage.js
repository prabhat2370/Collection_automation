import { URLS, BANKS, CONFIRMATION } from '../config/testData.js';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const TEMP_FILE = resolve(process.cwd(), 'utils/collectionRefs.json');

// Clear file at module load time so each collection run starts fresh
writeFileSync(TEMP_FILE, JSON.stringify({}));

function saveRef(key, data) {
    const existing = existsSync(TEMP_FILE) ? JSON.parse(readFileSync(TEMP_FILE)) : {};
    existing[key] = data;
    writeFileSync(TEMP_FILE, JSON.stringify(existing, null, 2));
}

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
        this.chequeBankFallback = this.page.locator("div.ant-select-selector").nth(0);
        this.bankOfBaroda = (bankName) => this.page.locator(`//div[@title='${bankName}']`);
        this.chequeDueDate = this.page.locator('#chequeData\\[0\\]\\.due_date');
        this.todayLink = this.page.locator("//a[normalize-space()='Today']");
        this.scanQRBtn = this.page.locator('button').filter({ hasText: 'Scan QR' }).first();
        this.amountInput = this.page.locator("//input[@placeholder='₹']");
        this.addManuallyHere = this.page.locator(":text-is('Add Manually here')");
        this.referenceNumberInput = this.page.locator("//input[@placeholder='Enter reference number(minimum 12 characters)']");
        this.addManually = this.page.locator(":text('Add manually')");
        this.manualModeIcon = this.page.locator("//img[@alt='ManualMode']").first();
        this.updateRefInput = this.page.locator("input[placeholder='Enter reference number(minimum 12 characters)']");
        this.updateBtn = this.page.locator("//div[contains(text(),'Update')]");
        this.submitDiv = this.page.locator("//div[contains(text(),'Submit')]");
        this.neftAmount = this.page.locator("input[name='neftData[0].amount']");
        this.neftRefNumber = this.page.locator("[name='neftData[0].reference_number']");
        this.autoDiv = this.page.locator("//div[contains(text(),'Auto')]");
        this.splitReason = this.page.locator('#splitInvoices\\[0\\]\\.reason');
        this.shopClosedOption = this.page.locator("//div[contains(text(),'Shop Permanently Closed')]");
        this.finalSubmitBtn = this.page.locator("button[type='submit']");
        this.submitCollection = this.page.locator(":text('Submit Collection')");
        this.confirmationBtn = (answer) => this.page.getByRole('button', { name: answer, exact: true });
    }

    async navigate() { await this.page.goto(URLS.collection); }
    async fillMobile(mobile) { await this.mobileInput.fill(mobile); }
    async fillPin(pin) { await this.pinInput.fill(pin); }
    async clickSubmit() { await this.submitBtn.click(); }
    async clickDownArrow() { await this.downArrow.click(); }
    async fillCash(amount) { await this.cash.fill(amount); }
    async fillChequeAmount(amount) { await this.chequeAmount.fill(amount); }
    async fillChequeRefNumber() {
        const refNumber = Math.floor(100000 + Math.random() * 900000).toString();
        await this.chequeRefNumber.fill(refNumber);
    }
    async clickChequeBankId() {
        const isInteractable = await this.chequeBankId.evaluate(el => {
            const rect = el.getBoundingClientRect();
            const topEl = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
            return el === topEl || el.contains(topEl);
        });
        if (isInteractable) {
            await this.chequeBankId.click();
        } else {
            await this.chequeBankFallback.click();
        }
    }
    async selectRandomBank() {
        const randomBank = BANKS[Math.floor(Math.random() * BANKS.length)];
        await this.bankOfBaroda(randomBank).click();
    }
    async clickChequeDueDate() { await this.chequeDueDate.click(); }
    async clickToday() { await this.todayLink.click(); }
    async clickScanQR() { await this.scanQRBtn.click(); }
    async fillAmount(amount) { await this.amountInput.fill(amount); }
    async clickAddManuallyHere() { await this.addManuallyHere.click(); }
    async fillReferenceNumber() {
        const refNumber = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
        await this.referenceNumberInput.fill(refNumber);
    }
    async clickAddManually() { await this.addManually.click(); }
    async clickSubmitDiv() { await this.submitDiv.click(); }

    async handleUPIFlow(amount) {
        // Check if UPI row already has a saved entry by looking for the ManualMode icon inside UPI section
        const upiManualIcon = this.page.locator("//img[@alt='ManualMode']");
        const iconCount = await upiManualIcon.count();
        const upiAlreadyAdded = iconCount > 0;

        if (upiAlreadyAdded) {
            await upiManualIcon.first().click();
            await this.amountInput.first().clear();
            await this.amountInput.first().fill(amount);
            const refNumber = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
            await this.updateRefInput.first().clear();
            await this.updateRefInput.first().fill(refNumber);
            saveRef('upi', { refNumber, amount });
            await this.updateBtn.click();
        } else {
            await this.scanQRBtn.click();
            await this.amountInput.fill(amount);
            await this.addManuallyHere.click();
            const refNumber = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
            await this.referenceNumberInput.fill(refNumber);
            saveRef('upi', { refNumber, amount });
            await this.addManually.click();
            await this.submitDiv.click();
        }
    }
    async fillNeftAmount(amount) { await this.neftAmount.fill(amount); }
    async fillNeftRefNumber(amount) {
        const refNumber = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        await this.neftRefNumber.fill(refNumber);
        saveRef('neft', { refNumber, amount });
    }
    async clickAuto() { await this.autoDiv.click(); }
    async clickSplitReason() { await this.splitReason.click(); }
    async selectShopClosed() { await this.shopClosedOption.click(); }
    async clickFinalSubmit() { await this.finalSubmitBtn.click(); }
    async clickSubmitCollection() { await this.submitCollection.click(); }
    async clickConfirmation() { await this.confirmationBtn(CONFIRMATION.submitCollection).click(); }

}
