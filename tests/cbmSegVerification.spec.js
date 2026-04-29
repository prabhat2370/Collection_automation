import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CbmSegVerificationPage } from '../pages/cbmSegVerificationPage';
import { USERS } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('CBM Seg Verification Flow', () => {

    let page, loginPage, cbmSegVerificationPage;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        loginPage = new LoginPage(page);
        cbmSegVerificationPage = new CbmSegVerificationPage(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('Open Login Page', async () => {
        await loginPage.navigate();
    });

    test('Fill Email', async () => {
        await loginPage.emailInput.fill(USERS.seg.email);
    });

    test('Fill Password', async () => {
        await loginPage.passwordInput.fill(USERS.seg.password);
    });

    test('Click Login Button', async () => {
        await loginPage.loginBtn.click();
    });

    test('Click Cheque Bounce Menu', async () => {
        await cbmSegVerificationPage.clickChequeBounceMenu();
    });

    test('Click Verification', async () => {
        await cbmSegVerificationPage.clickVerification();
    });

    test('Click Ready For Verification', async () => {
        await cbmSegVerificationPage.clickReadyForVerification();
    });

    test('Run Verification Flow', async () => {
        await cbmSegVerificationPage.runFlow();
        await page.waitForTimeout(10000);
    });

});
