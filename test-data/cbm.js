import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function readCollectionCheque() {
    try {
        const file = resolve(process.cwd(), 'test-data/runtime/collectionRefs.json');
        if (!existsSync(file)) return {};
        const data = JSON.parse(readFileSync(file));
        return data.cheque || {};
    } catch {
        return {};
    }
}

const _savedCheque = readCollectionCheque();

export const CHEQUE_BOUNCE = {
    chequeBounceNo: _savedCheque.refNumber || '962282',
    amount: _savedCheque.amount || '',
    fcText: 'BTM',
    salesOfficerName: 'Prajwal Kedlaya',
    salesOfficerMobile: '9902646664',
};

export const CBM_SEG = {
    verificationMode: 'V', // 'V' = Verification, 'R' = Rejection
};

export const CBM_COLLECTION = {
    cash:   { amount: '66', mode: 'V' },  // V = Verify, R = Reject, NA = Skip
    cheque: { amount: '2', mode: 'NA' },
    upi:    { amount: '3', refNo: '11111123', mode: 'NA' },
    neft:   { amount: '4', refNo: '22222233', mode: 'NA' },
};

export const CBM_UPLOAD_FILES = [
    'test-data/fixtures/rfc_doc1.jpg',
    'test-data/fixtures/rfc_doc2.jpg',
];
