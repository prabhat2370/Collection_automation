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

    async selectAndAllocateInvoices() {
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
        await this.page.locator(":text('Allocate Vehicle')").click();
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
        await this.page.locator("//div[@title='Eco']").click();
        DELIVERY.vehicleNo = generateRandomVehicleNo();
        persistVehicleNo(DELIVERY.vehicleNo);
        console.log(`[DeliveryAllocation] Generated random vehicle no: ${DELIVERY.vehicleNo} (persisted to test-data/runtime/collectionRefs.json)`);
        await this.page.locator("//input[@id='vehicle_no']").fill(DELIVERY.vehicleNo);
        await this.page.locator("//input[@id='driver_name']").fill(DELIVERY.driverName);
        await this.page.locator("//input[@id='vendor']").fill(DELIVERY.vendor);
        await this.page.locator("//input[@id='driver_mobile']").fill(DELIVERY.driverMobile);
        await this.page.locator("div[name='delivery_boy'] span[class='ant-select-selection-search']").click();
        await this.page.locator("//div[@title='Delivery Boy']").click();
    }

    async clickSubmit() {
        await this.page.locator('button').filter({ hasText: 'Submit' }).last().click();
    }

    async clickPrimaryButton() {
        await this.page.locator("//button[@type='primary']").click();
    }

    async clickConfirm() {
        await this.page.getByText('Confirm').click();
    }
}
