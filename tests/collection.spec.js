import { CollectionPage } from '../pages/collectionPage';
import { test } from '@playwright/test';

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
    await collectionPage.fillMobile();
  });

  test('Click Submit Button', async () => {
    await collectionPage.clickSubmit();
  });

  test('Fill PIN', async () => {
    await collectionPage.fillPin();
  });

  test('Click Submit Button (PIN)', async () => {
    await collectionPage.clickSubmit();

  });

  test('Click Down Arrow', async () => {
    await collectionPage.clickDownArrow();
  });

  test('Fill Cash Amount', async () => {
    await collectionPage.fillCash('1');
  });

  test('Fill Cheque Amount', async () => {
    await collectionPage.fillChequeAmount('2');
  });

  test('Fill Cheque Reference Number', async () => {
    await collectionPage.fillChequeRefNumber();
  });

  test('Click Cheque Bank Dropdown', async () => {
    await collectionPage.clickChequeBankId();
  });

  test('Select Bank of Baroda', async () => {
    await collectionPage.selectBankOfBaroda();
  });

  test('Click Cheque Due Date', async () => {
    await collectionPage.clickChequeDueDate();
  });

  test('Select Today', async () => {
    await collectionPage.clickToday();
  });

  test('Click Scan QR', async () => {
    await collectionPage.clickScanQR();
  });

  test('Fill Amount', async () => {
    await collectionPage.fillAmount();
  });

  test('Click Add Manually Here', async () => {
    await collectionPage.clickAddManuallyHere();
  });

  test('Fill Reference Number', async () => {
    await collectionPage.fillReferenceNumber();
  });

  test('Click Add Manually', async () => {
    await collectionPage.clickAddManually();
  });

  test('Click Submit', async () => {
    await collectionPage.clickSubmitDiv();
  });

  test('Fill NEFT Amount', async () => {
    await collectionPage.fillNeftAmount();
  });

  test('Fill NEFT Reference Number', async () => {
    await collectionPage.fillNeftRefNumber();
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
    await collectionPage.clickSubmitBtn2();
  });

  test('Click Submit Collection', async () => {
    await collectionPage.clickSubmitCollection();
    await page.waitForTimeout(5000);
  });

});
