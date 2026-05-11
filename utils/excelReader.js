import XLSX from 'xlsx';
import { existsSync } from 'fs';
import { OBC_UPLOAD_FILE } from '../test-data/obcUpload.js';

function toTitleCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function parseRows() {
    if (!existsSync(OBC_UPLOAD_FILE)) {
        console.warn(`[excelReader] OBC file not found at ${OBC_UPLOAD_FILE} — exporting empty data. Tests that need firstOBCData/allOBCData will fail at runtime.`);
        return [];
    }

    const wb = XLSX.readFile(OBC_UPLOAD_FILE);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Row 0: category labels, Row 1: column names, Row 2+: data
    const headers = rows[1];
    const invoiceIdx = headers.indexOf('Invoice No');
    const salesmanIdx = headers.indexOf('Salesman Name');

    return rows.slice(2)
        .filter(row => row[invoiceIdx])
        .map(row => ({
            invoiceNo: String(row[invoiceIdx]),
            salesman: toTitleCase(String(row[salesmanIdx])),
        }));
}

// All rows — use for future parameterized / data-driven tests
export const allOBCData = parseRows();

// First row only — used by current seg test
export const firstOBCData = allOBCData[0];
