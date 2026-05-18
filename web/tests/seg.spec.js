import { test } from '@playwright/test';
import { SegPage } from '../pages/segPage';
import { loginAs } from '../../utils/auth.js';

test.describe.configure({ mode: 'serial' });

test.describe('Seg Flow', () => {

  let page, segPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    segPage = new SegPage(page);
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

  test('Allocate invoice to salesman for CMBT Britannia', async () => {
    await test.step('Login as Seg', async () => {
      await loginAs(page, 'seg');
    });

    await test.step('Open Allocation page', async () => {
      await segPage.clickAllocationLink();
    });

    await test.step('Select FC = CMBT, Brand = Britannia, Continue', async () => {
      await segPage.clickFCDropdown();
      await segPage.selectCMBT();
      await segPage.clickBrandDropdown();
      await segPage.selectBritannia();
      await segPage.clickContinue();
    });

    await test.step('Pick salesman and search', async () => {
      await segPage.clickSalesmanDropdown();
      await segPage.selectAbdul();
      await segPage.clickSearch();
      await page.waitForTimeout(5000);
    });

    await test.step('Select invoice checkbox, assign and submit', async () => {
      await segPage.scrollPage();
      await segPage.clickCheckbox();
      await segPage.clickAssign();
      await segPage.clickSubmit();
      await page.waitForTimeout(5000);
    });
  });

});
