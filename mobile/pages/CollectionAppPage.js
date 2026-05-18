import { BaseAppPage } from './BaseAppPage.js';
import { LOCATORS } from '../utils/locators.js';
import { saveRef, genUpiRef, genNeftRef, genChequeRef } from '../utils/refsWriter.js';
import { BANKS } from '../../test-data/collection.js';

export class CollectionAppPage extends BaseAppPage {

    async ensurePaymentCollectionTab() {
        const tab = await $(LOCATORS.collection.paymentCollectionTab);
        if (!(await tab.isDisplayed().catch(() => false))) return;
        const isSelected = (await tab.getAttribute('selected')) === 'true';
        if (!isSelected) {
            await tab.click().catch(() => {});
            await browser.pause(1500);
        }
    }

    async goToInvoiceAdjustmentTab() {
        const tab = await $(LOCATORS.collection.invoiceAdjustmentTab);
        await tab.waitForDisplayed({ timeout: 15000 });
        await tab.click();
        await browser.pause(2000);
    }

    async fillCash(amount) {
        await this.typeIntoEditText(LOCATORS.collection.cashInput, amount);
    }

    /** Tap-by-bounds + keyboard typing — robust against Flutter EditText focus issues. */
    async typeIntoEditText(selector, value) {
        let bounds = null;
        for (let attempt = 0; attempt < 3 && !bounds; attempt++) {
            try {
                const el = await $(selector);
                await el.waitForExist({ timeout: 15000 });
                await browser.pause(500);
                const loc = await el.getLocation();
                const size = await el.getSize();
                bounds = {
                    x: Math.round(loc.x + size.width / 2),
                    y: Math.round(loc.y + size.height / 2),
                };
            } catch (e) {
                if (attempt === 2) throw e;
                await browser.pause(1000);
            }
        }
        await browser.execute('mobile: clickGesture', { x: bounds.x, y: bounds.y });
        await browser.pause(700);
        await browser.keys(String(value).split(''));
        await browser.pause(400);
        await this.hideKeyboard();
        await browser.pause(500);
    }

    /** Coordinate-based typing — bypasses element queries (use when Flutter unmounts EditTexts). */
    async typeAtCoords(x, y, value) {
        await browser.execute('mobile: clickGesture', { x, y });
        await browser.pause(800);
        await browser.keys(String(value).split(''));
        await browser.pause(400);
        await this.hideKeyboard();
        await browser.pause(500);
    }

    async clickProceedToAdjustment() {
        await this.waitAndClick(LOCATORS.collection.proceedToAdjustment);
    }

    async clickAddCheque() {
        await this.waitAndClick(LOCATORS.collection.addChequeBtn, 30000);
        await browser.pause(2000);
    }

    async fillChequeAmount(amount) {
        await this.typeIntoEditText(LOCATORS.collection.chequeAmount, amount);
    }

    async fillChequeRefNumber(amount) {
        const refNumber = genChequeRef();
        // Cheque Number field is at bounds [168,1019][912,1202] in the cheque modal.
        // Element query fails because Flutter unmounts off-keyboard fields, so tap by coordinates.
        await this.typeAtCoords(540, 1110, refNumber);
        saveRef('cheque', { refNumber, amount });
    }

    async clickChequeBankId() {
        await this.waitAndClick(LOCATORS.collection.chequeBankDropdown);
        await browser.pause(1500);
    }

    /**
     * Search for and select a bank by name in the bank picker.
     * The picker has a "Search bank by name" EditText at the top — typing into
     * it filters the list, then we click the matching Button.
     */
    async selectBankByName(bankName) {
        const search = await $('//android.widget.EditText');
        await search.waitForExist({ timeout: 10000 });
        await search.click();
        await browser.pause(500);
        // setValue sends the whole string in one ADB `input text` call.
        // browser.keys(split('')) wedges UiAutomator2 on space characters (W3C
        // actions encodes ' ' as empty value="" which never resolves).
        await search.setValue(bankName);
        await browser.pause(1500);
        await this.waitAndClick(LOCATORS.collection.chequeBankOption(bankName));
        await browser.pause(1500);
    }

