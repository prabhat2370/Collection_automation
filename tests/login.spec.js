import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Ripplr Login Test', async ({ page }) => {

  const loginPage = new LoginPage(page);

  console.log("Step 1: Open Login Page");
  await loginPage.navigate();

  console.log("Step 2: Perform Login");
  await loginPage.login(
    'admin@ripplr.in',
    'M@ver!ck'
  );

  console.log("Step 3: Validate Login");
  await expect(loginPage.adapterUploadsLink).toBeVisible();
  await page.waitForTimeout(20000);

});