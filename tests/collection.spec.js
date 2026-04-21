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
    test.skip(!AMOUNTS.cash, 'No cash amount set — skipping');
    await collectionPage.fillCash(AMOUNTS.cash);
  });

  test('Fill Cheque Amount', async () => {
    test.skip(!AMOUNTS.cheque, 'No cheque amount set — skipping');
    await collectionPage.fillChequeAmount(AMOUNTS.cheque);
  });

  test('Fill Cheque Reference Number', async () => {
    test.skip(!AMOUNTS.cheque, 'No cheque amount set — skipping');
    await collectionPage.fillChequeRefNumber();
  });

  test('Click Cheque Bank Dropdown', async () => {
    test.skip(!AMOUNTS.cheque, 'No cheque amount set — skipping');
    await collectionPage.clickChequeBankId();
  });

  test('Select Random Bank', async () => {
    test.skip(!AMOUNTS.cheque, 'No cheque amount set — skipping');
    await collectionPage.selectRandomBank();
  });

  test('Click Cheque Due Date', async () => {
    test.skip(!AMOUNTS.cheque, 'No cheque amount set — skipping');
    await collectionPage.clickChequeDueDate();
  });

  test('Select Today', async () => {
    test.skip(!AMOUNTS.cheque, 'No cheque amount set — skipping');
    await collectionPage.clickToday();
  });

  test('Handle UPI Flow', async () => {
    test.skip(!AMOUNTS.qr, 'No QR/UPI amount set — skipping');
    await collectionPage.handleUPIFlow(AMOUNTS.qr);
  });

  test('Fill NEFT Amount', async () => {
    test.skip(!AMOUNTS.neft, 'No NEFT amount set — skipping');
    await collectionPage.fillNeftAmount(AMOUNTS.neft);
  });

  test('Fill NEFT Reference Number', async () => {
    test.skip(!AMOUNTS.neft, 'No NEFT amount set — skipping');
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
