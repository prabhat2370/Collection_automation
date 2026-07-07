import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SegCAPage } from '../pages/segCAPage';
import { ObcEliminationPage } from '../pages/obcEliminationPage';
import { loginAs, logout } from '../../utils/auth.js';
import { markInvoiceVerifiedByCashier } from '../../utils/dbHelper.js';
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
      await loginAs(page, 'seg');
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
      await segCAPage.selectSalesmanByMobile(USERS.collection.mobile);
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

      // Give the backend time to process the CA upload before retrying assignment
      await page.waitForTimeout(15000);

      // Log back in as Seg and replay the assignment so the flow can reach Handover Invoices
      await logout(page);
      await loginAs(page, 'seg');

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

      await segCAPage.selectInvoiceCheckboxes(invoices);
      await page.waitForTimeout(1000);
      await segCAPage.assignBtn.click();
      await page.waitForTimeout(1000);

      await segCAPage.selectSalesmanByMobile(USERS.collection.mobile);
      await page.waitForTimeout(1000);
      await segCAPage.confirmAssignmentBtn.click();
      await page.waitForTimeout(2000);

      await segCAPage.clickRemoveAndContinueIfVisible();
      await page.waitForTimeout(1000);
    });

    await test.step('Handle "Some invoices cannot be assigned" — mark VerifiedByCashier and retry assignment', async () => {
      const blocked = await segCAPage.extractUnassignableInvoices(3000);
      if (blocked.length === 0) {
        console.log('No blocked invoices — skipping cashier-verification fix.');
        return;
      }

      console.log(`Marking ${blocked.length} invoice(s) VerifiedByCashier in DB: ${blocked.join(', ')}`);
      for (const inv of blocked) {
        const res = await markInvoiceVerifiedByCashier(inv);
        console.log(`  ${inv}: ${res.affectedRows} row(s) updated.`);
      }

      // Dismiss the modal, then replay the assignment now that verification is fixed.
      await segCAPage.someInvoicesCancelBtn.first().click().catch(() => {});
      await page.waitForTimeout(2000);

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

      await segCAPage.selectInvoiceCheckboxes(invoices);
      await page.waitForTimeout(1000);
      await segCAPage.assignBtn.click();
      await page.waitForTimeout(1000);

      await segCAPage.selectSalesmanByMobile(USERS.collection.mobile);
      await page.waitForTimeout(1000);
      await segCAPage.confirmAssignmentBtn.click();
      await page.waitForTimeout(2000);

      await segCAPage.clickRemoveAndContinueIfVisible();
      await page.waitForTimeout(1000);

      // If the modal still appears (e.g. residual blocked invoices), cancel to proceed.
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
      await segCAPage.clickHandoverInvoices();
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
