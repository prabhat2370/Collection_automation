import { SEG } from '../config/testData.js';
import { firstOBCData } from '../utils/excelReader.js';

export class SegVerificationPage {
    constructor(page) {
        this.page = page;

        const { salesman } = firstOBCData;

        this.verificationLink = this.page.locator("//a[normalize-space()='Verification']");
        this.salesmanRow = this.page.locator(`//tr[td[2][contains(., '${salesman}')]]//td[15]//div[@cursor='pointer']`);
        this.startVerificationBtn = this.page.locator(":text-is('Start Verification')");
        this.greenTick = this.page.locator("img[alt='greenTick']");
        this.redClose = this.page.locator("img[alt='redClose']");
        this.addReasonBtn = this.page.locator("//span[normalize-space()='Add Reason']");
        this.dataCorrectionOption = this.page.locator("//span[normalize-space()='Data Correction']");
        this.addBtn = this.page.locator(":text-is('Add')");
        this.saveBtn = this.page.locator(":text('Save')");
    }

    async clickVerification() { await this.verificationLink.click(); }
    async clickSalesmanRow() { await this.salesmanRow.click(); }
    async clickStartVerification() { await this.startVerificationBtn.click(); }

    async runFlow() {
        if (SEG.verificationMode === 'V') {
            await this.greenTick.click();
            await this.saveBtn.click();
        } else {
            await this.redClose.click();
            await this.addReasonBtn.click();
            await this.dataCorrectionOption.click();
            await this.addBtn.click();
            await this.saveBtn.click();
        }
    }
}
