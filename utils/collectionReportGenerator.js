import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

/**
 * Formats a Date object to DD/MM/YYYY — matching the Nestlé collection report format.
 */
export function formatDateDMY(date = new Date()) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${date.getFullYear()}`;
}

/**
 * Converts DD/MM/YYYY → YYYY-MM-DD for DB query params.
 */
export function toDBDate(dmyString) {
    const [d, m, y] = dmyString.split('/');
    return `${y}-${m}-${d}`;
}

/**
 * Generates a unique Collection Number (COL + unix timestamp).
 */
export function generateCollectionNumber() {
    return `COL${Date.now()}`;
}

/**
 * Returns a unique 6-digit retailer code based on current timestamp.
 * Used when generateNewFile = 0 to ensure each run produces a distinct row.
 */
export function generateRetailerCode() {
    return String(Date.now()).slice(-6);
}

/**
 * Reads the Bill No (column 0, row 1) from an existing collection report Excel file.
 * Used when generateNewFile = 0 to re-use the same invoice without a DB query.
 *
 * @param {string} filePath - Absolute path to the .xlsx file
 * @returns {string} invoiceNo
 */
export function readBillNoFromFile(filePath) {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (rows.length < 2) throw new Error(`No data rows in file: ${filePath}`);

    // Detect column by header name — supports Nestlé ("Bill No"), Sunpure/Dabur ("Adjusted Bill No"),
    // and HUL Samadhan ("Adjusted /Collected Bill No"). "collected bill no" is unique to HUL.
    const headers = rows[0].map(h => String(h ?? '').trim().toLowerCase());
    let colIdx = headers.findIndex(h => h.includes('collected bill no'));
    if (colIdx < 0) colIdx = headers.findIndex(h => h.includes('adjusted bill no'));
    if (colIdx < 0) colIdx = headers.findIndex(h => h.includes('bill no'));
    if (colIdx < 0) colIdx = 0; // fallback to first column

    const invoiceNo = rows[1]?.[colIdx];
    if (!invoiceNo) throw new Error(`Could not read Bill No from file: ${filePath}`);
    return String(invoiceNo).trim();
}

/**
 * Reads ALL data rows from a collection report Excel file.
 * Returns array of { rowIdx, invoiceNo, billDate, collectionNumber, collectionDate, adjustedCrAmount }.
 * Used to iterate every invoice in the uploaded file for the diagnostic report.
 *
 * Column order matches generateCollectionReport() headers:
 *   0: Bill No, 1: Bill Date, 2: Collection Number, 3: Collection Date,
 *   4: Retailer Code, ..., 11: Adjusted Cr Amount
 */
/**
 * Writes the automation result back into the uploaded file as a new column
 * (or updates it in place if the column already exists).
 *
 * @param {string} filePath - Absolute path to the .xlsx or .csv file
 * @param {Map<number, string>} resultsByRowIdx - Map from Excel row index (1-based, matches
 *   readAllInvoicesFromFile's rowIdx) → result string like:
 *   "UNIQUE", "ERROR: <reason>", "DUPLICATE", "SKIPPED: <reason>"
 * @param {string} [columnName='Automation Result'] - Header for the new column
 */
export function writeAutomationResultsToFile(filePath, resultsByRowIdx, columnName = 'Automation Result') {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (rows.length === 0) return filePath;

    // Find or append the column
    let colIdx = rows[0].findIndex(h => String(h ?? '').trim().toLowerCase() === columnName.toLowerCase());
    if (colIdx === -1) {
        colIdx = rows[0].length;
        rows[0][colIdx] = columnName;
    }

    // Write result for each data row (rowIdx matches the rowIdx from readAllInvoicesFromFile)
    for (let r = 1; r < rows.length; r++) {
        const result = resultsByRowIdx.get(r);
        rows[r][colIdx] = result ?? '';
    }

    const newWs = XLSX.utils.aoa_to_sheet(rows);
    wb.Sheets[wb.SheetNames[0]] = newWs;

    const ext = filePath.toLowerCase().split('.').pop();
    if (ext === 'csv') {
        XLSX.writeFile(wb, filePath, { bookType: 'csv' });
    } else {
        XLSX.writeFile(wb, filePath);
    }

    console.log(`[FileWrite] Automation results written to "${columnName}" column in ${filePath}`);
    return filePath;
}

/**
 * Reads ALL data rows from a collection report file (Nestlé or Sunpure format).
 * Detects columns by header name so it works regardless of column order.
 *
 * Nestlé headers:  Bill No | Bill Date | Collection Number | Collection Date | ... | Adjusted Cr Amount
 * Sunpure headers: ... | Coll Ref No | Collection Date | ... | Adjusted Cr/Db Amt | Adjusted Bill No | Bill Date | Bill Amt
 */
export function readAllInvoicesFromFile(filePath) {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (rows.length === 0) return [];

    // Detect column indices by header name (case-insensitive)
    const headers = rows[0].map(h => String(h ?? '').trim().toLowerCase());

    const findCol = (...patterns) => {
        for (const pat of patterns) {
            const idx = headers.findIndex(h => h.includes(pat));
            if (idx >= 0) return idx;
        }
        return -1;
    };

    // HUL Samadhan uses "Adjusted/Collected Bill No" + "CR/DR No." + "Adjusted Amt"
    // Sunpure/Dabur use "Adjusted Bill No" + "Coll Ref No" + "Adjusted Cr/Db Amt"
    // Nestlé uses "Bill No" + "Collection Number" + "Adjusted Cr Amount"
    const colInvoice    = findCol('collected bill no', 'adjusted bill no', 'bill no');
    const colBillDate   = findCol('cr/dr date', 'bill date');
    const colCollNumber = findCol('cr/dr no', 'collection number', 'coll ref');
    const colCollDate   = findCol('adjusted/collected/cancelled', 'collection date');
    const colAmount     = findCol('adjusted cr/db', 'adjusted cr amount', 'adjusted cr', 'adjusted amt');

    console.log(`[FileRead] Detected columns — invoice:${colInvoice} billDate:${colBillDate} collNumber:${colCollNumber} collDate:${colCollDate} amount:${colAmount}`);
    console.log(`[FileRead] Headers: [${headers.join(' | ')}]`);

    return rows.slice(1)
        .map((row, idx) => ({
            rowIdx: idx + 1,
            invoiceNo:        colInvoice >= 0    ? String(row[colInvoice] ?? '').trim()    : '',
            billDate:         colBillDate >= 0   ? String(row[colBillDate] ?? '').trim()   : '',
            collectionNumber: colCollNumber >= 0 ? String(row[colCollNumber] ?? '').trim() : '',
            collectionDate:   colCollDate >= 0   ? String(row[colCollDate] ?? '').trim()   : '',
            adjustedCrAmount: colAmount >= 0     ? String(row[colAmount] ?? '').trim()     : '',
        }))
        .filter(r => r.invoiceNo || r.adjustedCrAmount);
}

/**
 * Writes a single-row Nestlé Collection Report Excel file.
 *
 * @param {Object} opts
 * @param {string} opts.invoiceNo         - Bill No (invoice_no from ChampOutstandingInvoices)
 * @param {string} opts.billDate          - Bill Date in DD/MM/YYYY
 * @param {string} opts.collectionNumber  - Unique collection number (e.g. COL1747234567890)
 * @param {string} opts.collectionDate    - Collection Date in DD/MM/YYYY (must be >= obc_adjustment_date)
 * @param {number|string} opts.adjustedCrAmount - Adjusted Cr Amount (0 for skip-test, >0 for normal)
 * @param {string} [opts.retailerCode]    - Retailer Code (default '000000'; pass generateRetailerCode() for uniqueness)
 * @param {string} opts.outputPath        - Absolute path to write the .xlsx file
 * @returns {string} outputPath
 */
export function generateCollectionReport({
    invoiceNo,
    billDate,
    collectionNumber,
    collectionDate,
    adjustedCrAmount,
    retailerCode = '000000',
    outputPath,
}) {
    const headers = [
        'Bill No', 'Bill Date', 'Collection Number', 'Collection Date',
        'Retailer Code', 'Retailer Name', 'Bill Amount', 'TDS Amount',
        'Adjusted On Acc Amt', 'Paid Amount', 'Cash Discount',
        'Adjusted Cr Amount', 'Adjusted Db Amount',
        'Cash', 'Cheque', 'DD', 'RTGS', 'NEFT',
        'Paid Amt', 'Balance Amt', 'Bill Paid Status',
    ];

    const row = [
        invoiceNo,              // Bill No         ← matched against ChampOutstandingInvoices.invoice_no
        billDate,               // Bill Date        ← informational; system validates from orders table
        collectionNumber,       // Collection Number ← part of uniqueness key
        collectionDate,         // Collection Date  ← must be >= ChampFcBrands.obc_adjustment_date
        retailerCode,           // Retailer Code    ← stored in meta_data_json only; unique per run when generateNewFile=0
        'TEST RETAILER',        // Retailer Name    ← stored in meta_data_json only
        '0.00',                 // Bill Amount
        '0.00',                 // TDS Amount
        '0.00',                 // Adjusted On Acc Amt
        '0.00',                 // Paid Amount
        '0.00',                 // Cash Discount
        String(adjustedCrAmount), // Adjusted Cr Amount ← KEY: triggers credit_adjustment entry if > 0
        '0.00',                 // Adjusted Db Amount
        '0.00',                 // Cash
        '0.00',                 // Cheque
        '0.00',                 // DD
        '0.00',                 // RTGS
        '0.00',                 // NEFT
        '0.00',                 // Paid Amt
        '0.00',                 // Balance Amt
        'Partial',              // Bill Paid Status
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Collection Report');

    // TC 030: write as .csv if outputPath ends with .csv, else .xlsx
    const ext = outputPath.toLowerCase().split('.').pop();
    if (ext === 'csv') {
        XLSX.writeFile(wb, outputPath, { bookType: 'csv' });
    } else {
        XLSX.writeFile(wb, outputPath);
    }

    console.log(`[FileGen] Collection report written: ${outputPath}`);
    console.log(`[FileGen] Invoice: ${invoiceNo} | CollNum: ${collectionNumber} | CollDate: ${collectionDate} | AdjCr: ${adjustedCrAmount}`);
    return outputPath;
}
