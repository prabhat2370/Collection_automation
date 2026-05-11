import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginAs } from '../utils/auth.js';

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

  test('Login as OBC admin', async () => {
    await loginAs(page, 'obc');
  });

  test('Logout', async () => {
    await loginPage.logout();
    await page.waitForTimeout(5000);
  });

});
