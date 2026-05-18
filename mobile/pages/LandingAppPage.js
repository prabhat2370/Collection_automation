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
        await this.waitAndClick(LOCATORS.postLoginHome.collectionCard, 30000);
    }
}
