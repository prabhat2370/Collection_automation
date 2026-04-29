import { URLS } from '../config/testData.js';

export class LoginPage {
  constructor(page) {
    this.page = page;

    this.emailInput    = this.page.locator('//input[@id="email"]');
    this.passwordInput = this.page.locator('//input[@id="password"]');
    this.loginBtn      = this.page.locator('//button[@id="login-btn"]');

    this.profileIcon   = this.page.locator('.sc-bczRLJ.sc-hlnMnd.ccyvke.dDbKHa');
    this.logoutBtn     = this.page.locator('#logout-btn');
    this.logoutYesBtn  = this.page.locator(":text('Yes')");
  }

  async navigate() {
    await this.page.goto(URLS.cdms);
  }

  async logout() {
    await this.page.locator('.ant-modal-wrap').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.profileIcon.click();
    await this.page.waitForTimeout(1500);
    await this.logoutBtn.click();
    await this.page.waitForTimeout(2000);
    await this.logoutYesBtn.last().click({ timeout: 5000 }).catch(() => {});
  }
}