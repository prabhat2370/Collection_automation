import { firstOBCData } from '../utils/excelReader.js';
import { PAYMENT_MODES } from '../config/testData.js';
import { insertBankStatement } from '../utils/dbHelper.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function getCollectionRefs() {
    const file = resolve(process.cwd(), 'utils/collectionRefs.json');
    if (!existsSync(file)) throw new Error('collectionRefs.json not found — run collection test first');
    return JSON.parse(readFileSync(file));
}

export class CashVerificationPage {
    constructor(page) {
        this.page = page;

        const { salesman } = firstOBCData;

        this.collectionSettlementLink = this.page.locator("//a[normalize-space()='Collection Settlement']");
        this.salesmanSettle = this.page.locator(`//tr[td[1][contains(., '${salesman}')]]//td[10]//div[@cursor='pointer']`);
        this.startVerification = this.page.locator(":text-is('Start Verification')");
        this.cashGreenTick = this.page.locator("//img[@alt='greenTick']");
        this.cashRedClose = this.page.locator("img[alt='redClose']");
        this.addReasonBtn = this.page.locator("//span[normalize-space()='Add Reason']");
        this.commentInput = this.page.locator("//input[@placeholder='Type your comment here...']");
        this.addBtn = this.page.locator(":text-is('Add')");
        this.saveBtn = this.page.locator(":text('Save')");
        this.bothBtn = this.page.locator(":text-is('Both')");
        this.submitBtn = this.page.locator(":text('Submit')");
    }

    async clickCollectionSettlement() { await this.collectionSettlementLink.click(); }
    async clickSalesmanSettle() { await this.salesmanSettle.click(); }
    async clickStartVerification() { await this.startVerification.click(); }

    // Wait for page to settle and loader to hide before interacting
    async waitForLoader() {
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        const loader = this.page.locator('#loader.show');
        if (await loader.isVisible().catch(() => false)) {
            await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        }
    }

    async runCashFlow() {
        const mode = PAYMENT_MODES.cash;
        if (mode === 'V') {
            await this.waitForLoader();
            await this.cashGreenTick.click({ force: true });
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.cashRedClose.click({ force: true });
            await this.addReasonBtn.click();
            await this.commentInput.fill('REJECT');
            await this.addBtn.click();
            await this.saveBtn.click();
        }
        // NA = skip
    }

    async runUPIInsert() {
        const { upi } = getCollectionRefs();
        await insertBankStatement('UPI', upi.refNumber, upi.amount);
    }

    async runNEFTInsert() {
        const { neft } = getCollectionRefs();
        await insertBankStatement('NEFT', neft.refNumber, neft.amount);
    }

    async runUPIFlow() {
        const mode = PAYMENT_MODES.upi;
        if (mode === 'V') {
            await this.waitForLoader();
            await this.cashGreenTick.click({ force: true });
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.cashRedClose.click({ force: true });
            await this.bothBtn.click();
            await this.submitBtn.click();
            await this.saveBtn.click();
        }
        // NA = skip
    }

    async runNEFTFlow() {
        const mode = PAYMENT_MODES.neft;
        if (mode === 'V') {
            await this.waitForLoader();
            await this.cashGreenTick.click({ force: true });
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.cashRedClose.click({ force: true });
            await this.bothBtn.click();
            await this.submitBtn.click();
            await this.saveBtn.click();
        }
        // NA = skip
    }

    async runChequeFlow() {
        const mode = PAYMENT_MODES.cheque;
        if (mode === 'V') {
            await this.waitForLoader();
            await this.cashGreenTick.click({ force: true });
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.cashRedClose.click({ force: true });
            await this.addReasonBtn.click();
            await this.commentInput.fill('REJECT');
            await this.addBtn.click();
            await this.saveBtn.click();
        }
        // NA = skip
    }
}
