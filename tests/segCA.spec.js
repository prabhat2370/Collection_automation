import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SegCAPage } from '../pages/segCAPage';
import { USERS } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('Seg Credit Adjustment Flow', () => {

  let page, loginPage, segCAPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    segCAPage = new SegCAPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Open Login Page', async () => {
    await loginPage.navigate();
  });

  test('Fill Email', async () => {
    await loginPage.emailInput.fill(USERS.segCA.email);
  });

  test('Fill Password', async () => {
    await loginPage.passwordInput.fill(USERS.segCA.password);
  });

  test('Click Login Button', async () => {
    await loginPage.loginBtn.click();
    await page.waitForTimeout(5000);
  });

});
