export class obcUpload{
    constructor (page){
        this.page=page;

        this.adapterUploads = this.page.locator("//span[@class='ant-menu-title-content']//a[normalize-space()='Adapter Uploads']");
        this.upload= this.page.locator("button:has-text('Upload')");
        this.uploadType = this.page.locator("span.ant-select-selection-item");
        this.creditAdjustment = this.page.locator("//div[@title='Credit Adjustment']");
        this.obc = this.page.locator("//div[@title='OBC']");
        this.fcOption = this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4);
        this.selectedFC = this.page.getByText('BTML: BTM');
        this.BrandOption = this.page.locator("//input[@id='brand']");
        this.selectedBrand = this.page.getByText('BRIT: Britannia')
        this.uploadFile = this.page.locator(":text('Upload a File')");
            
    }


    async Upload(filePath){

        console.log("Clicking AdapterUploads button...");
        await this.adapterUploads.click();

        console.log("Clicking Upload button...");
        await this.upload.click();

        console.log("Clicking Upload type dropdown...");
        await this.uploadType.click();

        console.log("Clicking obc option...");
        await this.obc.click();

        console.log("Clicking FC dropdown...");
        await this.fcOption.click();

        console.log("Searching BTM...");
        await this.page.keyboard.type('BTM');

        console.log("Selecting BTM option...");
        await this.selectedFC.click();

        console.log("Clicking Brand dropdown...");
        await this.BrandOption.click();

        console.log("Searching BRIT...");
        await this.page.keyboard.type('BRIT');

        console.log("Selecting BRIT option...");
        await this.selectedBrand.click();

        console.log("Clicking on Upload file button and selecting file...");
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.uploadFile.click(),
        ]);
        await fileChooser.setFiles(filePath);

    }
}