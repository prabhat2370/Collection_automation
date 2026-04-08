export class SegPage {
    constructor(page) {
        this.page = page;

        this.allocationLink = this.page.getByRole('link', { name: 'Allocation' });
        this.fcDropdown = this.page.locator('#rc_select_0');
        this.selectedFC = this.page.getByText('BTML: BTM');
        this.brandDropdown = this.page.locator('#rc_select_1');
        this.selectedBrand = this.page.getByText('BRIT: Britannia');
        this.continueBtn = this.page.getByRole('button', { name: 'Continue' });
        this.salesmanDropdown = this.page.locator('#rc_select_3');
        this.selectedSalesman = this.page.getByText('Abdul -');
        this.searchBtn = this.page.getByRole('button', { name: 'Click here to Search' });
        this.InvCheckbox = this.page.locator(`//tr[td[6][contains(., 'INVstore2zz')]]//td[1]//input[@type='checkbox']`);
        this.assignBtn = this.page.getByText('Assign', { exact: true });
        this.submitBtn = this.page.getByRole('button', { name: 'Submit' });
    }

    async clickAllocationLink() { await this.allocationLink.click(); }
    async clickFCDropdown() { await this.fcDropdown.click(); }
    async selectBTM() { await this.selectedFC.click(); }
    async clickBrandDropdown() { await this.brandDropdown.click(); }
    async selectBritannia() { await this.selectedBrand.click(); }
    async clickContinue() { await this.continueBtn.click(); }
    async clickSalesmanDropdown() { await this.salesmanDropdown.click(); }
    async selectAbdul() { await this.selectedSalesman.click(); }
    async clickSearch() { await this.searchBtn.click(); }
    async scrollPage() { await this.InvCheckbox.scrollIntoViewIfNeeded(); }
    async clickCheckbox() { await this.InvCheckbox.click(); }
    async clickAssign() { await this.assignBtn.click(); }
    async clickSubmit() { await this.submitBtn.click(); }
}
