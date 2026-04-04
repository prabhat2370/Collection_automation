export class LoginPage {
  constructor(page) {
    this.page = page;

    this.emailInput = this.page.locator('//input[@id="email"]');
    this.passwordInput = this.page.locator('//input[@id="password"]');
    this.loginBtn = this.page.locator('//button[@id="login-btn"]');
    this.adapterUploadsLink = this.page.locator('a').filter({ hasText: 'Adapter Uploads' }).first();
  }

  async navigate() {
    console.log("Navigating to URL...");
    await this.page.goto('https://cdms-preprod.ripplr.in/login');
  }

  async login(email, password) {
    console.log("Filling email...");
    await this.emailInput.fill(email);

    console.log("Filling password...");
    await this.passwordInput.fill(password);

    console.log("Clicking login button...");
    await this.loginBtn.click();
  }

  
}