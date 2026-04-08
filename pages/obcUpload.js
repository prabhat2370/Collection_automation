export class obcUpload {
    constructor(page) {
        this.page = page;

        this.adapterUploads = this.page.locator("//span[@class='ant-menu-title-content']//a[normalize-space()='Adapter Uploads']");
        this.upload = this.page.locator("button:has-text('Upload')");
        this.uploadType = this.page.locator("span.ant-select-selection-item");
        this.creditAdjustment = this.page.locator("//div[@title='Credit Adjustment']");
        this.obc = this.page.locator("//div[@title='OBC']");
        this.fcOption = this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4);
        this.selectedFC = this.page.getByText('BTML: BTM');
        this.BrandOption = this.page.locator("//input[@id='brand']");
        this.selectedBrand = this.page.getByText('BRIT: Britannia');
        this.uploadFile = this.page.locator(":text('Upload a File')");
        this.submitBtn = this.page.getByRole('button', { name: 'Submit' });
        this.selectFileTypeDropdown = this.page.locator('div').filter({ hasText: /^Select File Type$/ }).nth(1);
        this.obcOption = this.page.locator("//div[@title='OBC']");
        this.searchBtn = this.page.getByRole('button', { name: 'Search' });
        this.statusIcon = this.page.locator("tbody tr:nth-child(1) td:nth-child(7) div:nth-child(1) div:nth-child(4) span:nth-child(1) svg");
        this.closeBtn = this.page.getByRole('button', { name: 'Close' });
    }

    async clickAdapterUploads() { await this.adapterUploads.click(); }
    async clickUpload() { await this.upload.click(); }
    async clickUploadTypeDropdown() { await this.uploadType.click(); }
    async selectOBC() { await this.obc.click(); }
    async clickFCDropdown() { await this.fcOption.click(); }
    async typeBTM() { await this.page.keyboard.type('BTM'); }
    async selectBTM() { await this.selectedFC.click(); }
    async clickBrandDropdown() { await this.BrandOption.click(); }
    async typeBRIT() { await this.page.keyboard.type('BRIT'); }
    async selectBritannia() { await this.selectedBrand.click(); }
    async uploadFileAction(filePath) {
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.uploadFile.click(),
        ]);
        await fileChooser.setFiles(filePath);
    }
    async clickSubmit() { await this.submitBtn.click(); }
    async clickSelectFileTypeDropdown() { await this.selectFileTypeDropdown.click(); }
    async clickOBCOption() { await this.obcOption.click(); }
    async clickSearch() { await this.searchBtn.click(); }
    async clickStatusIcon() { await this.statusIcon.click(); }
    async clickClose() { await this.closeBtn.click(); }
}
