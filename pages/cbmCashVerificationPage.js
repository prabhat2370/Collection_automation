import { CHEQUE_BOUNCE, CBM_COLLECTION } from '../config/testData.js';
import { insertBankStatement } from '../utils/dbHelper.js';

export class CbmCashVerificationPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        this.chequeBounceMenu = this.page.locator(
            "//span[@class='ant-menu-title-content' and normalize-space()='Cheque Bounce']"
        );
        this.chequeBounceRecoveryLink = this.page.locator("div").filter({ hasText: "Bounce Recovery Verification" }).last();

        this.readyForVerificationBtn = this.page.locator(
            `//tr[td[2][contains(., '${CHEQUE_BOUNCE.salesOfficerMobile}')]]//td[6]//div`
        );
        this.startVerificationBtn = this.page.locator(":text('Start Verification')");

        // ── Verification locators (same as cashVerificationPage) ─────────────
        this.cashGreenTick  = this.page.locator("//img[@alt='greenTick']");
        this.cashRedClose   = this.page.locator("img[alt='redClose']");
        this.addReasonBtn   = this.page.locator("//span[normalize-space()='Add Reason']");
        this.commentInput   = this.page.locator("//input[@placeholder='Type your comment here...']");
        this.addBtn         = this.page.locator(":text-is('Add')");
        this.saveBtn        = this.page.locator(":text('Save')");
        this.bothBtn        = this.page.locator(":text-is('Both')");
        this.submitBtn      = this.page.locator(":text('Submit')");
    }

    async waitForLoader() {
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        const loader = this.page.locator('#loader.show');
        if (await loader.isVisible().catch(() => false)) {
            await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        }
    }

    async clickChequeBounceMenu()     { await this.waitForLoader(); await this.chequeBounceMenu.click(); }
    async clickChequeBounceRecovery() { await this.chequeBounceRecoveryLink.click(); }
    async clickReadyForVerification() { await this.waitForLoader(); await this.readyForVerificationBtn.click(); }
    async clickStartVerification()    { await this.startVerificationBtn.click(); }

    async runCashFlow() {
        const mode = CBM_COLLECTION.cash.mode;
        if (mode === 'V') {
            await this.waitForLoader();
            await this.cashGreenTick.click();
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.cashRedClose.click();
            await this.addReasonBtn.click();
            await this.commentInput.fill('REJECT');
            await this.addBtn.click();
            await this.saveBtn.click();
        }
        // NA = skip
    }

    async runChequeFlow() {
        const mode = CBM_COLLECTION.cheque.mode;
        if (mode === 'V') {
            await this.waitForLoader();
            await this.cashGreenTick.click();
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.cashRedClose.click();
            await this.bothBtn.click();
            await this.submitBtn.click();
            await this.saveBtn.click();
        }
        // NA = skip
    }

    async runUPIFlow() {
        const mode = CBM_COLLECTION.upi.mode;
        if (mode === 'V') {
            await this.waitForLoader();
            await this.cashGreenTick.click();
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.cashRedClose.click();
            await this.bothBtn.click();
            await this.submitBtn.click();
            await this.saveBtn.click();
        }
        // NA = skip
    }

    async runNEFTFlow() {
        const mode = CBM_COLLECTION.neft.mode;
        if (mode === 'V') {
            await this.waitForLoader();
            await this.cashGreenTick.click();
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.cashRedClose.click();
            await this.bothBtn.click();
            await this.submitBtn.click();
            await this.saveBtn.click();
        }
        // NA = skip
    }

    async runUPIInsert() {
        const { refNo, amount } = CBM_COLLECTION.upi;
        await insertBankStatement('UPI', refNo, amount);
    }

    async runNEFTInsert() {
        const { refNo, amount } = CBM_COLLECTION.neft;
        await insertBankStatement('NEFT', refNo, amount);
    }
}
