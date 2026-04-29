import { CHEQUE_BOUNCE, CBM_SEG } from '../config/testData.js';

export class CbmSegVerificationPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        this.chequeBounceMenu = this.page.locator(
            "//span[@class='ant-menu-title-content' and normalize-space()='Cheque Bounce']"
        );
        this.verificationLink = this.page.locator("a[href='/cheque-bounce/verification-list']");

        this.readyForVerificationBtn = this.page.locator(
            `//tr[td[2][contains(., '${CHEQUE_BOUNCE.salesOfficerMobile}')]]//td[6]//div`
        );

        // ── Verification Details page ─────────────────────────────────────────
        this.verifyBtn = this.page.getByRole('button', { name: 'check' }).first();
        this.rejectBtn = this.page.getByRole('button', { name: 'close' }).first();
        this.saveBtn   = this.page.locator(":text('Save')");
    }

    async waitForLoader() {
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        const loader = this.page.locator('#loader.show');
        if (await loader.isVisible().catch(() => false)) {
            await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        }
    }

    async clickChequeBounceMenu() { await this.waitForLoader(); await this.chequeBounceMenu.click(); }
    async clickVerification() {
        const origin = new URL(this.page.url()).origin;
        await this.page.goto(`${origin}/cheque-bounce/verification-list`);
        await this.waitForLoader();
    }
    async clickReadyForVerification() { await this.waitForLoader(); await this.readyForVerificationBtn.click(); }
    async clickVerifyBtn()            { await this.verifyBtn.click(); }
    async clickRejectBtn()            { await this.rejectBtn.click(); }
    async clickSave()                 { await this.saveBtn.click(); }

    async runFlow() {
        await this.waitForLoader();
        if (CBM_SEG.verificationMode === 'V') {
            await this.verifyBtn.click();
        } else {
            await this.rejectBtn.click();
        }
        await this.waitForLoader();
        await this.saveBtn.click();
    }
}
