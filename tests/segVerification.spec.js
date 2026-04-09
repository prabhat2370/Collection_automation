import { SegVerificationPage } from '../pages/segVerificationPage';
import { LoginPage } from '../pages/LoginPage';
import { test } from '@playwright/test';
import { USERS } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('Seg Verification Flow', () => {

  let page, loginPage, segVerificationPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    segVerificationPage = new SegVerificationPage(page);
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

  test('Click Verification', async () => {
    await segVerificationPage.clickVerification();
  });

  test('Click Salesman Row', async () => {
    await segVerificationPage.clickSalesmanRow();
  });

  test('Click Start Verification', async () => {
    await segVerificationPage.clickStartVerification();
  });

  test('Run Verification or Rejection Flow', async () => {
    await segVerificationPage.runFlow();
    await page.waitForTimeout(5000);
  });

});
