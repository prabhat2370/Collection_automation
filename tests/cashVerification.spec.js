import { test } from '@playwright/test';
import { CashVerificationPage } from '../pages/cashVerificationPage';
import { ReturnToFCPage } from '../pages/returnToFCPage';
import { loginAs } from '../utils/auth.js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { PAYMENT_MODES } from '../test-data/cashier.js';
import { SEG } from '../test-data/seg.js';

test.describe.configure({ mode: 'serial' });

test.describe('Cashier Verification Flow', () => {

  let page, cashVerificationPage, returnToFCPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    cashVerificationPage = new CashVerificationPage(page);
    returnToFCPage = new ReturnToFCPage(page);
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

  test('Cashier verification for current SEG.verificationType', async () => {
    test.setTimeout(180000);

    await test.step('Login as Cash', async () => {
      await loginAs(page, 'cash');
    });

    await test.step('Open Collection Settlement', async () => {
      await cashVerificationPage.clickCollectionSettlement();
    });

    if (SEG.verificationType === 'D') {
      await test.step('Open Deliverer tab and pick delivery row', async () => {
        await page.waitForTimeout(3000);
        await cashVerificationPage.clickDeliverer();
        await cashVerificationPage.clickDeliveryRow();
      });
    } else {
      await test.step('Pick salesman settle row', async () => {
        await cashVerificationPage.clickSalesmanSettle();
      });
    }

    await test.step('Start verification', async () => {
      await cashVerificationPage.clickStartVerification();
    });

    await test.step('Run cash flow', async () => {
      await cashVerificationPage.runCashFlow();
    });

    await test.step('Run cheque flow', async () => {
      await cashVerificationPage.runChequeFlow();
    });

    if (PAYMENT_MODES.upi !== 'NA') {
      await test.step('Insert UPI bank statement (DB) and reload', async () => {
        await cashVerificationPage.runUPIInsert();
        await page.reload();
      });
    }

    await test.step('Run UPI flow', async () => {
      await cashVerificationPage.runUPIFlow();
    });

    if (PAYMENT_MODES.neft !== 'NA') {
      await test.step('Insert NEFT bank statement (DB) and reload', async () => {
        await cashVerificationPage.runNEFTInsert();
        await page.reload();
      });
    }

    await test.step('Run NEFT flow', async () => {
      await cashVerificationPage.runNEFTFlow();
      await page.waitForTimeout(10000);
    });

    if (SEG.verificationType === 'D') {
      await test.step('Subtract collection date for all invoices (DB)', async () => {
        await returnToFCPage.subtractCollectionDatesForAllInvoices();
      });

      await test.step("Switch verificationType 'D' → 'S' in seg.js (in-memory + persisted)", async () => {
        SEG.verificationType = 'S';
        const segDataPath = resolve(process.cwd(), 'test-data/seg.js');
        const content = readFileSync(segDataPath, 'utf-8');
        const updated = content.replace(/verificationType:\s*'D'/, "verificationType: 'S'");
        writeFileSync(segDataPath, updated);
        console.log("verificationType switched from 'D' → 'S' in test-data/seg.js (in-memory + file persisted)");
      });
    }
  });

});
