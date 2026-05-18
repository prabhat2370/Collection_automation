import { test } from '@playwright/test';
import { SOUploadPage } from '../pages/soUploadPage';
import { loginAs } from '../../utils/auth.js';
import { SALES_ORDER_BRANDS, ACTIVE_SO_BRAND } from '../../test-data/salesOrder.js';
import { prepareSOUploadFiles, prepareSunpureSOUploadFile } from '../../utils/collectionReportGenerator.js';

function resolveBrandKeys(active) {
  if (active === 'all') return Object.keys(SALES_ORDER_BRANDS);
  const keys = Array.isArray(active) ? active : [active];
  for (const k of keys) {
    if (!SALES_ORDER_BRANDS[k]) {
      throw new Error(`ACTIVE_SO_BRAND="${k}" is not in SALES_ORDER_BRANDS. Known: ${Object.keys(SALES_ORDER_BRANDS).join(', ')}`);
    }
  }
  return keys;
}
const ACTIVE_BRAND_KEYS = resolveBrandKeys(ACTIVE_SO_BRAND);

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

  for (const key of ACTIVE_BRAND_KEYS) {
    const cfg = SALES_ORDER_BRANDS[key];
    test(`Upload SO files for ${cfg.fc} / ${cfg.brand}`, async () => {
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

      await test.step(`Select FC = ${cfg.fcSearch}, Brand = ${cfg.brandSearch}`, async () => {
        await soUploadPage.selectFC(cfg.fcSearch, cfg.fc);
        await soUploadPage.selectBrand(cfg.brandSearch, cfg.brand);
      });

      await test.step('Prepare SO files with fresh invoice numbers', async () => {
        if (cfg.mode === 'multi') {
          prepareSOUploadFiles(cfg.files.soReport, cfg.files.invoiceReport, cfg.files.salesRegister);
        } else {
          prepareSunpureSOUploadFile(cfg.files.upload);
        }
      });

      await test.step('Upload files', async () => {
        if (cfg.mode === 'multi') {
          await soUploadPage.uploadSOReport(cfg.files.soReport);
          await soUploadPage.uploadInvoiceReport(cfg.files.invoiceReport);
          await soUploadPage.uploadSalesRegister(cfg.files.salesRegister);
        } else {
          await soUploadPage.uploadSingleFile(cfg.files.upload);
        }
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
  }

});
