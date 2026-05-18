export class BasePage {
    constructor(page) {
        this.page = page;
    }

    async waitForLoader(timeout = 15000) {
        await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {});
        const loader = this.page.locator('#loader.show');
        if (await loader.isVisible().catch(() => false)) {
            await loader.waitFor({ state: 'hidden', timeout }).catch(() => {});
        }
    }

    async selectAntDropdown(triggerLocator, searchText, optionText) {
        await triggerLocator.click();
        await this.page.waitForTimeout(300);
        if (searchText) {
            await this.page.keyboard.type(searchText);
            await this.page.waitForTimeout(300);
        }
        await this.page.getByText(optionText, { exact: true }).first().click();
    }
}
