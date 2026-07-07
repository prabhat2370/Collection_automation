import { SEG } from './seg.js';

// V = Verify, R = Reject, NA = Neglect/Ignore (skip)

// Used during RFC verification flow (SEG.verificationType === 'D')
export const RFC_PAYMENT_MODES = {
    cash: '',
    cheque: '',
    upi: '',
    neft: 'V',
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
