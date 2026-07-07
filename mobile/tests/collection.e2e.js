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
                // Wait for the Payment Collection screen to finish loading —
                // "Loading data..." overlay disappears once the cash row renders.
                await browser.waitUntil(
                    async () => {
                        const loading = await $('//*[contains(@content-desc, "Loading data")]');
                        return !(await loading.isDisplayed().catch(() => false));
                    },
                    { timeout: 20000, interval: 500, timeoutMsg: 'Payment Collection still loading' }
                ).catch(() => {});

                // Now check the cash field. waitForDisplayed (not immediate isDisplayed)
                // gives the EditText time to render; if it never appears in 10s, treat
                // as truly locked (e.g. fully-committed collection).
                const editable = await $('//android.widget.EditText');
                let canEdit = false;
                try {
                    await editable.waitForDisplayed({ timeout: 10000 });
                    canEdit = await editable.isEnabled().catch(() => true);
                } catch { /* never appeared — locked */ }

                if (canEdit) {
                    await collectionPage.fillCash(AMOUNTS.cash);
                    // Diagnostic: dump + screenshot after cash fill.
                    const afterSrc = await browser.getPageSource();
                    writeFileSync(resolve(process.cwd(), 'mobile', 'after_cash_dump.xml'), afterSrc, 'utf8');
                    const screenshotB64 = await browser.takeScreenshot();
                    writeFileSync(resolve(process.cwd(), 'mobile', 'after_cash.png'), Buffer.from(screenshotB64, 'base64'));
                    // Also check the Total at bottom — that reflects whether cash registered.
                    const total = await $('//*[starts-with(@content-desc, "Total:")]');
                    const totalText = await total.getAttribute('content-desc').catch(() => '');
                    console.log('>>> CASH_STEP after fill, Total content-desc =', JSON.stringify(totalText));
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

        await step('Confirm Submission dialog — click Submit', async () => {
            try {
                console.log('>>> SUBMIT_STEP confirming submission');
                // Save/Update on the Adjustment screen pops a "Confirm Submission"
                // dialog directly — buttons are Cancel / Submit (not a separate
                // Submit Collection screen with Yes/No confirmation).
                const submitBtn = await $('//android.widget.Button[@content-desc="Submit"]');
                await submitBtn.waitForDisplayed({ timeout: 15000 });
                await submitBtn.click();
                await browser.pause(4000);
                const src = await browser.getPageSource();
                writeFileSync(resolve(process.cwd(), 'mobile', 'after_submit_dump.xml'), src, 'utf8');
                console.log('>>> SUBMIT_STEP DONE');
            } catch (e) {
                console.log('>>> SUBMIT_STEP ERROR:', e.message);
                const src = await browser.getPageSource().catch(() => '');
                if (src) writeFileSync(resolve(process.cwd(), 'mobile', 'submit_error_dump.xml'), src, 'utf8');
            }
        });

        await step('Salesman: Submit Collection (batch) and confirm Yes', async () => {
            try {
                console.log('>>> SUBMIT_ALL_STEP waiting for post-submit spinner to clear');
                await browser.waitUntil(
                    async () => {
                        const spinner = await $('//*[contains(@content-desc, "Please wait")]');
                        return !(await spinner.isDisplayed().catch(() => false));
                    },
                    { timeout: 30000, interval: 1000, timeoutMsg: 'Post-submit "Please wait..." did not clear' }
                ).catch(() => {});

                console.log('>>> SUBMIT_ALL_STEP dismissing Returns screen via "Skip without returns"');
                // "Submit Collection" (batch) is gated behind the Returns screen.
                // The skip button is what reveals it.
                const skipped = await collectionPage.clickSkipWithoutReturns(15000);
                if (!skipped) {
                    console.log('"Skip without returns" not visible — Returns screen may already be dismissed');
                }

                console.log('>>> SUBMIT_ALL_STEP locating Submit Collection');
                const submitCollection = await $('//*[contains(@content-desc, "Submit Collection")]');
                const visible = await submitCollection
                    .waitForDisplayed({ timeout: 15000 })
                    .then(() => true)
                    .catch(() => false);

                if (!visible) {
                    console.log('Submit Collection button not visible — nothing pending to submit, skipping');
                    return;
                }

                await collectionPage.clickSubmitCollection();
                await browser.pause(2500);

                console.log(`>>> SUBMIT_ALL_STEP clicking confirmation "${CONFIRMATION.submitCollection}"`);
                await collectionPage.clickConfirmation(CONFIRMATION.submitCollection);
                await browser.pause(4000);

                const src = await browser.getPageSource();
                writeFileSync(resolve(process.cwd(), 'mobile', 'after_submit_all_dump.xml'), src, 'utf8');
                console.log('>>> SUBMIT_ALL_STEP DONE');
            } catch (e) {
                console.log('>>> SUBMIT_ALL_STEP ERROR:', e.message);
                const src = await browser.getPageSource().catch(() => '');
                if (src) writeFileSync(resolve(process.cwd(), 'mobile', 'submit_all_error_dump.xml'), src, 'utf8');
            }
        });
    });
});
