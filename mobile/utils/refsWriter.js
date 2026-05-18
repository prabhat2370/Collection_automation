import { writeFileSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFS_FILE = path.resolve(__dirname, '..', '..', 'test-data', 'runtime', 'collectionRefs.json');

export function saveRef(key, data) {
    const existing = existsSync(REFS_FILE) ? JSON.parse(readFileSync(REFS_FILE)) : {};
    existing[key] = data;
    writeFileSync(REFS_FILE, JSON.stringify(existing, null, 2));
}

export function clearRefs() {
    writeFileSync(REFS_FILE, JSON.stringify({}, null, 2));
}

export function genUpiRef() {
    return Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
}

export function genNeftRef() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function genChequeRef() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
