import { firstOBCData } from '../../utils/excelReader.js';
import { PAYMENT_MODES } from '../../test-data/cashier.js';
import { SEG } from '../../test-data/seg.js';
import { DELIVERY } from '../../test-data/deliveryAllocation.js';
import { insertBankStatement } from '../../utils/dbHelper.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function getCollectionRefs() {
    const file = resolve(process.cwd(), 'test-data/runtime/collectionRefs.json');
    if (!existsSync(file)) throw new Error('collectionRefs.json not found — run collection test first');
    return JSON.parse(readFileSync(file));
}

function getSOInvoices() {
    const file = resolve(process.cwd(), 'test-data/runtime/soInvoices.json');
    if (!existsSync(file)) throw new Error('soInvoices.json not found — run SO upload test first');
    return JSON.parse(readFileSync(file));
}

export class CashVerificationPage {
    constructor(page) {
        this.page = page;

        const { salesman } = firstOBCData;

        this.collectionSettlementLink = this.page.locator("//a[normalize-space()='Collection Settlement']");
        this.delivererTab = this.page.locator(":text('Deliverer')");
        this.salesmanSettle = this.page.locator(`//tr[td[1][contains(., '${salesman}')]]//td[10]//div[@cursor='pointer']`);
        this.deliveryRow = this.page.locator(`//tr[td[contains(., '${DELIVERY.vehicleNo}')]]//td[12]//div[@cursor='pointer']`);
        this.startVerification = this.page.locator(":text('Start Verification')");
        this.cashGreenTick = this.page.locator("//img[@alt='greenTick']");
        this.cashRedClose = this.page.locator("img[alt='redClose']");
        this.addReasonBtn = this.page.locator("//span[normalize-space()='Add Reason']");
        this.commentInput = this.page.locator("//input[@placeholder='Type your comment here...']");
        this.addBtn = this.page.locator(":text-is('Add')");
        this.saveBtn = this.page.locator(":text('Save')");
        this.bothBtn = this.page.locator(":text-is('Both')");
        this.submitBtn = this.page.locator(":text('Submit')");
        this.verifyBtn = this.page.locator(":text('Verify')");
        // Step tab "NEFT" in the verification wizard (first match = the step header,
        // before the "NEFT ₹.." summary entry lower on the page).
        this.neftTab = this.page.getByText('NEFT', { exact: true }).first();
    }

    async clickNEFTTab() { await this.neftTab.click({ force: true }); }

    // Checkbox in the invoice row matching the given SO invoice number.
    invoiceCheckbox(invoiceNo) {
        return this.page.locator(`//tr[td[normalize-space()='${invoiceNo}']]//input[@type='checkbox']`);
    }

    async clickCollectionSettlement() { await this.collectionSettlementLink.click(); }
    async clickDeliverer() { await this.delivererTab.click(); }
    async clickSalesmanSettle() { await this.salesmanSettle.click(); }
    async clickDeliveryRow() { await this.deliveryRow.click(); }
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
            await this.page.waitForTimeout(1000);
            await this.cashGreenTick.click({ force: true });
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.page.waitForTimeout(1000);
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
            await this.page.waitForTimeout(1000);
            await this.cashGreenTick.click({ force: true });
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.page.waitForTimeout(1000);
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
            await this.page.waitForTimeout(1000);
            if (SEG.verificationType === 'D') {
                // RFC delivery verification: green tick does not work here. The cash/cheque/upi
                // steps are skipped in 'D' mode, so the wizard is still on the Cash tab — move to
                // the NEFT tab, select the invoice checkbox(es) from soInvoices.json, then Verify.
                await this.clickNEFTTab();
                await this.waitForLoader();
            await this.page.waitForTimeout(1000);
                const invoices = getSOInvoices();
                for (const inv of invoices) {
                    const cb = this.invoiceCheckbox(inv);
                    await cb.waitFor({ state: 'attached', timeout: 15000 });
                    await cb.check({ force: true });
                }
                await this.verifyBtn.click();
            } else {
                await this.cashGreenTick.click({ force: true });
                await this.saveBtn.click();
            }
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.page.waitForTimeout(1000);
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
            await this.page.waitForTimeout(1000);
            await this.cashGreenTick.click({ force: true });
            await this.saveBtn.click();
        } else if (mode === 'R') {
            await this.waitForLoader();
            await this.page.waitForTimeout(1000);
            await this.cashRedClose.click({ force: true });
            await this.bothBtn.click();
            await this.submitBtn.click();
            await this.saveBtn.click();
        }
        // NA = skip
    }
}
