import { ObcUpload } from '../pages/obcUpload';
import { LoginPage } from '../pages/LoginPage';
import { test } from '@playwright/test';
import { USERS, FILE_PATHS } from '../config/testData.js';

test.describe.configure({ mode: 'serial' });

test.describe('OBC Upload', () => {

  let page, loginPage, obcupload;
  const filePath = FILE_PATHS.obcFile;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    obcupload = new ObcUpload(page);
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

  test('Click Adapter Uploads', async () => {
    await obcupload.clickAdapterUploads();
  });

  test('Click Upload Button', async () => {
    await obcupload.clickUpload();
  });

  test('Click Upload Type Dropdown', async () => {
    await obcupload.clickUploadTypeDropdown();
  });

  test('Select OBC', async () => {
    await obcupload.clickOBCOption();
  });

  test('Click FC Dropdown', async () => {
    await obcupload.clickFCDropdown();
  });

  test('Type BTM', async () => {
    await obcupload.typeBTM();
  });

  test('Select BTM', async () => {
    await obcupload.selectBTM();
  });

  test('Click Brand Dropdown', async () => {
    await obcupload.clickBrandDropdown();
  });

  test('Type BRIT', async () => {
    await obcupload.typeBRIT();
  });

  test('Select Britannia', async () => {
    await obcupload.selectBritannia();
  });

  test('Upload File', async () => {
    await obcupload.uploadFileAction(filePath);
  });

  test('Click Submit', async () => {
    await obcupload.clickSubmit();
  });

  test('Click Select File Type Dropdown', async () => {
    await obcupload.clickSelectFileTypeDropdown();
  });

  test('Click OBC Option', async () => {
    await obcupload.clickOBCOption();
  });

  test('Click Search (1st)', async () => {
    await obcupload.clickSearch();
    await page.waitForTimeout(6000);
  });

  test('Click Search (2nd)', async () => {
    await obcupload.clickSearch();
    await page.waitForTimeout(3000);

  });

  test('Click Status Icon', async () => {
    await obcupload.clickStatusIcon();
    await page.waitForTimeout(2000);

  });

  test('Click Close Button', async () => {
    await obcupload.clickClose();
    await page.waitForTimeout(5000);
  });

});
