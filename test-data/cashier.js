import { SEG } from './seg.js';

// V = Verify, R = Reject, NA = Neglect/Ignore (skip)

// Used during RFC verification flow (SEG.verificationType === 'D')
export const RFC_PAYMENT_MODES = {
    cash: ['V'],             // 1 cash row in RFC_COLLECTION.cash
    cheque: ['V','V','V','V'], // 1 cheque rows in RFC_COLLECTION.cheque
    upi: ['V','V','V','V'],              // 1 upi row in RFC_COLLECTION.upi
    neft: ['V','V','V','V'],        // 3 neft rows in RFC_COLLECTION.neft
};

// Used during Collection verification flow (SEG.verificationType === 'S')
export const COLLECTION_PAYMENT_MODES = {
    cash: 'V',
    cheque: 'V',
    upi: 'V',
    neft: 'V',
};

// Active modes — picked at runtime based on SEG.verificationType
export const PAYMENT_MODES = SEG.verificationType === 'D'
    ? RFC_PAYMENT_MODES
    : COLLECTION_PAYMENT_MODES;
