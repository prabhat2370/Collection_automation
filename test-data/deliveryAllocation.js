import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function readSavedDeliveryVehicleNo() {
    try {
        const file = resolve(process.cwd(), 'test-data/runtime/collectionRefs.json');
        if (!existsSync(file)) return null;
        const data = JSON.parse(readFileSync(file));
        return data.delivery?.vehicleNo || null;
    } catch {
        return null;
    }
}

const _savedVehicleNo = readSavedDeliveryVehicleNo();

export const DELIVERY = {
    vehicleNo: _savedVehicleNo || 'TN09TN9090',
    driverName: 'Lakshman pad',
    driverMobile: '8303111111',
    vendor: 'Lakshman pad',
    // D = Delivered, PD = Partial Delivered, DA = Delivery Attempted, C = Cancelled
    deliveryStatus: 'D',
};
