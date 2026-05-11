import { test } from '@playwright/test';
import { DeliveryAllocationPage } from '../pages/deliveryAllocationPage';
import { loginAs } from '../utils/auth.js';

test.describe.configure({ mode: 'serial' });

test.describe('Delivery Allocation Flow', () => {

  let page, deliveryAllocationPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    deliveryAllocationPage = new DeliveryAllocationPage(page);
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

  test('Allocate invoices to vehicle', async () => {
    await test.step('Login as OBC admin', async () => {
      await loginAs(page, 'obc');
    });

    await test.step('Open Delivery Allocation form', async () => {
      await deliveryAllocationPage.clickLogisticsManagement();
      await deliveryAllocationPage.clickDeliveryAllocation();
      await deliveryAllocationPage.clickCreateDeliveryAllocation();
    });

    await test.step('Select invoices and click Allocate Vehicle', async () => {
      await deliveryAllocationPage.selectAndAllocateInvoices();
      await page.waitForTimeout(1000);
    });

    await test.step('Fill allocation modal', async () => {
      await deliveryAllocationPage.handleAllocationModal();
    });

    await test.step('Submit and confirm', async () => {
      await deliveryAllocationPage.clickSubmit();
      await deliveryAllocationPage.clickPrimaryButton();
      await deliveryAllocationPage.clickConfirm();
      await page.waitForTimeout(5000);
    });
  });

});
