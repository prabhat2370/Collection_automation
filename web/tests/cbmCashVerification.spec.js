import { test } from '@playwright/test';
import { CbmCashVerificationPage } from '../pages/cbmCashVerificationPage';
import { loginAs } from '../../utils/auth.js';
import { CBM_COLLECTION } from '../../test-data/cbm.js';

test.describe.configure({ mode: 'serial' });

test.describe('CBM Cashier Verification Flow', () => {

    let page, cbmCashVerificationPage;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        cbmCashVerificationPage = new CbmCashVerificationPage(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test.afterEach(async ({}, testInfo) => {
        if (process.env.CAPTURE_SCREENSHOTS === 'N') return;
        if (page && !page.isClosed()) {
            try {
                await page.waitForTimeout(1500);
                const buf = await page.screenshot({ fullPage: true });
                await testInfo.attach('screenshot', { body: buf, contentType: 'image/png' });
            } catch (err) {
                console.log('[afterEach] screenshot failed:', err.message);
            }
        }
    });

    test('CBM Cashier verification for configured payment modes', async () => {
        test.setTimeout(120000);

        await test.step('Login as Cash', async () => {
            await loginAs(page, 'cash');
        });

        await test.step('Open Cheque Bounce Recovery Verification', async () => {
            await cbmCashVerificationPage.clickChequeBounceMenu();
            await cbmCashVerificationPage.clickChequeBounceRecovery();
            await cbmCashVerificationPage.clickReadyForVerification();
            await cbmCashVerificationPage.clickStartVerification();
        });

        if (CBM_COLLECTION.cash.mode !== 'NA') {
            await test.step('Run cash flow', async () => {
                await cbmCashVerificationPage.runCashFlow();
            });
        }

        if (CBM_COLLECTION.cheque.mode !== 'NA') {
            await test.step('Run cheque flow', async () => {
                await cbmCashVerificationPage.runChequeFlow();
            });
        }

        if (CBM_COLLECTION.upi.mode !== 'NA') {
            await test.step('Insert UPI bank statement (DB) and run UPI flow', async () => {
                await cbmCashVerificationPage.runUPIInsert();
                await page.reload();
                await cbmCashVerificationPage.runUPIFlow();
            });
        }

        if (CBM_COLLECTION.neft.mode !== 'NA') {
            await test.step('Insert NEFT bank statement (DB) and run NEFT flow', async () => {
                await cbmCashVerificationPage.runNEFTInsert();
                await page.reload();
                await cbmCashVerificationPage.runNEFTFlow();
            });
        }

        await page.waitForTimeout(10000);
    });

});
