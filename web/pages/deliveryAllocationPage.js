import { readFileSync, writeFileSync, existsSync } from 'fs';
import { DELIVERY } from '../../test-data/deliveryAllocation.js';
import { resolve } from 'path';

const SO_INVOICES_FILE = resolve(process.cwd(), 'test-data/runtime/soInvoices.json');
const COLLECTION_REFS_FILE = resolve(process.cwd(), 'test-data/runtime/collectionRefs.json');

function generateRandomVehicleNo() {
    const randomAlpha = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return chars[Math.floor(Math.random() * 26)] + chars[Math.floor(Math.random() * 26)];
    };
    const randomDigits = (n) => {
        let s = '';
        for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
        return s;
    };
    return `${randomAlpha()}${randomDigits(2)}${randomAlpha()}${randomDigits(4)}`;
}

function persistVehicleNo(vehicleNo) {
    let data = {};
    if (existsSync(COLLECTION_REFS_FILE)) {
        try { data = JSON.parse(readFileSync(COLLECTION_REFS_FILE, 'utf-8')); } catch { data = {}; }
    }
    data.delivery = { ...(data.delivery || {}), vehicleNo };
    writeFileSync(COLLECTION_REFS_FILE, JSON.stringify(data, null, 2));
}

export class DeliveryAllocationPage {
    constructor(page) {
        this.page = page;

        this.logisticsManagement = this.page.locator("//span[normalize-space()='Logistics Management']");
        this.deliveryAllocation = this.page.locator("//a[normalize-space()='Delivery Allocation']");
        this.createDeliveryAllocation = this.page.locator(":text('Create Delivery Allocation')");
    }

    async clickLogisticsManagement() { await this.logisticsManagement.click(); }
    async clickDeliveryAllocation() { await this.deliveryAllocation.click(); }
    async clickCreateDeliveryAllocation() { await this.createDeliveryAllocation.click(); }

    async selectInvoices() {
        const invoices = JSON.parse(readFileSync(SO_INVOICES_FILE, 'utf-8'));
        console.log('Invoices to select:', invoices);

        // Wait for table to load with actual data
        await this.page.waitForFunction(() => {
            const rows = document.querySelectorAll('table tbody tr');
            return rows.length > 0 && [...rows[0].querySelectorAll('td')].some(td => td.innerText.trim() !== '');
        }, { timeout: 10000 });

        for (const invoice of invoices) {
            const checkbox = this.page.locator(`//tr[td[contains(., '${invoice}')]]//td[1]//input[@type='checkbox']`);
            const found = await checkbox.isVisible().catch(() => false);
            if (found) {
                await checkbox.click();
                console.log(`Selected invoice: ${invoice}`);
            } else {
                console.log(`Invoice not found, skipping: ${invoice}`);
            }
        }
    }

    async clickAllocateVehicle() {
        await this.page.locator(":text('Allocate Vehicle')").click();
    }

    // Back-compat wrapper: select invoices then click Allocate Vehicle in one call.
    async selectAndAllocateInvoices() {
        await this.selectInvoices();
        await this.clickAllocateVehicle();
    }

    async handleAllocationModal() {
        

        const skip = this.page.locator(":text('Skip')");
        const skipFound = await skip.isVisible().catch(() => false);
        if (skipFound) await skip.click();

        await this.page.locator("//div[@name='pick_type']//span[@class='ant-select-selection-search']").click();
        await this.page.locator("//div[contains(text(),'Both')]").click();
        await this.page.locator("div[name='vehicle_type'] span[class='ant-select-selection-search']").click();
        await this.page.locator("//div[@title='Adhoc']").click();
        await this.page.locator("div[name='allocation_type'] span[class='ant-select-selection-search']").click();
        await this.selectByTypingOption('Regular');
        DELIVERY.vehicleNo = generateRandomVehicleNo();
        persistVehicleNo(DELIVERY.vehicleNo);
        console.log(`[DeliveryAllocation] Generated random vehicle no: ${DELIVERY.vehicleNo} (persisted to test-data/runtime/collectionRefs.json)`);
        await this.page.locator("//input[@id='vehicle_no']").fill(DELIVERY.vehicleNo);
        await this.page.locator("//input[@id='driver_name']").fill(DELIVERY.driverName);
        await this.page.locator("//input[@id='vendor']").fill(DELIVERY.vendor);
        await this.page.locator("//input[@id='driver_mobile']").fill(DELIVERY.driverMobile);
        await this.selectDeliveryBoy(DELIVERY.deliveryBoy);
    }

