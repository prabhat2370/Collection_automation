import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { BaseAppPage } from './BaseAppPage.js';
import { LOCATORS } from '../utils/locators.js';

export class LandingAppPage extends BaseAppPage {
    async isCollectionVisible() {
        return this.isDisplayed(LOCATORS.landing.collectionModule);
    }

    async tapCollection() {
        await this.waitAndClick(LOCATORS.landing.collectionModule);
    }

    async tapChequeBounce() {
        await this.waitAndClick(LOCATORS.landing.chequeBounceModule);
    }

    async selectSalesmanRole() {
        await this.waitAndClick(LOCATORS.roleSelect.salesman);
    }

    async tapPostLoginCollection() {
        try {
            await browser.waitUntil(
                async () => {
                    const spinner = await $('//*[contains(@content-desc, "Please wait")]');
                    return !(await spinner.isDisplayed().catch(() => false));
                },
                { timeout: 60000, interval: 1000, timeoutMsg: 'Post-login "Please wait..." spinner did not clear' }
            ).catch(() => {});
            await this.waitAndClick(LOCATORS.postLoginHome.collectionCard, 30000);
        } catch (e) {
            const src = await browser.getPageSource().catch(() => '');
            if (src) writeFileSync(resolve(process.cwd(), 'mobile', 'post_login_home_dump.xml'), src, 'utf8');
            throw e;
        }
    }
}
