import { test } from '@playwright/test';
import { ChequeBouncePage } from '../pages/cbmPage';
import { loginAs, logout } from '../../utils/auth.js';
import { CHEQUE_BOUNCE, CBM_UPLOAD_FILES } from '../../test-data/cbm.js';

test.describe.configure({ mode: 'serial' });

test.describe('Cheque Bounce Flow', () => {

    let page, chequeBouncePage;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        chequeBouncePage = new ChequeBouncePage(page);
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

    test('Admin: Add cheque bounce and map invoice', async () => {
        await test.step('Login as OBC admin', async () => {
            await loginAs(page, 'obc');
        });

        await test.step('Open Cheque Bounce list and add new', async () => {
            await chequeBouncePage.clickChequeBounceMenu();
            await chequeBouncePage.clickChequeBounceList();
            await chequeBouncePage.clickAddChequeBounce();
        });

        await test.step('Fill cheque number and map FC', async () => {
            await chequeBouncePage.fillChequeNumber(CHEQUE_BOUNCE.chequeBounceNo);
            await chequeBouncePage.clickInvoiceMapping();
            await chequeBouncePage.clickFCCheckbox();
        });

        await test.step('Submit and confirm', async () => {
            await chequeBouncePage.clickSubmitAndClose();
            await chequeBouncePage.clickYes();
        });

        await test.step('Logout admin', async () => {
            await logout(page);
        });
    });

    test('Cashier: Mark bounce and handover', async () => {
        await test.step('Login as Cashier', async () => {
            await loginAs(page, 'cash');
        });

        await test.step('Open Mark Bounce form', async () => {
            await chequeBouncePage.clickChequeBounceMenu();
            await chequeBouncePage.clickMarkBounce();
        });

        await test.step('Pick cheque row and select reason', async () => {
            await chequeBouncePage.clickChequeRowImg();
            await chequeBouncePage.clickCBMReason();
        });

        await test.step('Upload supporting docs and submit', async () => {
            await chequeBouncePage.uploadDocuments(CBM_UPLOAD_FILES);
            await chequeBouncePage.clickSubmit();
            await page.waitForTimeout(5000);
        });

        await test.step('Open Handover tab and trigger action', async () => {
            await chequeBouncePage.clickHandoverTab();
            await chequeBouncePage.clickHandoverActionImg();
        });

        await test.step('Assign segregator', async () => {
            await chequeBouncePage.clickChooseSegregator();
            await chequeBouncePage.clickSegregatorOption();
            await chequeBouncePage.clickAssignCheque();
            await chequeBouncePage.clickModalClose();
        });

        await test.step('Logout cashier', async () => {
            await logout(page);
        });
    });

    test('Seg: Acknowledge bounce and assign officer', async () => {
        await test.step('Login as Seg', async () => {
            await loginAs(page, 'seg');
        });

        await test.step('Acknowledge handover and submit', async () => {
            await chequeBouncePage.clickAcknowledgeNow();
            await chequeBouncePage.clickConfirmYes();
            await chequeBouncePage.clickSubmit2();
        });

        await test.step('Open summary and assign officer', async () => {
            await chequeBouncePage.clickSummaryActionSvg();
            await chequeBouncePage.clickChooseOfficer();
            await chequeBouncePage.clickOfficerOption();
            await chequeBouncePage.clickAssignCheque2();
            await chequeBouncePage.clickModalClose();
            await page.waitForTimeout(10000);
        });
    });

});
