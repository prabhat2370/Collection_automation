import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CbmCashVerificationPage } from '../pages/cbmCashVerificationPage';
import { USERS, CBM_COLLECTION } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('CBM Cashier Verification Flow', () => {

    let page, loginPage, cbmCashVerificationPage;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        loginPage = new LoginPage(page);
        cbmCashVerificationPage = new CbmCashVerificationPage(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('Open Login Page', async () => {
        await loginPage.navigate();
    });

    test('Fill Email', async () => {
        await loginPage.emailInput.fill(USERS.cash.email);
    });

    test('Fill Password', async () => {
        await loginPage.passwordInput.fill(USERS.cash.password);
    });

    test('Click Login Button', async () => {
        await loginPage.loginBtn.click();
    });

    test('Click Cheque Bounce Menu', async () => {
        await cbmCashVerificationPage.clickChequeBounceMenu();
    });

    test('Click Cheque Bounce Recovery Verification', async () => {
        await cbmCashVerificationPage.clickChequeBounceRecovery();
    });

    test('Click Ready For Verification', async () => {
        await cbmCashVerificationPage.clickReadyForVerification();
    });

    test('Click Start Verification', async () => {
        await cbmCashVerificationPage.clickStartVerification();
    });

    test('Run Cash Flow', async () => {
        if (CBM_COLLECTION.cash.mode !== 'NA') {
            await cbmCashVerificationPage.runCashFlow();
        }
    });

    test('Run Cheque Flow', async () => {
        if (CBM_COLLECTION.cheque.mode !== 'NA') {
            await cbmCashVerificationPage.runChequeFlow();
        }
    });

    test('Insert UPI Bank Statement', async () => {
        if (CBM_COLLECTION.upi.mode !== 'NA') {
            await cbmCashVerificationPage.runUPIInsert();
            await page.reload();
        }
    });

    test('Run UPI Flow', async () => {
        if (CBM_COLLECTION.upi.mode !== 'NA') {
            await cbmCashVerificationPage.runUPIFlow();
        }
    });

    test('Insert NEFT Bank Statement', async () => {
        if (CBM_COLLECTION.neft.mode !== 'NA') {
            await cbmCashVerificationPage.runNEFTInsert();
            await page.reload();
        }
    });

    test('Run NEFT Flow', async () => {
        if (CBM_COLLECTION.neft.mode !== 'NA') {
            await cbmCashVerificationPage.runNEFTFlow();
        }
        await page.waitForTimeout(10000);
    });

});
