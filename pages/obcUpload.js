import { OBC } from '../config/testData.js';

export class ObcUpload {
    constructor(page) {
        this.page = page;

        this.adapterUploads = this.page.locator("//span[@class='ant-menu-title-content']//a[normalize-space()='Adapter Uploads']");
        this.upload = this.page.locator("button:has-text('Upload')");
        this.uploadType = this.page.locator("span.ant-select-selection-item");
        this.fcOption = this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4);
        this.selectedFC = this.page.getByText(OBC.fc);
        this.brandOption = this.page.locator("//input[@id='brand']");
        this.selectedBrand = this.page.getByText(OBC.brand);
        this.uploadFile = this.page.locator(":text('Upload a File')");
        this.submitBtn = this.page.getByRole('button', { name: 'Submit' });
        this.selectFileTypeDropdown = this.page.locator('div').filter({ hasText: /^Select File Type$/ }).nth(1);
        this.obcOption = this.page.locator("//div[@title='OBC']");
        this.searchBtn = this.page.getByRole('button', { name: 'Search' });
        this.statusIcon = this.page.locator("//tbody/tr[1]/td[7]/div[1]/div[4]//span[@role='img']");
        this.closeBtn = this.page.getByRole('button', { name: 'Close' });
    }

    async clickAdapterUploads() { await this.adapterUploads.click(); }
    async clickUpload() { await this.upload.click(); }
    async clickUploadTypeDropdown() { await this.uploadType.click(); }
    async clickFCDropdown() { await this.fcOption.click(); }
    async typeBTM() { await this.page.keyboard.type('BTM'); }
    async selectBTM() { await this.selectedFC.click(); }
    async clickBrandDropdown() { await this.brandOption.click(); }
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
    async clickStatusIcon() { await this.statusIcon.dispatchEvent('click'); }
    async clickClose() { await this.closeBtn.click(); }
}
