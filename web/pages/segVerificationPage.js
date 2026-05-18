import { SEG } from '../../test-data/seg.js';
import { DELIVERY } from '../../test-data/deliveryAllocation.js';
import { firstOBCData } from '../../utils/excelReader.js';

export class SegVerificationPage {
    constructor(page) {
        this.page = page;

        const { salesman } = firstOBCData;

        this.verificationLink = this.page.locator("//a[normalize-space()='Verification']");
        this.delivererTab = this.page.locator(":text('Deliverer')");
        this.salesmanRow = this.page.locator(`//tr[td[2][contains(., '${salesman}')]]//td[15]//div[@cursor='pointer']`);
        this.deliveryRow = this.page.locator(`//tr[td[contains(., '${DELIVERY.vehicleNo}')]]//td[17]//div[@cursor='pointer']`);
        this.startVerificationBtn = this.page.locator(":text-is('Start Verification')");
        this.greenTick = this.page.locator("img[alt='greenTick']");
        this.redClose = this.page.locator("img[alt='redClose']");
        this.addReasonBtn = this.page.getByRole('button', { name: 'Add Reason' });
        this.dataCorrectionOption = this.page.getByRole('dialog').getByText('Data Correction');
        this.addBtn = this.page.getByRole('button', { name: 'Add', exact: true });
        this.saveBtn = this.page.locator(":text('Save')");
    }

    async clickVerification() { await this.verificationLink.click(); }
    async clickDeliverer() { await this.delivererTab.click(); }
    async clickSalesmanRow() { await this.salesmanRow.click(); }
    async clickDeliveryRow() { await this.deliveryRow.click(); }
    async clickStartVerification() { await this.startVerificationBtn.click(); }

    async runFlow() {
        if (SEG.verificationMode === 'V') {
            await this.greenTick.first().waitFor({ state: 'visible', timeout: 15000 });
            const total = await this.greenTick.count();
            let clicked = 0;
            for (let i = 0; i < total; i++) {
                const tick = this.greenTick.nth(i);
                const src = await tick.getAttribute('src').catch(() => '');
                if (src && src.includes('fill')) {
                    console.log(`[SegVerification] Invoice ${i + 1} already verified, skipping`);
                    continue;
                }
                await tick.click();
                await this.page.waitForTimeout(500);
                clicked++;
            }
            console.log(`[SegVerification] Verified ${clicked} of ${total} invoice(s)`);
            await this.saveBtn.click();
        } else {
            await this.redClose.first().waitFor({ state: 'visible', timeout: 15000 });
            const total = await this.redClose.count();
            let clicked = 0;
            for (let i = 0; i < total; i++) {
                const close = this.redClose.nth(i);
                const src = await close.getAttribute('src').catch(() => '');
                if (src && src.includes('fill')) {
                    console.log(`[SegVerification] Invoice ${i + 1} already rejected, skipping`);
                    continue;
                }
                await close.click();
                await this.page.waitForTimeout(500);
                await this.addReasonBtn.click();
                await this.page.waitForTimeout(500);
                await this.dataCorrectionOption.click();
                await this.page.waitForTimeout(500);
                await this.addBtn.click();
                await this.page.waitForTimeout(500);
                clicked++;
            }
            console.log(`[SegVerification] Rejected ${clicked} of ${total} invoice(s)`);
            await this.saveBtn.click();
        }
    }
}
