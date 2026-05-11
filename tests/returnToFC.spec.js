import { test } from '@playwright/test';
import { ReturnToFCPage } from '../pages/returnToFCPage';
import { loginAs } from '../utils/auth.js';
import { DELIVERY } from '../test-data/deliveryAllocation.js';
import { RFC_COLLECTION, RFC_UPLOAD_FILES } from '../test-data/rfc.js';

test.describe.configure({ mode: 'serial' });

test.describe('Return to FC Flow', () => {

  let page, returnToFCPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    returnToFCPage = new ReturnToFCPage(page);
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

  test('Process Return-to-FC for latest vehicle', async () => {
    test.setTimeout(600000);

    await test.step('Login as OBC admin', async () => {
      await loginAs(page, 'obc');
    });

    await test.step('Open Return to FC for latest vehicle', async () => {
      await returnToFCPage.clickLogisticsManagement();
      await returnToFCPage.clickReturnToFC();
      await returnToFCPage.clickEyeIcon(DELIVERY.vehicleNo);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    });

    await test.step('Process all invoices through delivery + collection form', async () => {
      await returnToFCPage.processAllInvoicesFlow(DELIVERY.deliveryStatus, RFC_COLLECTION);
    });

    await test.step('Verify all invoices', async () => {
      await returnToFCPage.verifyAllInvoices();
    });

    await test.step('Upload RFC supporting docs (round 1)', async () => {
      await returnToFCPage.uploadRFCFiles([RFC_UPLOAD_FILES[0]]);
    });

    await test.step('Upload RFC supporting docs (round 2)', async () => {
      await returnToFCPage.uploadRFCFiles([RFC_UPLOAD_FILES[1]]);
    });

    await test.step('Click Verify RFC', async () => {
      await returnToFCPage.clickVerifyRFC();
      await page.waitForTimeout(3000);
    });
  });

});
