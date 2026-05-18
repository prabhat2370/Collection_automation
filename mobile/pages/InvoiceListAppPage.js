import { BaseAppPage } from './BaseAppPage.js';
import { LOCATORS } from '../utils/locators.js';

export class InvoiceListAppPage extends BaseAppPage {
    async searchInvoice(invoiceNo) {
        await this.waitAndFill(LOCATORS.invoiceList.searchInput, invoiceNo);
        await this.hideKeyboard();
    }

    async openInvoice(invoiceNo) {
        await this.waitAndClick(LOCATORS.invoiceList.invoiceRow(invoiceNo));
    }

    async navigateToInvoice(invoiceNo) {
        const row = await $(LOCATORS.invoiceList.invoiceRow(invoiceNo));
        const visible = await row.isDisplayed().catch(() => false);
        if (!visible) {
            await this.searchInvoice(invoiceNo);
            await this.pause(1500);
        }
        await this.openInvoice(invoiceNo);
    }
}
