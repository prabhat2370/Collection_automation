import { obcUpload } from '../pages/obcUpload';
import { LoginPage } from '../pages/LoginPage';
import { test, expect } from '@playwright/test';


test('OBC Upload', async ({ page }) => {

  const loginPage = new LoginPage(page);
  console.log("Step 1: Open Login Page");
  await loginPage.navigate();
  console.log("Step 2: Perform Login");
  await loginPage.login(
    'admin@ripplr.in',
    'M@ver!ck'
  );
  
  
  const obcupload = new obcUpload(page);

  console.log("Step 1: Open Adaptor Upload");
  const filePath = 'C:\\Users\\User\\Downloads\\preprodobc 2.xlsx';
  await obcupload.Upload(filePath);


  
  await page.waitForTimeout(20000);
});