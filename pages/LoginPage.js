import { URLS } from '../config/testData.js';

export class LoginPage {
  constructor(page) {
    this.page = page;

    this.emailInput = this.page.locator('//input[@id="email"]');
    this.passwordInput = this.page.locator('//input[@id="password"]');
    this.loginBtn = this.page.locator('//button[@id="login-btn"]');
  }

  async navigate() {
    await this.page.goto(URLS.cdms);
  }
}