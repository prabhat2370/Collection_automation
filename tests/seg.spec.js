import { SegPage } from '../pages/segPage';
import { LoginPage } from '../pages/LoginPage';
import { test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Seg Flow', () => {

  let page, loginPage, segPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    segPage = new SegPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Open Login Page', async () => {
    await loginPage.navigate();
  });

  test('Fill Email', async () => {
    await loginPage.emailInput.fill('seg4@ripplr.in');
  });

  test('Fill Password', async () => {
    await loginPage.passwordInput.fill('Ripplr@123');
  });

  test('Click Login Button', async () => {
    await loginPage.loginBtn.click();
  });

  test('Click Allocation Link', async () => {
    await segPage.clickAllocationLink();
  });

  test('Click FC Dropdown', async () => {
    await segPage.clickFCDropdown();
  });

  test('Select BTM', async () => {
    await segPage.selectBTM();
  });

  test('Click Brand Dropdown', async () => {
    await segPage.clickBrandDropdown();
  });

  test('Select Britannia', async () => {
    await segPage.selectBritannia();
  });

  test('Click Continue Button', async () => {
    await segPage.clickContinue();
  });

  test('Click Salesman Dropdown', async () => {
    await segPage.clickSalesmanDropdown();
  });

  test('Select Abdul', async () => {
    await segPage.selectAbdul();
  });

  test('Click Search Button', async () => {
    await segPage.clickSearch();
    await page.waitForTimeout(5000);
  });

});
