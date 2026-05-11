import { test } from '@playwright/test';
import { CbmSegVerificationPage } from '../pages/cbmSegVerificationPage';
import { loginAs } from '../utils/auth.js';

test.describe.configure({ mode: 'serial' });

test.describe('CBM Seg Verification Flow', () => {

    let page, cbmSegVerificationPage;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        cbmSegVerificationPage = new CbmSegVerificationPage(page);
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

    test('CBM Seg verification', async () => {
        await test.step('Login as Seg', async () => {
            await loginAs(page, 'seg');
        });

        await test.step('Open Cheque Bounce Verification list', async () => {
            await cbmSegVerificationPage.clickChequeBounceMenu();
            await cbmSegVerificationPage.clickVerification();
        });

        await test.step('Pick ready-for-verification row', async () => {
            await cbmSegVerificationPage.clickReadyForVerification();
        });

        await test.step('Run verification flow', async () => {
            await cbmSegVerificationPage.runFlow();
            await page.waitForTimeout(10000);
        });
    });

});
