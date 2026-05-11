import { test } from '@playwright/test';
import { SOUploadPage } from '../pages/soUploadPage';
import { loginAs } from '../utils/auth.js';
import { SALES_ORDER_FILES as FILE_PATHS } from '../test-data/salesOrder.js';
import { prepareSOUploadFiles } from '../utils/collectionReportGenerator.js';
import { ensureRetailerMasterEnabled } from '../utils/dbHelper.js';

test.describe.configure({ mode: 'serial' });

test.describe('SO Upload Flow', () => {

  let page, soUploadPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    soUploadPage = new SOUploadPage(page);
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

  test('Upload SO/Invoice/SR files for CMBT Britannia', async () => {
    test.setTimeout(300000);

    await test.step('Login as OBC admin', async () => {
      await loginAs(page, 'obc');
    });

    await test.step('Open SO upload form', async () => {
      await soUploadPage.clickAdapterUploads();
      await soUploadPage.clickUpload();
      await soUploadPage.clickUploadTypeDropdown();
      await soUploadPage.selectSalesOrder();
    });

    await test.step('Select FC = CMBT, Brand = Britannia', async () => {
      await soUploadPage.clickFCDropdown();
      await soUploadPage.typeCMBT();
      await soUploadPage.selectCMBT();
      await soUploadPage.clickBrandDropdown();
      await soUploadPage.typeBRIT();
      await soUploadPage.selectBritannia();
    });

    // await test.step('Ensure retailer_master_enabled = 1 in DB', async () => {
    //   const { previousValue, updated } = await ensureRetailerMasterEnabled(16, 4);
    //   console.log(`retailer_master_enabled before: ${previousValue}, updated: ${updated}`);
    // });

    await test.step('Prepare SO files with fresh invoice numbers', async () => {
      prepareSOUploadFiles(FILE_PATHS.soReport, FILE_PATHS.invoiceReport, FILE_PATHS.salesRegister);
    });

    await test.step('Upload SO Report, Invoice Report, Sales Register', async () => {
      await soUploadPage.uploadSOReport(FILE_PATHS.soReport);
      await soUploadPage.uploadInvoiceReport(FILE_PATHS.invoiceReport);
      await soUploadPage.uploadSalesRegister(FILE_PATHS.salesRegister);
    });

    await test.step('Submit and observe response', async () => {
      await soUploadPage.clickSubmit();
      await soUploadPage.observeAfterSubmit();
    });

    await test.step('Wait for fully processed and capture invoices', async () => {
      await soUploadPage.waitForPageDataLoad();
      await soUploadPage.applySalesOrderFilter();
      await soUploadPage.clickSearch();
      await soUploadPage.waitForFullyProcessedAndClickStatus();
      await page.waitForTimeout(3000);
      await soUploadPage.captureInvoiceNumbers();
    });
  });

});
