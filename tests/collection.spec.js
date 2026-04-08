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
    await page.waitForTimeout(5000);
  });

});
