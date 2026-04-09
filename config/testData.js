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
};

export const FILE_PATHS = {
    obcFile: 'C:\\Users\\User\\Downloads\\preprodobc 2.xlsx',
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
    cash: '1',
    cheque: '2',
    qr: '3',
    neft: '4',
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

// V = Verify, R = Reject, NA = Neglect/Ignore (skip)
export const PAYMENT_MODES = {
    cash: 'NA',
    cheque: 'NA',
    upi: 'NA',
    neft: 'NA',
};
