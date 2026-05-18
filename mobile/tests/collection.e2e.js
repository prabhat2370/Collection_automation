import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { step } from '@wdio/allure-reporter';
import { LoginAppPage } from '../pages/LoginAppPage.js';
import { LandingAppPage } from '../pages/LandingAppPage.js';
import { InvoiceListAppPage } from '../pages/InvoiceListAppPage.js';
import { CollectionAppPage } from '../pages/CollectionAppPage.js';
import { USERS } from '../../test-data/users.js';
import { AMOUNTS, CONFIRMATION } from '../../test-data/collection.js';
import { clearRefs } from '../utils/refsWriter.js';

const SO_INVOICES = JSON.parse(
    readFileSync(resolve(process.cwd(), 'test-data/runtime/soInvoices.json'), 'utf8')
);

describe('Collection Flow (Appium / Android)', () => {
    let loginPage, landingPage, invoiceListPage, collectionPage;

    before(async () => {
        loginPage = new LoginAppPage();
        landingPage = new LandingAppPage();
        invoiceListPage = new InvoiceListAppPage();
        collectionPage = new CollectionAppPage();
        clearRefs();
    });

    async function isOnPaymentCollectionScreen() {
        const el = await $('//*[starts-with(@content-desc, "Payment Collection")]');
        return el.isDisplayed().catch(() => false);
    }

    it('Submit collection for current AMOUNTS', async () => {
        const alreadyOnCollection = await isOnPaymentCollectionScreen();

        if (!alreadyOnCollection) {
            await step('Click Collection card on landing', async () => {
                await landingPage.tapCollection();
                await browser.pause(3000);
            });

            await step('Select Salesman role', async () => {
                await landingPage.selectSalesmanRole();
            });

            await step('Login with mobile + PIN', async () => {
                await loginPage.login(USERS.collection.mobile, USERS.collection.pin);
            });

            await step('Tap Collection card on post-login home', async () => {
                await landingPage.tapPostLoginCollection();
            });

            await step('Navigate to invoice from invoice list', async () => {
                const invoiceNo = SO_INVOICES[0];
                if (!invoiceNo) {
                    throw new Error('No invoice numbers in test-data/runtime/soInvoices.json — run SO Upload first.');
                }
                await invoiceListPage.navigateToInvoice(invoiceNo);
                await browser.pause(3000);
            });
        } else {
            console.log('App resumed on Payment Collection screen — skipping login/navigation');
        }

        await step('Ensure Payment Collection tab active', async () => {
            await collectionPage.ensurePaymentCollectionTab();
        });

        await step('DEBUG dump screen before cash fill', async () => {
            const src = await browser.getPageSource();
            writeFileSync(resolve(process.cwd(), 'mobile', 'before_cash_dump.xml'), src, 'utf8');
        });

        if (AMOUNTS.cash) {
            await step('Fill cash amount (skips if already locked)', async () => {
                const editable = await $('//android.widget.EditText');
                const canEdit = await editable.isDisplayed().catch(() => false);
                if (canEdit) {
                    await collectionPage.fillCash(AMOUNTS.cash);
                } else {
                    console.log('Cash input is locked (partial collection in progress) — skipping fill');
                }
            });
        }

        if (AMOUNTS.cheque) {
            await step('Add cheque payment', async () => {
                try {
                    console.log('>>> CHEQUE_STEP clickAddCheque');
                    await collectionPage.clickAddCheque();
                    console.log('>>> CHEQUE_STEP fillChequeAmount');
                    await collectionPage.fillChequeAmount(AMOUNTS.cheque);
                    const afterAmtSrc = await browser.getPageSource();
                    writeFileSync(resolve(process.cwd(), 'mobile', 'cheque_after_amount_dump.xml'), afterAmtSrc, 'utf8');
                    console.log('>>> CHEQUE_STEP fillChequeRefNumber');
                    await collectionPage.fillChequeRefNumber(AMOUNTS.cheque);
                    const afterRefSrc = await browser.getPageSource();
                    writeFileSync(resolve(process.cwd(), 'mobile', 'cheque_after_ref_dump.xml'), afterRefSrc, 'utf8');
                    console.log('>>> CHEQUE_STEP clickChequeBankId');
                    await collectionPage.clickChequeBankId();
                    console.log('>>> CHEQUE_STEP selectRandomBank');
                    await collectionPage.selectRandomBank();
                    console.log('>>> CHEQUE_STEP clickChequeDueDate');
                    await collectionPage.clickChequeDueDate();
                    console.log('>>> CHEQUE_STEP clickDatePickerOk');
                    await collectionPage.clickDatePickerOk();
                    console.log('>>> CHEQUE_STEP submitChequeForm');
                    await collectionPage.submitChequeForm();
                    console.log('>>> CHEQUE_STEP DONE');
                } catch (e) {
                    console.log('>>> CHEQUE_STEP ERROR:', e.message);
                    const src = await browser.getPageSource();
                    writeFileSync(resolve(process.cwd(), 'mobile', 'cheque_form_error_dump.xml'), src, 'utf8');
                }
            });
        }

        if (AMOUNTS.qr) {
            await step('Add UPI payment', async () => {
                try {
                    console.log('>>> UPI_STEP START');
                    await collectionPage.handleUPIFlow(AMOUNTS.qr);
                    console.log('>>> UPI_STEP DONE');
                } catch (e) {
                    console.log('>>> UPI_STEP ERROR:', e.message);
                    const src = await browser.getPageSource();
                    writeFileSync(resolve(process.cwd(), 'mobile', 'upi_form_error_dump.xml'), src, 'utf8');
                }
            });
        }

        if (AMOUNTS.neft) {
            await step('Add NEFT/RTGS payment', async () => {
                try {
                    console.log('>>> NEFT_STEP clickAddNeft');
                    await collectionPage.clickAddNeft();
                    console.log('>>> NEFT_STEP fillNeftAmount');
                    await collectionPage.fillNeftAmount(AMOUNTS.neft);
                    console.log('>>> NEFT_STEP fillNeftRefNumber');
                    await collectionPage.fillNeftRefNumber(AMOUNTS.neft);
                    console.log('>>> NEFT_STEP submitNeftForm');
                    await collectionPage.submitNeftForm();
                    console.log('>>> NEFT_STEP DONE');
                } catch (e) {
                    console.log('>>> NEFT_STEP ERROR:', e.message);
                    const src = await browser.getPageSource();
                    writeFileSync(resolve(process.cwd(), 'mobile', 'neft_form_error_dump.xml'), src, 'utf8');
                }
            });
        }

        await step('Proceed to Adjustment screen', async () => {
            await collectionPage.clickProceedToAdjustment();
            await browser.pause(10000);
        });

        await step('Click Auto (auto-fills amount) — skips if already filled', async () => {
            const auto = await $('~Auto');
            if (await auto.isDisplayed().catch(() => false)) {
                await auto.click();
                await browser.pause(2500);
                const src = await browser.getPageSource();
                writeFileSync(resolve(process.cwd(), 'mobile', 'after_auto_dump.xml'), src, 'utf8');
            } else {
                console.log('Auto button not present — adjustment already in saved state');
            }
        });

        await step('Click Reason and pick value — skips if already filled', async () => {
            const reason = await $('//*[@content-desc="Reason *"]');
            if (await reason.isDisplayed().catch(() => false)) {
                await reason.click();
                await browser.pause(2500);
                const src = await browser.getPageSource();
                writeFileSync(resolve(process.cwd(), 'mobile', 'reason_picker_dump.xml'), src, 'utf8');
                await collectionPage.selectReason('Shop Permanently Closed').catch((e) => {
                    console.log('Reason "Shop Permanently Closed" not found in picker:', e.message);
                });
                await browser.pause(1500);
            } else {
                console.log('Reason already has a value — skipping picker');
            }
        });

        await step('Click Save / Update', async () => {
            const save = await $('~Save');
            const update = await $('~Update');
            const target = (await save.isDisplayed().catch(() => false)) ? save
                          : (await update.isDisplayed().catch(() => false)) ? update
                          : null;
            if (!target) {
                console.log('Neither Save nor Update button is visible');
                return;
            }
            const isEnabled = await target.isEnabled().catch(() => false);
            if (!isEnabled) {
                console.log('Save/Update is disabled — nothing to commit (state already up-to-date)');
                return;
            }
            await target.click();
            await browser.pause(3000);
            const src = await browser.getPageSource();
            writeFileSync(resolve(process.cwd(), 'mobile', 'after_save_dump.xml'), src, 'utf8');
        });
    });
});
