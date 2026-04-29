import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ObcUpload } from '../pages/obcUpload';
import { SOUploadPage } from '../pages/soUploadPage';
import { DeliveryAllocationPage } from '../pages/deliveryAllocationPage';
import { CollectionPage } from '../pages/collectionPage';
import { ReturnToFCPage } from '../pages/returnToFCPage';
import { SegPage } from '../pages/segPage';
import { SegVerificationPage } from '../pages/segVerificationPage';
import { CashVerificationPage } from '../pages/cashVerificationPage';
import {
  USERS, FILE_PATHS, DELIVERY, RFC_COLLECTION,
  RFC_UPLOAD_FILES, AMOUNTS, PAYMENT_MODES,
} from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('Smoke Test', () => {

  let page;
  let loginPage, obcupload, soUploadPage, deliveryAllocationPage;
  let collectionPage, returnToFCPage, segPage, segVerificationPage, cashVerificationPage;

  test.beforeAll(async ({ browser }) => {
    page                   = await browser.newPage();
    loginPage              = new LoginPage(page);
    obcupload              = new ObcUpload(page);
    soUploadPage           = new SOUploadPage(page);
    deliveryAllocationPage = new DeliveryAllocationPage(page);
    collectionPage         = new CollectionPage(page);
    returnToFCPage         = new ReturnToFCPage(page);
    segPage                = new SegPage(page);
    segVerificationPage    = new SegVerificationPage(page);
    cashVerificationPage   = new CashVerificationPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // 1. Login
  test('Login', async () => {
    await loginPage.navigate();
    await loginPage.emailInput.fill(USERS.obc.email);
    await loginPage.passwordInput.fill(USERS.obc.password);
    await loginPage.loginBtn.click();
  });

  // // 2. SO Upload
  // test('SO Upload', async () => {
  //   test.setTimeout(120000);
  //   await soUploadPage.clickAdapterUploads();
  //   await soUploadPage.clickUpload();
  //   await soUploadPage.clickUploadTypeDropdown();
  //   await soUploadPage.selectSalesOrder();
  //   await soUploadPage.clickFCDropdown();
  //   await soUploadPage.typeBTM();
  //   await soUploadPage.selectBTM();
  //   await soUploadPage.clickBrandDropdown();
  //   await soUploadPage.typeBRIT();
  //   await soUploadPage.selectBritannia();
  //   await soUploadPage.uploadSOReport(FILE_PATHS.soReport);
  //   await soUploadPage.uploadInvoiceReport(FILE_PATHS.invoiceReport);
  //   await soUploadPage.uploadSalesRegister(FILE_PATHS.salesRegister);
  //   await soUploadPage.clickSubmit();
  //   await soUploadPage.waitForFreshUploadAndClickStatus();
  //   await page.waitForTimeout(3000);
  //   await soUploadPage.captureInvoiceNumbers();
  // });

  // 3. Delivery Allocation
  // test('Delivery Allocation', async () => {
  //   test.setTimeout(60000);
  //   await deliveryAllocationPage.clickLogisticsManagement();
  //   await deliveryAllocationPage.clickDeliveryAllocation();
  //   await deliveryAllocationPage.clickCreateDeliveryAllocation();
  //   await deliveryAllocationPage.selectAndAllocateInvoices();
  //   await page.waitForTimeout(1000);
  //   await deliveryAllocationPage.handleAllocationModal();
  //   await deliveryAllocationPage.clickSubmit();
  //   await deliveryAllocationPage.clickPrimaryButton();
  //   await deliveryAllocationPage.clickConfirm();
  //   await page.waitForTimeout(5000);
  // });

  // 4. Return to FC
  test('Return to FC', async () => {
    test.setTimeout(600000);
    await returnToFCPage.clickLogisticsManagement();
    await returnToFCPage.clickReturnToFC();
    await returnToFCPage.clickEyeIcon(DELIVERY.driverName);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await returnToFCPage.processAllInvoicesFlow(DELIVERY.deliveryStatus, RFC_COLLECTION);
    await returnToFCPage.verifyAllInvoices();
    await returnToFCPage.uploadRFCFiles(RFC_UPLOAD_FILES);
    await returnToFCPage.clickVerifyRFC();
    await page.waitForTimeout(6000);
    await returnToFCPage.subtractCollectionDatesForAllInvoices();
  });

  // 5. OBC Upload
  test('OBC Upload', async () => {
    test.setTimeout(120000);
    await obcupload.clickAdapterUploads();
    await obcupload.clickUpload();
    await obcupload.clickUploadTypeDropdown();
    await obcupload.clickOBCOption();
    await obcupload.clickFCDropdown();
    await obcupload.typeBTM();
    await obcupload.selectBTM();
    await obcupload.clickBrandDropdown();
    await obcupload.typeBRIT();
    await obcupload.selectBritannia();
    await obcupload.uploadFileAction(FILE_PATHS.obcFile);
    await obcupload.clickSubmit();
    await obcupload.clickSelectFileTypeDropdown();
    await obcupload.clickOBCOption();
    await obcupload.clickSearch();
    await page.waitForTimeout(6000);
    await obcupload.clickSearch();
    await page.waitForTimeout(3000);
    await obcupload.clickStatusIcon();
    await page.waitForTimeout(2000);
    await obcupload.clickClose();
    await page.waitForTimeout(5000);
    await loginPage.logout();
  });

  // 6. Seg
  test('Seg', async () => {
    test.setTimeout(60000);
    await loginPage.navigate();
    await loginPage.emailInput.fill(USERS.seg.email);
    await loginPage.passwordInput.fill(USERS.seg.password);
    await loginPage.loginBtn.click();
    await segPage.clickAllocationLink();
    await segPage.clickFCDropdown();
    await segPage.selectBTM();
    await segPage.clickBrandDropdown();
    await segPage.selectBritannia();
    await segPage.clickContinue();
    await segPage.clickSalesmanDropdown();
    await segPage.selectAbdul();
    await segPage.clickSearch();
    await page.waitForTimeout(5000);
    await segPage.scrollPage();
    await segPage.clickCheckbox();
    await segPage.clickAssign();
    await segPage.clickSubmit();
    await page.waitForTimeout(5000);
  });

  // 7. Collection
  test('Collection', async () => {
    test.setTimeout(120000);
    await collectionPage.navigate();
    await collectionPage.fillMobile(USERS.collection.mobile);
    await collectionPage.clickSubmit();
    await collectionPage.fillPin(USERS.collection.pin);
    await collectionPage.clickSubmit();
    await collectionPage.clickDownArrow();
    if (AMOUNTS.cash) await collectionPage.fillCash(AMOUNTS.cash);
    if (AMOUNTS.cheque) {
      await collectionPage.fillChequeAmount(AMOUNTS.cheque);
      await collectionPage.fillChequeRefNumber();
      await collectionPage.clickChequeBankId();
      await collectionPage.selectRandomBank();
      await collectionPage.clickChequeDueDate();
      await collectionPage.clickToday();
    }
    if (AMOUNTS.qr) await collectionPage.handleUPIFlow(AMOUNTS.qr);
    if (AMOUNTS.neft) {
      await collectionPage.fillNeftAmount(AMOUNTS.neft);
      await collectionPage.fillNeftRefNumber(AMOUNTS.neft);
    }
    await collectionPage.clickAuto();
    await collectionPage.clickSplitReason();
    await collectionPage.selectShopClosed();
    await collectionPage.clickFinalSubmit();
    await collectionPage.clickSubmitCollection();
    await collectionPage.clickConfirmation();
    await page.waitForTimeout(5000);
  });

  // 8. Seg Verification
  test('Seg Verification', async () => {
    test.setTimeout(60000);
    await loginPage.navigate();
    await loginPage.emailInput.fill(USERS.seg.email);
    await loginPage.passwordInput.fill(USERS.seg.password);
    await loginPage.loginBtn.click();
    await segVerificationPage.clickVerification();
    await segVerificationPage.clickSalesmanRow();
    await segVerificationPage.clickStartVerification();
    await segVerificationPage.runFlow();
    await page.waitForTimeout(5000);
    await loginPage.logout();
  });

  // 9. Cash Verification
  test('Cash Verification', async () => {
    test.setTimeout(120000);
    await loginPage.navigate();
    await loginPage.emailInput.fill(USERS.cash.email);
    await loginPage.passwordInput.fill(USERS.cash.password);
    await loginPage.loginBtn.click();
    await cashVerificationPage.clickCollectionSettlement();
    await cashVerificationPage.clickSalesmanSettle();
    await cashVerificationPage.clickStartVerification();
    await cashVerificationPage.runCashFlow();
    await cashVerificationPage.runChequeFlow();
    if (PAYMENT_MODES.upi !== 'NA') {
      await cashVerificationPage.runUPIInsert();
      await page.reload();
    }
    await cashVerificationPage.runUPIFlow();
    if (PAYMENT_MODES.neft !== 'NA') {
      await cashVerificationPage.runNEFTInsert();
      await page.reload();
    }
    await cashVerificationPage.runNEFTFlow();
    await page.waitForTimeout(5000);
  });

});
