import { test } from '@playwright/test';
import { DeliveryAllocationPage } from '../pages/deliveryAllocationPage';
import { loginAs } from '../../utils/auth.js';
import { closeStalePendingRFC } from '../../utils/dbHelper.js';
import { SALES_ORDER_BRANDS, ACTIVE_SO_BRAND } from '../../test-data/salesOrder.js';

test.describe.configure({ mode: 'serial' });

// Shared retry for the stale-RFC "allocation is blocked" popup — it can appear either
// right after clicking Allocate Vehicle, or after the final Confirm (see
// deliveryAllocationPage.rfcBlockedError). Closes the pending RFC in the DB for the
// active brand's FC, dismisses the popup, then replays whichever click triggered it.
async function resolveRfcBlockIfPresent(page, deliveryAllocationPage, retry) {
  if (!(await deliveryAllocationPage.isRfcBlockedErrorVisible())) return;
  const fcId = SALES_ORDER_BRANDS[ACTIVE_SO_BRAND].fcId;
  console.log(`Closing pending RFC for fc_id=${fcId} and retrying.`);
  const res = await closeStalePendingRFC(fcId);
  console.log(`  Allocations: ${res.affectedRows} row(s) updated to status='CO'.`);
  await deliveryAllocationPage.dismissRfcBlockedError();
  await page.waitForTimeout(1000);
  await retry();
}

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
    test.setTimeout(90_000);
    await test.step('Login as OBC admin', async () => {
      await loginAs(page, 'obc');
    });

    await test.step('Open Delivery Allocation form', async () => {
      await deliveryAllocationPage.clickLogisticsManagement();
      await deliveryAllocationPage.clickDeliveryAllocation();
      await deliveryAllocationPage.clickCreateDeliveryAllocation();
    });

    await test.step('Select invoices and click Allocate Vehicle', async () => {
      await deliveryAllocationPage.selectInvoices();
      await page.waitForTimeout(500);
      await deliveryAllocationPage.clickAllocateVehicle();
      await resolveRfcBlockIfPresent(page, deliveryAllocationPage, () => deliveryAllocationPage.clickAllocateVehicle());
      await page.waitForTimeout(1000);
    });

    await test.step('Fill allocation modal', async () => {
      await deliveryAllocationPage.handleAllocationModal();
    });

    await test.step('Submit and confirm', async () => {
      await deliveryAllocationPage.clickSubmit();
      await deliveryAllocationPage.clickPrimaryButton();
      await deliveryAllocationPage.clickConfirm();
      await resolveRfcBlockIfPresent(page, deliveryAllocationPage, () => deliveryAllocationPage.clickConfirm());

      await page.waitForTimeout(5000);
    });

    await test.step('Confirm vehicle allocation (E-way bill) if prompted', async () => {
      await deliveryAllocationPage.clickConfirmVehicleAllocationIfPresent();
      await page.waitForTimeout(2000);
    });
  });

});
