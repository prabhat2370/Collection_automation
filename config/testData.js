import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function readCollectionCheque() {
    try {
        const file = resolve(process.cwd(), 'utils/collectionRefs.json');
        if (!existsSync(file)) return {};
        const data = JSON.parse(readFileSync(file));
        return data.cheque || {};
    } catch {
        return {};
    }
}

export const URLS = {
    cdms: 'https://cdms-preprod.ripplr.in/login',
    collection: 'https://collection-preprod.ripplr.in/login',
};

export const USERS = {
    obc: {
        email: 'admin@ripplr.in',
        password: 'M@ver!ck',
    },
    seg: {
        email: 'seg4@ripplr.in',
        password: 'Ripplr@123',
    },
    collection: {
        mobile: '9739492646',
        pin: '1234',
    },
    cash: {
        email: 'cash4@ripplr.in',
        password: 'Ripplr@123',
    },
    segCA: {
        email: 'segobc2@ripplr.in',
        password: 'Ripplr@123',
    },
};

export const FILE_PATHS = {
    obcFile: 'C:\\Users\\User\\Downloads\\preprodobc 2.xlsx',
    soReport: 'C:\\Users\\User\\Downloads\\m1 6.csv',
    invoiceReport: 'C:\\Users\\User\\Downloads\\h1 6.csv',
    salesRegister: 'C:\\Users\\User\\Downloads\\sr 10.csv',
    // OBC Elimination file path is now inside OBC_ELIMINATION config (per brand)
};

export const BANKS = [
    'Bank of Baroda',
    'Bank of India',
    'Bank of Maharashtra',
    'Canara Bank',
    'Central Bank of India',
    'Indian Bank',
    'Indian Overseas Bank',
    'Punjab and Sind Bank',
];

export const CONFIRMATION = {
    submitCollection: 'Yes',
};

export const AMOUNTS = {
    cash: '',
    cheque: '44',
    qr: '15',
    neft: '60',
};

export const SEG = {
    fc: 'BTML: BTM',
    brand: 'BRIT: Britannia',
    verificationMode: 'V', // 'V' = Verification, 'R' = Rejection
};

export const OBC = {
    fc: 'BTML: BTM',
    brand: 'BRIT: Britannia',
};


// ── OBC Elimination ──────────────────────────────────────────────────────────
// Switch brand by changing activeBrand: 'nestle' | 'sunpure' | 'dabur'
// All brand-specific settings (FC, Brand, file path, uniqueness) are here.
const OBC_BRANDS = {
    nestle: {
        fc: 'MKLI: Makali',
        brand: 'NESL: NESTLE',
        fcId: 31,
        brandId: 32,
        fcSearchText: 'MKLI',
        brandSearchText: 'NESL',
        uploadType: 'Credit Adjustment',
        filePath: 'C:\\Users\\User\\Downloads\\CollectionReport - 2026-02-16T180603.852.xlsx',
        testAdjustedCrAmount: '1.00',
        generateNewFile: 0,
    },
    sunpure: {
        fc: 'BGRD: Begur Road',
        brand: 'SNPRGT: Sunpure GT',
        fcId: 72,
        brandId: 46,
        fcSearchText: 'BGRD',
        brandSearchText: 'SNPRGT',
        uploadType: 'Credit Adjustment',
        filePath: 'C:\\Users\\User\\Downloads\\CollectionReport_SUNPURE.xlsx',
        testAdjustedCrAmount: '1.00',
        generateNewFile: 0,
    },
    dabur: {
        fc: 'BGRD: Begur Road',
        brand: 'DBR: Dabur CCD',
        fcId: 72,
        brandId: 1,
        fcSearchText: 'BGRD',
        brandSearchText: 'DBR',
        uploadType: 'Credit Adjustment',
        filePath: 'C:\\Users\\User\\Downloads\\CollectionReport- Dabur.xlsx',
        testAdjustedCrAmount: '1.00',
        generateNewFile: 0,
    },
    hulsamadhan: {
        fc: 'CRMP: Chromepet',
        brand: 'HULS: HUL SAMADHAN',
        fcId: 74,
        brandId: 59,
        fcSearchText: 'CRMP',
        brandSearchText: 'HULS',
        uploadType: 'Credit Adjustment',
        filePath: 'C:\\Users\\User\\Downloads\\CreditDebitNoteRptAdj_HULS.csv',
        testAdjustedCrAmount: '1.00',
        generateNewFile: 0,
    },
};

// ▶▶▶ CHANGE THIS TO SWITCH BRAND ◀◀◀
const activeBrand = 'sunpure';

export const OBC_ELIMINATION = OBC_BRANDS[activeBrand];

// V = Verify, R = Reject, NA = Neglect/Ignore (skip)
export const PAYMENT_MODES = {
    cash: 'NA',
    cheque: 'V',
    upi: 'V',
    neft: 'V',
};

export const DELIVERY = {
    vehicleNo: 'TN09TN9090',
    driverName: 'Lakshman pad',
    driverMobile: '8303111111',
    vendor: 'Lakshman pad',
    // D = Delivered, PD = Partial Delivered, DA = Delivery Attempted, C = Cancelled
    deliveryStatus: 'D',
};

export const RFC_COLLECTION = {
    cash: '',
    cheque: '',
    upi: '',
    neft: '',
};

export const RFC_UPLOAD_FILES = [
    'utils/testFiles/rfc_doc1.jpg',
    'utils/testFiles/rfc_doc2.jpg',
];


export const CBM_SEG = {
    verificationMode: 'V', // 'V' = Verification, 'R' = Rejection
};

const _savedCheque = readCollectionCheque();
export const CHEQUE_BOUNCE = {
    chequeBounceNo: _savedCheque.refNumber || '384734',
    amount: _savedCheque.amount || '',
    fcText: 'BTM',
    salesOfficerName: 'Nikesh Giri',
    salesOfficerMobile: '8840576893',
};

export const CBM_COLLECTION = {
    cash:   { amount: '1', mode: 'NA' },  // V = Verify, R = Reject, NA = Skip
    cheque: { amount: '2', mode: 'V' },
    upi:    { amount: '3', refNo: '11111123', mode: 'NA' },
    neft:   { amount: '4', refNo: '22222233', mode: 'V' },
};

export const CBM_UPLOAD_FILES = [
    'utils/testFiles/rfc_doc1.jpg',
    'utils/testFiles/rfc_doc2.jpg',
];
