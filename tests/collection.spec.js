import { CollectionPage } from '../pages/collectionPage';
import { test } from '@playwright/test';
import { USERS, AMOUNTS } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('Collection Flow', () => {

  let page, collectionPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    collectionPage = new CollectionPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Open Login Page', async () => {
    await collectionPage.navigate();
  });

  test('Fill Mobile Number', async () => {
    await collectionPage.fillMobile(USERS.collection.mobile);
  });

  test('Click Submit Button', async () => {
    await collectionPage.clickSubmit();
  });

  test('Fill PIN', async () => {
    await collectionPage.fillPin(USERS.collection.pin);
  });

  test('Click Submit Button (PIN)', async () => {
    await collectionPage.clickSubmit();

  });

  test('Click Down Arrow', async () => {
    await collectionPage.clickDownArrow();
  });

  test('Fill Cash Amount', async () => {
    await collectionPage.fillCash(AMOUNTS.cash);
  });

  test('Fill Cheque Amount', async () => {
    await collectionPage.fillChequeAmount(AMOUNTS.cheque);
  });

  test('Fill Cheque Reference Number', async () => {
    await collectionPage.fillChequeRefNumber();
  });

  test('Click Cheque Bank Dropdown', async () => {
    await collectionPage.clickChequeBankId();
  });

  test('Select Random Bank', async () => {
    await collectionPage.selectRandomBank();
  });

  test('Click Cheque Due Date', async () => {
    await collectionPage.clickChequeDueDate();
  });

  test('Select Today', async () => {
    await collectionPage.clickToday();
  });

  test('Handle UPI Flow', async () => {
    await collectionPage.handleUPIFlow(AMOUNTS.qr);
  });

  test('Fill NEFT Amount', async () => {
    await collectionPage.fillNeftAmount(AMOUNTS.neft);
  });

  test('Fill NEFT Reference Number', async () => {
    await collectionPage.fillNeftRefNumber(AMOUNTS.neft);
  });

  test('Click Auto', async () => {
    await collectionPage.clickAuto();
  });

  test('Click Split Reason Dropdown', async () => {
    await collectionPage.clickSplitReason();
  });

  test('Select Shop Permanently Closed', async () => {
    await collectionPage.selectShopClosed();
  });

  test('Click Final Submit', async () => {
    await collectionPage.clickFinalSubmit();
  });

  test('Click Submit Collection', async () => {
    await collectionPage.clickSubmitCollection();
  });

  test('Click Confirmation (No)', async () => {
    await collectionPage.clickConfirmation();
    await page.waitForTimeout(5000);
  });

});