    async selectRandomBank() {
        // Pick a known bank — picker is searchable so name match is deterministic.
        const bank = BANKS[Math.floor(Math.random() * BANKS.length)];
        await this.selectBankByName(bank);
    }

    async clickChequeDueDate() {
        await this.waitAndClick(LOCATORS.collection.chequeDueDate);
        await browser.pause(1500);
    }

    /** Tap OK on the date picker (uses today's date by default). */
    async clickDatePickerOk() {
        await this.waitAndClick(LOCATORS.collection.datePickerOkBtn);
        await browser.pause(1000);
    }

    async submitChequeForm() {
        const save = await $(LOCATORS.collection.chequeFormSaveBtn);
        await save.waitForDisplayed({ timeout: 10000 });
        await browser.waitUntil(
            async () => await save.isEnabled(),
            { timeout: 10000, timeoutMsg: 'Cheque form Save never became enabled' }
        );
        await save.click();
        await browser.pause(2000);
    }

    /** Full UPI flow: click Scan QR, tap "Add Manually", fill amount + ref, save. */
    async handleUPIFlow(amount) {
        await this.waitAndClick(LOCATORS.collection.scanQRBtn);
        await browser.pause(2000);
        await this.waitAndClick(LOCATORS.collection.addManuallyHere);
        await browser.pause(1500);
        await this.typeIntoEditText(LOCATORS.collection.upiAmount, amount);
        const refNumber = genUpiRef();
        await this.typeIntoEditText(LOCATORS.collection.upiRefNumber, refNumber);
        saveRef('upi', { refNumber, amount });
        await this.waitAndClick(LOCATORS.collection.upiSaveBtn);
        await browser.pause(1500);
    }

    async clickAddNeft() {
        await this.waitAndClick(LOCATORS.collection.addNeftBtn, 30000);
        await browser.pause(2000);
    }

    async fillNeftAmount(amount) {
        await this.typeIntoEditText(LOCATORS.collection.neftAmount, amount);
    }

    async fillNeftRefNumber(amount) {
        const refNumber = genNeftRef();
        // NEFT Ref Number field is the second EditText in the bottom-sheet — same layout as cheque.
        await this.typeAtCoords(540, 1110, refNumber);
        saveRef('neft', { refNumber, amount });
    }

    async submitNeftForm() {
        const save = await $(LOCATORS.collection.neftSaveBtn);
        await save.waitForDisplayed({ timeout: 10000 });
        await browser.waitUntil(
            async () => await save.isEnabled(),
            { timeout: 10000, timeoutMsg: 'NEFT form Save never became enabled' }
        );
        await save.click();
        await browser.pause(1500);
    }

    async clickAuto() {
        await this.waitAndClick(LOCATORS.collection.autoBtn);
    }

    async clickReason() {
        await this.waitAndClick(LOCATORS.collection.reasonBtn);
    }

    async clickSave() {
        const el = await $(LOCATORS.collection.saveBtn);
        await el.waitForDisplayed({ timeout: 15000 });
        await browser.waitUntil(
            async () => await el.isEnabled(),
            { timeout: 15000, timeoutMsg: 'Save button never became enabled' }
        );
        await el.click();
    }

    /**
     * Select a reason from the picker after clickReason().
     * Picker contents vary by app config — caller passes a substring of the
     * desired reason's content-desc (e.g. "Customer", "Shop Permanently Closed").
     */
    async selectReason(reasonText) {
        const selector = `//*[contains(@content-desc, "${reasonText}")]`;
        await this.scrollToText(reasonText).catch(() => {});
        await this.waitAndClick(selector);
    }

    async clickSplitReason() {
        await this.waitAndClick(LOCATORS.collection.splitReason);
    }

    async selectShopClosed() {
        await this.waitAndClick(LOCATORS.collection.shopClosedOption);
    }

    async clickFinalSubmit() {
        await this.waitAndClick(LOCATORS.collection.finalSubmitBtn);
    }

    async clickSubmitCollection() {
        await this.waitAndClick(LOCATORS.collection.submitCollectionDiv);
    }

    async clickConfirmation(answer) {
        await this.waitAndClick(LOCATORS.collection.confirmationBtn(answer));
    }
}
