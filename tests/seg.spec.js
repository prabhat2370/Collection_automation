import { SegPage } from '../pages/segPage';
import { LoginPage } from '../pages/LoginPage';
import { test } from '@playwright/test';
import { USERS } from '../config/testData.js';

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
    await loginPage.emailInput.fill(USERS.seg.email);
  });

  test('Fill Password', async () => {
    await loginPage.passwordInput.fill(USERS.seg.password);
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

  test('Scroll Page', async () => {
    await segPage.scrollPage();
  });

  test('Click "INVstore2zz" Checkbox', async () => {
    await segPage.clickCheckbox();
  });

  test('Click Assign', async () => {
    await segPage.clickAssign();
  });

  test('Click Submit', async () => {
    await segPage.clickSubmit();
    await page.waitForTimeout(5000);
  });

});
