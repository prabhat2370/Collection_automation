import { SOUploadPage } from '../pages/soUploadPage';
import { LoginPage } from '../pages/LoginPage';
import { test } from '@playwright/test';
import { USERS, FILE_PATHS } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('SO Upload Flow', () => {

  let page, loginPage, soUploadPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    soUploadPage = new SOUploadPage(page);
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

  test('Click Adapter Uploads', async () => {
    await soUploadPage.clickAdapterUploads();
  });

  test('Click Upload Button', async () => {
    await soUploadPage.clickUpload();
  });

  test('Click Upload Type Dropdown', async () => {
    await soUploadPage.clickUploadTypeDropdown();
  });

  test('Select Sales Order', async () => {
    await soUploadPage.selectSalesOrder();
  });

  test('Click FC Dropdown', async () => {
    await soUploadPage.clickFCDropdown();
  });

  test('Type BTM', async () => {
    await soUploadPage.typeBTM();
  });

  test('Select BTM', async () => {
    await soUploadPage.selectBTM();
  });

  test('Click Brand Dropdown', async () => {
    await soUploadPage.clickBrandDropdown();
  });

  test('Type BRIT', async () => {
    await soUploadPage.typeBRIT();
  });

  test('Select Britannia', async () => {
    await soUploadPage.selectBritannia();
  });

  test('Upload SO Report File', async () => {
    await soUploadPage.uploadSOReport(FILE_PATHS.soReport);
  });

  test('Upload Invoice Report File', async () => {
    await soUploadPage.uploadInvoiceReport(FILE_PATHS.invoiceReport);
  });

  test('Upload Sales Register File', async () => {
    await soUploadPage.uploadSalesRegister(FILE_PATHS.salesRegister);
  });

  test('Click Submit', async () => {
    await soUploadPage.clickSubmit();
  });

  test('Wait for Fresh Upload and Capture Invoices', async () => {
    test.setTimeout(120000);
    await soUploadPage.waitForFreshUploadAndClickStatus();
    await page.waitForTimeout(3000);
    await soUploadPage.captureInvoiceNumbers();
  });

});
