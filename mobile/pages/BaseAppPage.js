import { waitAndClick, waitAndFill, isDisplayed, hideKeyboard, scrollToText, tapByText } from '../utils/appiumHelpers.js';

export class BaseAppPage {
    async waitAndClick(selector, timeout) { return waitAndClick(selector, timeout); }
    async waitAndFill(selector, value, timeout) { return waitAndFill(selector, value, timeout); }
    async isDisplayed(selector, timeout) { return isDisplayed(selector, timeout); }
    async hideKeyboard() { return hideKeyboard(); }
    async scrollToText(text, maxSwipes) { return scrollToText(text, maxSwipes); }
    async tapByText(text) { return tapByText(text); }
    async pause(ms) { return browser.pause(ms); }
}
