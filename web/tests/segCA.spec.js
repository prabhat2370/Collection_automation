import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SegCAPage } from '../pages/segCAPage';
import { ObcEliminationPage } from '../pages/obcEliminationPage';
import { loginAs, logout } from '../../utils/auth.js';
import { USERS } from '../../test-data/users.js';

const SUNPURE_PLAIN_CA_CONFIG = {
  fc: 'BGRD: Begur Road',
  brand: 'SNPR: Sunpure',
  fcSearchText: 'BGRD',
  brandSearchText: 'SNPR',
  uploadType: 'Credit Adjustment',
  filePath: 'test-data/fixtures/CollectionReport_SUNPURE.xlsx',
};

const invoices = JSON.parse(
  readFileSync(resolve(process.cwd(), 'test-data/runtime/soInvoices.json'), 'utf8')
);

test.describe.configure({ mode: 'serial' });

test.describe('Seg Credit Adjustment Flow', () => {

  let page, segCAPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    segCAPage = new SegCAPage(page);
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

  test('Seg Credit Adjustment for Sunpure invoices', async () => {
    test.setTimeout(300_000);

    await test.step('Login as Seg CA', async () => {
      await loginAs(page, 'segCA');
    });

    await test.step('Open Allocation and select FC = Begur Road, Brand = Sunpure', async () => {
      await segCAPage.allocationLink.click();
      await page.waitForTimeout(1000);
      await segCAPage.selectFcDropdown.click();
      await page.waitForTimeout(1000);
      await segCAPage.fcOption.click();
      await page.waitForTimeout(1000);
      await segCAPage.selectBrandDropdown.click();
      await page.waitForTimeout(1000);
      await segCAPage.brandOption.click();
      await page.waitForTimeout(1000);
      await segCAPage.continueBtn.click();
      await page.waitForTimeout(3000);
    });

    await test.step('Select invoices from soInvoices.json and click Assign', async () => {
      await segCAPage.selectInvoiceCheckboxes(invoices);
      await page.waitForTimeout(1000);
      await segCAPage.assignBtn.click();
      await page.waitForTimeout(1000);
    });

    await test.step('Pick salesman and confirm assignment', async () => {
      await segCAPage.selectSalesmanDropdown.click();
      await page.waitForTimeout(1000);
      await segCAPage.salesmanOption(USERS.collection.mobile).click();
      await page.waitForTimeout(1000);
      await segCAPage.confirmAssignmentBtn.click();
      await page.waitForTimeout(2000);
    });

    await test.step('Click "Remove and Continue" if shown', async () => {
      await segCAPage.clickRemoveAndContinueIfVisible();
      await page.waitForTimeout(1000);
    });

    await test.step('If "Pending Financial Adjustment" modal shown, run Credit Adjustment upload', async () => {
      const modalShown = await segCAPage.isPendingFinancialAdjustmentVisible(2000);
      if (!modalShown) {
        console.log('No Pending Financial Adjustment modal — skipping Credit Adjustment upload.');
        return;
      }

      console.log('Pending Financial Adjustment modal detected — running Credit Adjustment upload for', SUNPURE_PLAIN_CA_CONFIG.fc, '+', SUNPURE_PLAIN_CA_CONFIG.brand);

      await segCAPage.pendingFinancialAdjustmentCloseBtn.click().catch(() => {});
      await page.waitForTimeout(1000);

      await logout(page);
      await loginAs(page, 'obc');

      const obcPage = new ObcEliminationPage(page, SUNPURE_PLAIN_CA_CONFIG);
      await obcPage.clickAdapterUploads();
      await page.waitForTimeout(1000);
      await obcPage.clickUpload();
      await page.waitForTimeout(1000);
      await obcPage.clickUploadTypeDropdown();
      await page.waitForTimeout(500);
      await obcPage.selectUploadType();
      await page.waitForTimeout(500);
      await obcPage.clickFCDropdown();
      await obcPage.typeFC();
      await page.waitForTimeout(500);
      await obcPage.selectFC();
      await page.waitForTimeout(500);
      await obcPage.clickBrandDropdown();
      await obcPage.typeBrand();
      await page.waitForTimeout(500);
      await obcPage.selectBrand();
      await page.waitForTimeout(500);
      await obcPage.uploadCollectionReport(SUNPURE_PLAIN_CA_CONFIG.filePath);
      await page.waitForTimeout(1000);
      await obcPage.clickSubmit();
      await page.waitForTimeout(5000);

      console.log('Credit Adjustment upload submitted for', SUNPURE_PLAIN_CA_CONFIG.brand);
    });

    await test.step('Cancel "Some invoices cannot be assigned" if shown', async () => {
      await segCAPage.clickCancelIfSomeInvoicesCannotBeAssigned();
      await page.waitForTimeout(2000);
    });

    await test.step('Close modal if shown', async () => {
      try {
        await segCAPage.closeBtn.first().waitFor({ state: 'visible', timeout: 3000 });
        await segCAPage.closeBtn.first().click();
        await page.waitForTimeout(2000);
        console.log('Close button clicked.');
      } catch {
        console.log('Close button not present — skipping.');
      }
    });

    await test.step('Open Handover Invoices', async () => {
      await segCAPage.handoverInvoicesBtn.click();
      await page.waitForTimeout(2000);
    });

    await test.step('Verify Sunpure invoice count matches soInvoices.json', async () => {
      const expectedCount = invoices.length;
      const sunpureCells = page.locator(`//tr[td[2][contains(., 'Sunpure')]]//td[4]//div`);
      const actualCount = await sunpureCells.count();
      console.log(`Expected (soInvoices.json): ${expectedCount}`);
      console.log(`Actual (Sunpure rows on Handover page): ${actualCount}`);
      expect(actualCount).toBe(expectedCount);
      await page.waitForTimeout(10000);
    });
  });

});
