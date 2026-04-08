export class CollectionPage {
    constructor(page) {
        this.page = page;

        this.mobileInput = this.page.locator("input[name='phone']");
        this.pinInput = this.page.locator('#pin');
        this.submitBtn = this.page.locator('#form-submit');
        
    }

    async navigate() { await this.page.goto('https://collection-preprod.ripplr.in/login'); }
    async fillMobile() { await this.mobileInput.fill('9739492646'); }
    async fillPin() { await this.pinInput.fill('1234'); }
    async clickSubmit() { await this.submitBtn.click(); }

}
