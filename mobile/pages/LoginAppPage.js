import { BaseAppPage } from './BaseAppPage.js';
import { LOCATORS } from '../utils/locators.js';

export class LoginAppPage extends BaseAppPage {
    async fillMobile(mobile) {
        await this.waitAndFill(LOCATORS.login.mobileInput, mobile);
    }

    async clickNext() {
        await this.waitAndClick(LOCATORS.login.nextBtn);
    }

    async fillPin(pin) {
        await this.waitAndFill(LOCATORS.login.pinInput, pin);
    }

    async clickLogin() {
        await this.waitAndClick(LOCATORS.login.loginBtn);
    }

    async login(mobile, pin) {
        await this.fillMobile(mobile);
        await this.hideKeyboard();
        await this.clickNext();
        await this.fillPin(pin);
        await this.hideKeyboard();
        await browser.pause(1500);
        await this.clickLogin();
    }
}
