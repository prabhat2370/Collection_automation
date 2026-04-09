import { CashVerificationPage } from '../pages/cashVerificationPage';
import { LoginPage } from '../pages/LoginPage';
import { test } from '@playwright/test';
import { USERS, PAYMENT_MODES } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('Cashier Verification Flow', () => {

  let page, loginPage, cashVerificationPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    cashVerificationPage = new CashVerificationPage(page);
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

  test('Click Collection Settlement', async () => {
    await cashVerificationPage.clickCollectionSettlement();
  });

  test('Click Salesman Settle', async () => {
    await cashVerificationPage.clickSalesmanSettle();
  });

  test('Click Start Verification', async () => {
    await cashVerificationPage.clickStartVerification();
  });

  test('Run Cash Flow', async () => {
    await cashVerificationPage.runCashFlow();
  });

  test('Run Cheque Flow', async () => {
    await cashVerificationPage.runChequeFlow();

  });

  test('Insert UPI Bank Statement', async () => {
    if (PAYMENT_MODES.upi !== 'NA') {
      await cashVerificationPage.runUPIInsert();
      await page.reload();
    }
  });

  test('Run UPI Flow', async () => {
    await cashVerificationPage.runUPIFlow();
  });

  test('Insert NEFT Bank Statement', async () => {
    if (PAYMENT_MODES.neft !== 'NA') {
      await cashVerificationPage.runNEFTInsert();
      await page.reload();
    }
  });

  test('Run NEFT Flow', async () => {
    await cashVerificationPage.runNEFTFlow();
    await page.waitForTimeout(5000);
  });

});
