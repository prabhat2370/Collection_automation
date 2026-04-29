import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ChequeBouncePage } from '../pages/cbmPage';
import { USERS, CHEQUE_BOUNCE, CBM_UPLOAD_FILES } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('Cheque Bounce Flow', () => {

    let page, loginPage, chequeBouncePage;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        loginPage = new LoginPage(page);
        chequeBouncePage = new ChequeBouncePage(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('Open Login Page', async () => {
        await loginPage.navigate();
    });

    test('Fill Email', async () => {
        await loginPage.emailInput.fill(USERS.obc.email);
    });

    test('Fill Password', async () => {
        await loginPage.passwordInput.fill(USERS.obc.password);
    });

    test('Click Login Button', async () => {
        await loginPage.loginBtn.click();
    });

    test('Click Cheque Bounce Menu', async () => {
        await chequeBouncePage.clickChequeBounceMenu();
    });

    test('Click Cheque Bounce List', async () => {
        await chequeBouncePage.clickChequeBounceList();
    });

    test('Click Add Cheque Bounce', async () => {
        await chequeBouncePage.clickAddChequeBounce();
    });

    test('Fill Cheque Number', async () => {
        await chequeBouncePage.fillChequeNumber(CHEQUE_BOUNCE.chequeBounceNo);
    });

    test('Click Invoice Mapping', async () => {
        await chequeBouncePage.clickInvoiceMapping();
        
    });

    test('Select FC Checkbox', async () => {
        await chequeBouncePage.clickFCCheckbox();
    });

    test('Click Submit and Close', async () => {
        await chequeBouncePage.clickSubmitAndClose();
    });

    test('Click Yes', async () => {
        await chequeBouncePage.clickYes();
    });

    test('Logout Admin', async () => {
        await loginPage.logout();
    });

    test('Login as Cashier - Fill Email', async () => {
        await loginPage.emailInput.fill(USERS.cash.email);
    });

    test('Login as Cashier - Fill Password', async () => {
        await loginPage.passwordInput.fill(USERS.cash.password);
    });

    test('Login as Cashier - Click Login', async () => {
        await loginPage.loginBtn.click();
        
    });

    test('Click Cheque Bounce Menu (Cashier)', async () => {
        await chequeBouncePage.clickChequeBounceMenu();
    });

    test('Click Mark Bounce', async () => {
        await chequeBouncePage.clickMarkBounce();
    });

    

    test('Click Cheque Row', async () => {
        await chequeBouncePage.clickChequeRowImg();
    });

    test('Select CBM Reason', async () => {
        await chequeBouncePage.clickCBMReason();
    });

    test('Upload Documents', async () => {
        await chequeBouncePage.uploadDocuments(CBM_UPLOAD_FILES);
    });

    test('Click Submit', async () => {
        await chequeBouncePage.clickSubmit();
        await page.waitForTimeout(5000);
    });


    test('Click Handover Tab', async () => {
        await chequeBouncePage.clickHandoverTab();
    });

    test('Click Handover Action Image', async () => {
        await chequeBouncePage.clickHandoverActionImg();
    });

    test('Click Choose Segregator', async () => {
        await chequeBouncePage.clickChooseSegregator();
    });

    test('Click Segregator Option', async () => {
        await chequeBouncePage.clickSegregatorOption();
    });

    test('Click Assign Cheque', async () => {
        await chequeBouncePage.clickAssignCheque();
    });

    test('Click Close', async () => {
        await chequeBouncePage.clickModalClose();
    });

    test('Logout Cashier', async () => {
        await loginPage.logout();
    });

    test('Login as Seg - Fill Email', async () => {
        await loginPage.emailInput.fill(USERS.seg.email);
    });

    test('Login as Seg - Fill Password', async () => {
        await loginPage.passwordInput.fill(USERS.seg.password);
    });

    test('Login as Seg - Click Login', async () => {
        await loginPage.loginBtn.click();
    });

    test('Click Acknowledge Now', async () => {
        await chequeBouncePage.clickAcknowledgeNow();
    });

    test('Click Yes (Seg)', async () => {
        await chequeBouncePage.clickConfirmYes();
    });

    test('Click Submit (Seg)', async () => {
        await chequeBouncePage.clickSubmit2();
    });

    test('Click Summary Action Icon', async () => {
        await chequeBouncePage.clickSummaryActionSvg();
    });

    test('Click Choose Officer', async () => {
        await chequeBouncePage.clickChooseOfficer();
    });

    test('Click Officer Option', async () => {
        await chequeBouncePage.clickOfficerOption();
    });

    test('Click Assign Cheque (Officer)', async () => {
        await chequeBouncePage.clickAssignCheque2();
    });

    test('Click Close (Officer)', async () => {
        await chequeBouncePage.clickModalClose();
        await page.waitForTimeout(10000);
    });

});
