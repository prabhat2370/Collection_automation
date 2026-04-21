import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { USERS } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('Login & Logout Flow', () => {

  let page, loginPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
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

  test('Logout', async () => {
    await loginPage.logout();
    await page.waitForTimeout(5000);
  });

});
