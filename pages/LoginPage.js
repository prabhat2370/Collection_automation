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
    await this.profileIcon.click();
    await this.logoutBtn.click();
    await this.logoutYesBtn.click();
  }
}