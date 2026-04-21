import { ReturnToFCPage } from '../pages/returnToFCPage';
import { LoginPage } from '../pages/LoginPage';
import { test } from '@playwright/test';
import { USERS, DELIVERY, RFC_COLLECTION, RFC_UPLOAD_FILES } from '../config/testData.js';


test.describe.configure({ mode: 'serial' });

test.describe('Return to FC Flow', () => {

  let page, loginPage, returnToFCPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    returnToFCPage = new ReturnToFCPage(page);
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

  test('Click Logistics Management', async () => {
    await returnToFCPage.clickLogisticsManagement();
  });

  test('Click Return to FC', async () => {
    await returnToFCPage.clickReturnToFC();
  });

  test('Click Eye Icon for Test Driver', async () => {
    await returnToFCPage.clickEyeIcon(DELIVERY.driverName);
    
  });

  test('Scroll Down', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
  });

  test('Process All Invoices', async () => {
    test.setTimeout(300000); // 5 min for all invoices
    await returnToFCPage.processAllInvoicesFlow(DELIVERY.deliveryStatus, RFC_COLLECTION);
  });

  test('Verify All Invoices', async () => {
    test.setTimeout(120000);
    await returnToFCPage.verifyAllInvoices();
  });

  test('Upload RFC Files', async () => {
    test.setTimeout(60000);
    await returnToFCPage.uploadRFCFiles(RFC_UPLOAD_FILES);
  });

  test('Click Verify RFC', async () => {
    test.setTimeout(60000);
    await returnToFCPage.clickVerifyRFC();
    await page.waitForTimeout(6000);
  });

  test('Subtract Collection Date for All Invoices', async () => {
    await returnToFCPage.subtractCollectionDatesForAllInvoices();
  });

});