    // Ant Design renders these dropdowns as virtual lists: only the options in the visible
    // window exist in the DOM (and can flicker in/out as the list recycles), so a bare click
    // on the title locator is unreliable — scroll the (already open) dropdown until the option
    // renders stably, then click it.
    async selectVirtualOption(title) {
        const option = this.page.locator(`//div[@title='${title}']`).first();
        const dropdown = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
        await dropdown.waitFor({ state: 'visible', timeout: 10000 });

        for (let i = 0; i < 25 && !(await option.isVisible().catch(() => false)); i++) {
            await dropdown.hover();
            await this.page.mouse.wheel(0, 150);
            await this.page.waitForTimeout(150);
        }

        await option.waitFor({ state: 'visible', timeout: 10000 });
        await option.click();
    }

    // Some selects (e.g. Allocation Type) keep re-rendering their virtual list, so a bare
    // click on the option resolves but never "stabilizes" (Playwright retries actionability
    // until the surrounding test times out). Typing into the select's own search input
    // filters the list down to a single row instead, sidestepping the virtualization dance
    // entirely. Assumes the dropdown trigger was just clicked, so its search input has focus.
    async selectByTypingOption(title) {
        await this.page.keyboard.type(title);
        await this.page.waitForTimeout(300);
        // Scope to the open dropdown and require :visible — an unscoped `//div[@title=...]`
        // can resolve to a hidden virtualization placeholder row sharing the same title.
        const dropdown = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
        const option = dropdown.locator(`div[title='${title}']:visible`).first();
        await option.waitFor({ state: 'visible', timeout: 10000 });
        await option.click();
    }

    async selectDeliveryBoy(name) {
        await this.page.locator("div[name='delivery_boy'] span[class='ant-select-selection-search']").click();
        await this.selectVirtualOption(name);
    }

    async clickSubmit() {
        await this.page.locator('button').filter({ hasText: 'Submit' }).last().click();
    }

    async clickPrimaryButton() {
        await this.page.locator('#loader.show').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        const dialogConfirm = this.page.locator('.ant-modal').getByRole('button', { name: 'Confirm' });
        await dialogConfirm.waitFor({ state: 'visible', timeout: 10000 });
        await dialogConfirm.click();
    }

    async clickConfirm() {
        await this.page.locator('#loader.show').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        await this.page.getByRole('button', { name: 'Confirm' }).last().click();
    }

    // Final "Confirm vehicle allocation" modal — "Vehicle will be allocated once you confirm
    // and we will generate E way bill for all invoices." Doesn't always appear (depends on
    // allocation type / E-Way Bill requirements), so this is a conditional last step: click
    // Confirm only if it shows up within timeoutMs.
    get confirmVehicleAllocationModal() {
        return this.page.locator('.ant-modal').filter({ hasText: 'Confirm vehicle allocation' });
    }

    async clickConfirmVehicleAllocationIfPresent(timeoutMs = 5000) {
        const confirmBtn = this.confirmVehicleAllocationModal.getByRole('button', { name: 'Confirm' });
        try {
            await confirmBtn.waitFor({ state: 'visible', timeout: timeoutMs });
            await confirmBtn.click();
            console.log('"Confirm vehicle allocation" modal appeared — Confirm clicked.');
            return true;
        } catch {
            console.log('"Confirm vehicle allocation" modal not shown — skipping.');
            return false;
        }
    }

    // Matches both known blocking-error variants — same underlying cause (a stale/open
    // RFC against this FC's earlier vehicle allocations):
    //  - "Vehicle allocation is blocked because an RFC for this FC has been open for
    //     2 days or more." (seen after the final Confirm)
    //  - Modal titled "Vehicle allocation blocked": "This allocation is blocked because
    //     RFC is not closed for <vehicle no(s)> ..." (seen right after clicking
    //     Allocate Vehicle, before the vehicle-details modal opens)
    // Both contain the substring "allocation is blocked because".
    get rfcBlockedError() {
        return this.page.locator(":text('allocation is blocked because')");
    }

    /**
     * Detects the stale-RFC "allocation is blocked" error (either variant above).
     * Returns true if shown within timeoutMs.
     */
    async isRfcBlockedErrorVisible(timeoutMs = 3000) {
        try {
            await this.rfcBlockedError.first().waitFor({ state: 'visible', timeout: timeoutMs });
            console.log('"...allocation is blocked..." (stale RFC) error detected.');
            return true;
        } catch {
            return false;
        }
    }

    async dismissRfcBlockedError() {
        const okBtn = this.page.locator('.ant-modal, .ant-notification').getByRole('button', { name: /OK|Close/i }).first();
        const found = await okBtn.isVisible().catch(() => false);
        if (found) await okBtn.click();
    }
}
