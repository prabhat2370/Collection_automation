import { test } from '@playwright/test';
import { CollectionPage } from '../pages/collectionPage';
import { loginAs } from '../../utils/auth.js';
import { AMOUNTS } from '../../test-data/collection.js';

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

  test('Submit collection for current AMOUNTS', async () => {
    test.setTimeout(120000);

    await test.step('Login with mobile + PIN', async () => {
      await loginAs(page, 'collection');
    });

    await test.step('Open invoice details (down arrow)', async () => {
      await collectionPage.clickDownArrow();
    });

    if (AMOUNTS.cash) {
      await test.step('Fill cash amount', async () => {
        await collectionPage.fillCash(AMOUNTS.cash);
      });
    }

    if (AMOUNTS.cheque) {
      await test.step('Fill cheque section', async () => {
        await collectionPage.fillChequeAmount(AMOUNTS.cheque);
        await collectionPage.fillChequeRefNumber(AMOUNTS.cheque);
        await collectionPage.clickChequeBankId();
        await collectionPage.selectRandomBank();
        await collectionPage.clickChequeDueDate();
        await collectionPage.clickToday();
      });
    }

    if (AMOUNTS.qr) {
      await test.step('Handle UPI flow', async () => {
        await collectionPage.handleUPIFlow(AMOUNTS.qr);
      });
    }

    if (AMOUNTS.neft) {
      await test.step('Fill NEFT section', async () => {
        await collectionPage.fillNeftAmount(AMOUNTS.neft);
        await collectionPage.fillNeftRefNumber(AMOUNTS.neft);
      });
    }

    await test.step('Submit collection (Auto split, Shop Closed) and confirm', async () => {
      await collectionPage.clickAuto();
      await collectionPage.clickSplitReason();
      await collectionPage.selectShopClosed();
      await collectionPage.clickFinalSubmit();
      await collectionPage.clickSubmitCollection();
      await collectionPage.clickConfirmation();
      await page.waitForTimeout(5000);
    });
  });

});
