import { test } from '@playwright/test';
import { ObcUpload } from '../pages/obcUpload';
import { loginAs } from '../utils/auth.js';
import { OBC_UPLOAD_FILE } from '../test-data/obcUpload.js';

test.describe.configure({ mode: 'serial' });

test.describe('OBC Upload', () => {

  let page, obcupload;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    obcupload = new ObcUpload(page);
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

  test('Upload OBC file for CMBT/Britannia', async () => {
    test.setTimeout(120000);

    await test.step('Login as OBC admin', async () => {
      await loginAs(page, 'obc');
    });

    await test.step('Open upload form and select OBC type', async () => {
      await obcupload.clickAdapterUploads();
      await obcupload.clickUpload();
      await obcupload.clickUploadTypeDropdown();
      await obcupload.clickOBCOption();
    });

    await test.step('Select FC = CMBT, Brand = Britannia', async () => {
      await obcupload.clickFCDropdown();
      await obcupload.typeCMBT();
      await obcupload.selectCMBT();
      await obcupload.clickBrandDropdown();
      await obcupload.typeBRIT();
      await obcupload.selectBritannia();
    });

    await test.step('Upload file and submit', async () => {
      await obcupload.uploadFileAction(OBC_UPLOAD_FILE);
      await obcupload.clickSubmit();
    });

    await test.step('Filter status list by OBC and search', async () => {
      await obcupload.clickSelectFileTypeDropdown();
      await obcupload.clickOBCOption();
      await obcupload.clickSearch();
      await page.waitForTimeout(6000);
      await obcupload.clickSearch();
      await page.waitForTimeout(3000);
    });

    await test.step('Open status detail and close', async () => {
      await obcupload.clickStatusIcon();
      await page.waitForTimeout(2000);
      await obcupload.clickClose();
    });
  });

});
