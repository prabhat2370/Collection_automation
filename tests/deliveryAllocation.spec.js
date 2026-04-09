import { DeliveryAllocationPage } from '../pages/deliveryAllocationPage';
import { LoginPage } from '../pages/LoginPage';
import { test } from '@playwright/test';
import { USERS } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('Delivery Allocation Flow', () => {

  let page, loginPage, deliveryAllocationPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    deliveryAllocationPage = new DeliveryAllocationPage(page);
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
    await deliveryAllocationPage.clickLogisticsManagement();
  });

  test('Click Delivery Allocation', async () => {
    await deliveryAllocationPage.clickDeliveryAllocation();
  });

  test('Click Create Delivery Allocation', async () => {
    await deliveryAllocationPage.clickCreateDeliveryAllocation();
    
  });

  test('Select and Allocate Invoices', async () => {
    await deliveryAllocationPage.selectAndAllocateInvoices();
    await page.waitForTimeout(1000);
  });

  test('Handle Allocation Modal', async () => {
    await deliveryAllocationPage.handleAllocationModal();
  });

  test('Submit Delivery Allocation', async () => {
    await deliveryAllocationPage.clickSubmit();
  });

  test('Click Primary Button', async () => {
    await deliveryAllocationPage.clickPrimaryButton();
    
  });

  test('Click Confirm', async () => {
    await deliveryAllocationPage.clickConfirm();
    await page.waitForTimeout(5000);
  });

});
