import { test } from '@playwright/test';
import { SegVerificationPage } from '../pages/segVerificationPage';
import { loginAs } from '../utils/auth.js';
import { SEG } from '../test-data/seg.js';

test.describe.configure({ mode: 'serial' });

test.describe('Seg Verification Flow', () => {

  let page, segVerificationPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    segVerificationPage = new SegVerificationPage(page);
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

  test('Verify or reject invoices for current verificationType', async () => {
    await test.step('Login as Seg', async () => {
      await loginAs(page, 'seg');
    });

    await test.step('Open Verification page', async () => {
      await segVerificationPage.clickVerification();
    });

    if (SEG.verificationType === 'D') {
      await test.step('Open Deliverer tab and pick delivery row', async () => {
        await page.waitForTimeout(3000);
        await segVerificationPage.clickDeliverer();
        await segVerificationPage.clickDeliveryRow();
      });
    } else {
      await test.step('Pick salesman row and start verification', async () => {
        await segVerificationPage.clickSalesmanRow();
        await segVerificationPage.clickStartVerification();
      });
    }

    await test.step('Run verification or rejection flow', async () => {
      await segVerificationPage.runFlow();
      await page.waitForTimeout(5000);
    });
  });

});
