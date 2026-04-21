import { ObcEliminationPage } from '../pages/obcEliminationPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { test, expect } from '@playwright/test';
import { USERS, OBC_ELIMINATION } from '../config/testData.js';
import {
    getChampFcBrandsConfig,
    getObcAdjustmentEntry,
    getCollectionInvoiceEntry,
    getPaymentsByCollectionInvoiceId,
    getChampOutstandingInvoice,
    getInvoiceDateFromOrders,
} from '../utils/dbHelper.js';
import {
    generateCollectionReport,
    generateCollectionNumber,
    readBillNoFromFile,
    readAllInvoicesFromFile,
    writeAutomationResultsToFile,
    formatDateDMY,
    toDBDate,
} from '../utils/collectionReportGenerator.js';

// ── Config from testData.js — switch brand by changing activeBrand ────────────
const CFG  = OBC_ELIMINATION;
const FILE = CFG.filePath;

test.describe.configure({ mode: 'serial' });

const runtime = {
    invoiceNo: null,
    billDate: null,
    collectionNumber: null,
    collectionDate: null,
    collectionDateDB: null,
    adjustedCrAmount: CFG.testAdjustedCrAmount,
    currentOutstandingBefore: null,
    collectedAmountBefore: null,
    initialOutstandingAmount: null,
    collectionInvoiceId: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1 — Happy Path
// ─────────────────────────────────────────────────────────────────────────────
test.describe(`OBC Elimination [${CFG.brand}] — Happy Path`, () => {

    let page, loginPage, obcPage;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        loginPage = new LoginPage(page);
        obcPage = new ObcEliminationPage(page, CFG);
    });

    test.afterAll(async () => { await page.close(); });

    test(`DB Pre-check: obc_adjustment_date is set for fc=${CFG.fcId} + brand=${CFG.brandId}`, async () => {
        const config = await getChampFcBrandsConfig(CFG.fcId, CFG.brandId);
        console.log('ChampFcBrands config:', config);
        expect(config, `No ChampFcBrands row for fc_id=${CFG.fcId}, brand_id=${CFG.brandId}`).toBeTruthy();
        expect(config.obc_adjustment_date, 'obc_adjustment_date is NULL — OBC Elimination disabled').not.toBeNull();
        console.log('obc_adjustment_date :', config.obc_adjustment_date);
        console.log('invoice_threshold_date:', config.invoice_threshold_date);
    });

    test('Setup: load invoice and capture DB state', async () => {
        runtime.collectionDate   = formatDateDMY();
        runtime.collectionDateDB = toDBDate(runtime.collectionDate);
        runtime.billDate         = formatDateDMY();

        if (!CFG.generateNewFile) {
            runtime.invoiceNo = readBillNoFromFile(FILE);
            console.log(`[generateNewFile = 0] Using file: ${FILE}`);
            console.log('invoiceNo read from file :', runtime.invoiceNo);
        } else {
            const { getBillBackInvoices } = await import('../utils/dbHelper.js');
            const invoices = await getBillBackInvoices(CFG.fcId, CFG.brandId, 1);
            expect(invoices.length, `No Bill Back invoices for fc=${CFG.fcId}, brand=${CFG.brandId}`).toBeGreaterThan(0);
            runtime.invoiceNo = invoices[0].invoice_no;
            console.log('[generateNewFile = 1] Picked invoice:', runtime.invoiceNo);

            generateCollectionReport({
                invoiceNo: runtime.invoiceNo,
                billDate: runtime.billDate,
                collectionNumber: generateCollectionNumber(),
                collectionDate: runtime.collectionDate,
                adjustedCrAmount: runtime.adjustedCrAmount,
                outputPath: FILE,
            });
            console.log('[generateNewFile = 1] File generated:', FILE);
        }

        runtime.excelInvoices = readAllInvoicesFromFile(FILE);
        runtime.beforeState = new Map();
        const distinctInvoices = [...new Set(runtime.excelInvoices.map(r => r.invoiceNo).filter(Boolean))];

        const fcBrandCfg = await getChampFcBrandsConfig(CFG.fcId, CFG.brandId);
        runtime.obcAdjustmentDate    = fcBrandCfg?.obc_adjustment_date ?? null;
        runtime.invoiceThresholdDate = fcBrandCfg?.invoice_threshold_date ?? null;

        for (const invNo of distinctInvoices) {
            const row = await getChampOutstandingInvoice(invNo, CFG.fcId, CFG.brandId);
            const invoiceDate = await getInvoiceDateFromOrders(invNo);
            runtime.beforeState.set(invNo, row ? {
                currentOutstanding: Number(row.current_outstanding_amount),
                collectedAmount:    Number(row.collected_amount),
                initialOutstanding: Number(row.initial_outstanding_amount),
                billStatus:         row.bill_status,
                invoiceDate,
            } : { invoiceDate });
        }
        console.log(`[Setup] Loaded ${runtime.excelInvoices.length} Excel rows + captured DB state for ${distinctInvoices.length} distinct invoice(s).`);
    });

    test('DB Pre-check: no existing obc_adjustment_data entry for picked invoice', async () => {
        const existing = await getObcAdjustmentEntry(CFG.brandId, CFG.fcId, runtime.invoiceNo, runtime.adjustedCrAmount);
        if (existing) {
            console.warn('WARNING: Prior obc_adjustment_data entry found:', existing);
        } else {
            console.log('No prior obc_adjustment_data entry — clean state confirmed');
        }
    });

    // ── UI upload flow ───────────────────────────────────────────────────────
    test('Open Login Page', async () => { await loginPage.navigate(); });
    test('Fill Email', async () => { await loginPage.emailInput.fill(USERS.obc.email); });
    test('Fill Password', async () => { await loginPage.passwordInput.fill(USERS.obc.password); });
    test('Click Login Button', async () => { await loginPage.loginBtn.click(); });

    test('Click Adapter Uploads', async () => { await obcPage.clickAdapterUploads(); });
    test('Click Upload Button', async () => { await obcPage.clickUpload(); });

    test('Select Upload Type', async () => {
        await obcPage.clickUploadTypeDropdown();
        await obcPage.selectUploadType();
    });

    test('Select FC', async () => {
        await obcPage.clickFCDropdown();
        await obcPage.typeFC();
        await obcPage.selectFC();
    });

    test('Select Brand', async () => {
        await obcPage.clickBrandDropdown();
        await obcPage.typeBrand();
        await obcPage.selectBrand();
    });

    test('Upload Collection Report', async () => {
        await obcPage.uploadCollectionReport(FILE);
    });

    test('Click Submit', async () => { await obcPage.clickSubmit(); });

    test('Wait for Fully Processed and Open View', async () => {
        test.setTimeout(150000);
        await obcPage.waitForProcessingAndClickStatus();
    });

    // ── Per-invoice diagnostic report ────────────────────────────────────────
    test('Generate per-invoice report', async () => {
        test.setTimeout(180000);

        const excelInvoices = runtime.excelInvoices;
        const results = await obcPage.captureViewResults();
        console.log(`\n═══ AFTER UPLOAD — View Details page summary ═══`);
        console.log(`  Brand            : ${CFG.brand} (fc=${CFG.fcId}, brand=${CFG.brandId})`);
        console.log(`  Unique Entries     : ${results.uniqueEntries}`);
        console.log(`  Previously Captured: ${results.previouslyCaptured}`);
        console.log(`  Errors             : ${results.errors}`);
        console.log(`  Row Details count  : ${results.rowDetails.length}`);

        const consumedViewIndices = new Set();

        const expectedDeltaPerInvoice = new Map();
        for (const vr of results.rowDetails) {
            const typeLower = (vr.entryType || '').toLowerCase();
            if (!typeLower.includes('unique')) continue;
            if (!vr.invoiceNo) continue;
            const agg = expectedDeltaPerInvoice.get(vr.invoiceNo) || { totalDelta: 0, uniqueCount: 0, rows: [] };
            agg.totalDelta += Number(vr.amount);
            agg.uniqueCount += 1;
            agg.rows.push(Number(vr.amount));
            expectedDeltaPerInvoice.set(vr.invoiceNo, agg);
        }

        const report = [];
        for (const excelRow of excelInvoices) {
            const entry = {
                excelRowIdx: excelRow.rowIdx,
                excelData: excelRow,
                invoiceNo: excelRow.invoiceNo || '(blank)',
                amount: excelRow.adjustedCrAmount || '(blank)',
                viewStatus: null,
                classification: null,
                reason: null,
                log: null,
                dbChecks: null,
            };

            const amountNum = Number(excelRow.adjustedCrAmount);
            const viewIdx = results.rowDetails.findIndex((vr, idx) =>
                !consumedViewIndices.has(idx) &&
                vr.invoiceNo === excelRow.invoiceNo &&
                Number(vr.amount) === amountNum
            );
            const viewRow = viewIdx >= 0 ? results.rowDetails[viewIdx] : null;

            if (viewRow) {
                consumedViewIndices.add(viewIdx);
                entry.viewStatus = viewRow.entryType;
                const typeLower = (viewRow.entryType || '').toLowerCase();

                if (typeLower.includes('error')) {
                    entry.classification = 'ERROR';
                    const colMatch = viewRow.entryType.match(/columns?:\s*(.+)/i);
                    entry.reason = viewRow.entryType;

                    const before = runtime.beforeState.get(excelRow.invoiceNo);
                    const dbContext = {};
                    if (!excelRow.invoiceNo) {
                        dbContext.note = 'Bill No is blank — no DB lookup possible';
                    } else if (!before) {
                        dbContext.note = `Bill No "${excelRow.invoiceNo}" NOT FOUND in ChampOutstandingInvoices for fc=${CFG.fcId}, brand=${CFG.brandId}`;
                    } else {
                        dbContext.bill_status         = before.billStatus;
                        dbContext.current_outstanding = before.currentOutstanding;
                        dbContext.attempted_AdjCr_amt = excelRow.adjustedCrAmount || '(blank)';
                        if (Number(excelRow.adjustedCrAmount) > before.currentOutstanding) {
                            dbContext.amount_vs_outstanding = `ATTEMPTED (${excelRow.adjustedCrAmount}) > OUTSTANDING (${before.currentOutstanding})`;
                        }
                        dbContext['Orders.invoice_date'] = before.invoiceDate ?? '(not found)';
                        dbContext.invoice_threshold_date = runtime.invoiceThresholdDate ?? '(null)';
                        const invDateParsed = before.invoiceDate ? new Date(before.invoiceDate) : null;
                        const threshParsed = runtime.invoiceThresholdDate ? new Date(runtime.invoiceThresholdDate) : null;
                        if (invDateParsed && threshParsed && invDateParsed < threshParsed) {
                            dbContext.threshold_verdict = `invoice_date < invoice_threshold_date`;
                        }
                        const collDateParsed = parseExcelDate(excelRow.collectionDate);
                        if (invDateParsed && collDateParsed) {
                            const sameDay = invDateParsed.toISOString().slice(0, 10) === collDateParsed.toISOString().slice(0, 10);
                            if (sameDay) {
                                dbContext.tc009_verdict = `Orders.invoice_date == Collection Date (${collDateParsed.toISOString().slice(0, 10)})`;
                            }
                        }
                    }

                    entry.log = {
                        offendingColumn: colMatch ? colMatch[1].trim() : '(not a missing-column error)',
                        excelData: {
                            'Bill No':           excelRow.invoiceNo || '(blank)',
                            'Bill Date':         excelRow.billDate || '(blank)',
                            'Collection Number': excelRow.collectionNumber || '(blank)',
                            'Collection Date':   excelRow.collectionDate || '(blank)',
                            'Adjusted Cr Amt':   excelRow.adjustedCrAmount || '(blank)',
                        },
                        dbContext,
                    };
                } else if (typeLower.includes('previously') || typeLower.includes('captured') || typeLower.includes('duplicate')) {
                    entry.classification = 'DUPLICATE';
                    entry.reason = 'Already captured in a previous upload — no new DB changes expected.';
                    const original = await getObcAdjustmentEntry(CFG.brandId, CFG.fcId, viewRow.invoiceNo, viewRow.amount);
                    const origColl = await getCollectionInvoiceEntry(viewRow.invoiceNo);
                    entry.log = {
                        originalObcAdjustmentData: original
                            ? { id: original.id, created_at: original.created_at, adjusted_amount: original.adjusted_amount, type: original.type, credit_note_no: original.credit_note_no, file_id: original.file_id }
                            : '(not found — duplicate detected by different hash key)',
                        originalCollectionInvoice: origColl
                            ? { id: origColl.id, invoice_no: origColl.invoice_no }
                            : '(not found)',
                    };
                } else if (typeLower.includes('unique')) {
                    entry.classification = 'UNIQUE';
                    const beforeState = runtime.beforeState.get(viewRow.invoiceNo) || null;
                    const aggregate = expectedDeltaPerInvoice.get(viewRow.invoiceNo) || null;
                    entry.dbChecks = await runAllDbChecks(viewRow.invoiceNo, viewRow.amount, beforeState, aggregate);
                } else {
                    entry.classification = 'UNKNOWN';
                    entry.reason = `Unrecognised Entry Type: "${viewRow.entryType}"`;
                }
            } else {
                entry.classification = 'SKIPPED';
                const before = runtime.beforeState.get(excelRow.invoiceNo);
                const collDate = parseExcelDate(excelRow.collectionDate);
                const obcAdj   = runtime.obcAdjustmentDate ? new Date(runtime.obcAdjustmentDate) : null;
                const invThresh = runtime.invoiceThresholdDate ? new Date(runtime.invoiceThresholdDate) : null;
                const invoiceDate = before?.invoiceDate ? new Date(before.invoiceDate) : null;

                if (!excelRow.adjustedCrAmount || excelRow.adjustedCrAmount === '') {
                    entry.reason = 'Adjusted Cr Amount is blank — silently skipped.';
                } else if (amountNum === 0) {
                    entry.reason = 'Adjusted Cr Amount is 0 — silently skipped.';
                } else if (amountNum < 0) {
                    entry.reason = `Adjusted Cr Amount is negative (${amountNum}) — silently skipped.`;
                } else if (isNaN(amountNum)) {
                    entry.reason = `Adjusted Cr Amount "${excelRow.adjustedCrAmount}" is not a valid number.`;
                } else if (collDate && obcAdj && collDate < obcAdj) {
                    entry.reason = `Collection Date (${collDate.toISOString().slice(0, 10)}) < obc_adjustment_date (${obcAdj.toISOString().slice(0, 10)}) — silently skipped.`;
                } else if (invoiceDate && invThresh && invoiceDate < invThresh) {
                    entry.reason = `Orders.invoice_date (${invoiceDate.toISOString().slice(0, 10)}) < invoice_threshold_date (${invThresh.toISOString().slice(0, 10)}) — silently skipped.`;
                } else {
                    entry.reason = 'Row did not appear on View Details page — cause unknown.';
                }
            }

            report.push(entry);
        }

        const unmatchedViewRows = results.rowDetails.filter((_, idx) => !consumedViewIndices.has(idx));

        // ── Print report ─────────────────────────────────────────────────────
        console.log(`\n═══ PER-ROW DIAGNOSTIC REPORT (${report.length} Excel rows) ═══`);
        for (const e of report) {
            const excel = e.excelData;
            const before = runtime.beforeState.get(excel.invoiceNo);

            console.log(`\n════════════════════════════════════════════════════════════════`);
            console.log(`  EXCEL ROW ${e.excelRowIdx}`);
            console.log(`════════════════════════════════════════════════════════════════`);

            console.log(`  BEFORE UPLOAD — Excel data:`);
            console.log(`    Bill No           : ${excel.invoiceNo || '(blank)'}`);
            console.log(`    Bill Date         : ${excel.billDate || '(blank)'}`);
            console.log(`    Collection Number : ${excel.collectionNumber || '(blank)'}`);
            console.log(`    Collection Date   : ${excel.collectionDate || '(blank)'}`);
            console.log(`    Adjusted Cr Amount: ${excel.adjustedCrAmount || '(blank)'}`);

            console.log(`  BEFORE UPLOAD — ChampOutstandingInvoices state:`);
            if (!excel.invoiceNo) {
                console.log(`    (n/a — Bill No is blank)`);
            } else if (!before) {
                console.log(`    NOT FOUND for invoice=${excel.invoiceNo}`);
            } else {
                console.log(`    current_outstanding  : ${before.currentOutstanding}`);
                console.log(`    collected_amount     : ${before.collectedAmount}`);
                console.log(`    initial_outstanding  : ${before.initialOutstanding}`);
                console.log(`    bill_status          : ${before.billStatus}`);
                console.log(`    Orders.invoice_date  : ${before.invoiceDate ?? '(not found)'}`);
            }

            console.log(`  BEFORE UPLOAD — ChampFcBrands boundaries:`);
            console.log(`    obc_adjustment_date   : ${runtime.obcAdjustmentDate ?? '(null)'}`);
            console.log(`    invoice_threshold_date: ${runtime.invoiceThresholdDate ?? '(null)'}`);

            const collDateParsed = parseExcelDate(excel.collectionDate);
            const obcAdjParsed   = runtime.obcAdjustmentDate ? new Date(runtime.obcAdjustmentDate) : null;
            const invThreshParsed = runtime.invoiceThresholdDate ? new Date(runtime.invoiceThresholdDate) : null;
            const invoiceDateParsed = before?.invoiceDate ? new Date(before.invoiceDate) : null;

            console.log(`  BEFORE UPLOAD — Date boundary verdicts:`);
            if (collDateParsed && obcAdjParsed) {
                const verdict = collDateParsed >= obcAdjParsed ? 'PASSES' : 'FAILS';
                console.log(`    CollDate(${collDateParsed.toISOString().slice(0,10)}) vs obc_adjustment_date(${obcAdjParsed.toISOString().slice(0,10)}) → ${verdict}`);
            } else {
                console.log(`    CollDate vs obc_adjustment_date: (n/a — missing value)`);
            }
            if (invoiceDateParsed && invThreshParsed) {
                const verdict = invoiceDateParsed >= invThreshParsed ? 'PASSES' : 'FAILS';
                console.log(`    Orders.invoice_date(${invoiceDateParsed.toISOString().slice(0,10)}) vs invoice_threshold_date(${invThreshParsed.toISOString().slice(0,10)}) → ${verdict} threshold`);
            } else {
                console.log(`    Orders.invoice_date vs invoice_threshold_date: (n/a — missing value)`);
            }

            console.log(`  AFTER UPLOAD:`);
            console.log(`    View Status    : ${e.viewStatus ?? '(not shown on View page)'}`);
            console.log(`    Classification : ${e.classification}`);

            if (e.classification === 'UNIQUE' && e.dbChecks) {
                console.log(`    DB Checks:`);
                for (const [check, r] of Object.entries(e.dbChecks)) {
                    console.log(`      ${check.padEnd(32)} ${r.status.padEnd(6)} ${r.detail}`);
                }
            } else if (e.classification === 'ERROR') {
                console.log(`    Error Reason   : ${e.reason}`);
                if (e.log) {
                    console.log(`    Offending column: ${e.log.offendingColumn}`);
                    console.log(`    Root-cause DB context:`);
                    if (Object.keys(e.log.dbContext).length === 0) {
                        console.log(`      (no DB context available)`);
                    } else {
                        for (const [k, v] of Object.entries(e.log.dbContext)) {
                            console.log(`      ${k.padEnd(28)}: ${v}`);
                        }
                    }
                }
            } else if (e.classification === 'DUPLICATE') {
                console.log(`    Duplicate Reason: ${e.reason}`);
                if (e.log) {
                    console.log(`    Original obc_adjustment_data:`);
                    if (typeof e.log.originalObcAdjustmentData === 'string') {
                        console.log(`      ${e.log.originalObcAdjustmentData}`);
                    } else {
                        for (const [k, v] of Object.entries(e.log.originalObcAdjustmentData)) {
                            console.log(`      ${k.padEnd(16)}: ${v}`);
                        }
                    }
                    console.log(`    Original collection_invoices:`);
                    if (typeof e.log.originalCollectionInvoice === 'string') {
                        console.log(`      ${e.log.originalCollectionInvoice}`);
                    } else {
                        for (const [k, v] of Object.entries(e.log.originalCollectionInvoice)) {
                            console.log(`      ${k.padEnd(16)}: ${v}`);
                        }
                    }
                }
            } else {
                if (e.reason) console.log(`    Reason         : ${e.reason}`);
            }
        }

        if (unmatchedViewRows.length) {
            console.log(`\n⚠  ${unmatchedViewRows.length} View row(s) had no matching Excel row:`);
            for (const vr of unmatchedViewRows) {
                console.log(`   • invoice=${vr.invoiceNo} | amount=${vr.amount} | type=${vr.entryType}`);
            }
        }

        // Write results back into file
        const resultsByRowIdx = new Map();
        for (const e of report) {
            let resultStr;
            switch (e.classification) {
                case 'UNIQUE':    resultStr = 'UNIQUE'; break;
                case 'DUPLICATE': resultStr = `DUPLICATE: ${e.reason ?? 'previously captured'}`; break;
                case 'ERROR':     resultStr = `ERROR: ${e.reason ?? 'unknown error'}`; break;
                case 'SKIPPED':   resultStr = `SKIPPED: ${e.reason ?? 'row not shown on View page'}`; break;
                default:          resultStr = `${e.classification}: ${e.reason ?? ''}`;
            }
            resultsByRowIdx.set(e.excelRowIdx, resultStr);
        }
        try {
            writeAutomationResultsToFile(FILE, resultsByRowIdx);
        } catch (err) {
            console.log(`⚠  Could not write automation results back to file: ${err.message}`);
        }

        const counts = report.reduce((acc, e) => { acc[e.classification] = (acc[e.classification] || 0) + 1; return acc; }, {});
        console.log(`\n═══ SUMMARY ═══`);
        console.log(`  Brand          : ${CFG.brand}`);
        console.log(`  Total Excel rows : ${report.length}`);
        for (const [k, v] of Object.entries(counts)) {
            console.log(`  ${k.padEnd(17)}: ${v}`);
        }
        console.log(`═══ END OF REPORT ═══\n`);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseExcelDate(val) {
    if (!val || val === '(blank)') return null;
    const str = String(val).trim();
    if (/^\d+$/.test(str)) {
        const serial = parseInt(str, 10);
        const epoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(epoch.getTime() + serial * 86400000);
    }
    const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) return new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]));
    const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymd) return new Date(Date.UTC(+ymd[1], +ymd[2] - 1, +ymd[3]));
    return null;
}

async function runAllDbChecks(invoiceNo, amount, beforeState, aggregate) {
    const checks = {};
    const adj = Number(amount);
    const totalDelta = aggregate?.totalDelta ?? adj;
    const uniqueCount = aggregate?.uniqueCount ?? 1;

    const obcEntry = await getObcAdjustmentEntry(CFG.brandId, CFG.fcId, invoiceNo, amount);
    checks.obc_adjustment_data = obcEntry
        ? { status: 'PASS', detail: `(id:${obcEntry.id}, type:${obcEntry.type}, credit_note_no:${obcEntry.credit_note_no}, created_at:${obcEntry.created_at})` }
        : { status: 'FAIL', detail: `no entry for brand=${CFG.brandId}, fc=${CFG.fcId}, invoice=${invoiceNo}, amount=${amount}` };

    const collEntry = await getCollectionInvoiceEntry(invoiceNo);
    checks.collection_invoices = collEntry
        ? { status: 'PASS', detail: `(id:${collEntry.id})` }
        : { status: 'FAIL', detail: `no collection_invoices row for invoice=${invoiceNo}` };

    const outRow = await getChampOutstandingInvoice(invoiceNo, CFG.fcId, CFG.brandId);
    if (!outRow) {
        checks.ChampOutstandingInvoices = { status: 'FAIL', detail: `no row for invoice=${invoiceNo}` };
        checks.bill_status = { status: 'FAIL', detail: 'no ChampOutstandingInvoices row' };
    } else if (!beforeState) {
        checks.ChampOutstandingInvoices = {
            status: 'INFO',
            detail: `no before-state; after: outstanding=${outRow.current_outstanding_amount}, collected=${outRow.collected_amount}, bill_status=${outRow.bill_status}`,
        };
        checks.bill_status = { status: 'INFO', detail: `no before-state; current bill_status=${outRow.bill_status}` };
    } else {
        const afterOut  = Number(outRow.current_outstanding_amount);
        const afterColl = Number(outRow.collected_amount);
        const afterInit = Number(outRow.initial_outstanding_amount);
        const afterBillStatus = outRow.bill_status;
        const outstandingOk = afterOut === beforeState.currentOutstanding - totalDelta;
        const collectedOk   = afterColl === beforeState.collectedAmount + totalDelta;
        const initialOk     = afterInit === beforeState.initialOutstanding;
        const allOk = outstandingOk && collectedOk && initialOk;
        const aggregateNote = uniqueCount > 1
            ? ` — aggregated across ${uniqueCount} UNIQUE rows (${aggregate.rows.join('+')}=${totalDelta})`
            : '';
        checks.ChampOutstandingInvoices = {
            status: allOk ? 'PASS' : 'FAIL',
            detail: `(outstanding ${beforeState.currentOutstanding}→${afterOut} [${outstandingOk ? 'ok' : `expected -${totalDelta}`}] | collected ${beforeState.collectedAmount}→${afterColl} [${collectedOk ? 'ok' : `expected +${totalDelta}`}] | initial ${initialOk ? 'unchanged' : `changed ${beforeState.initialOutstanding}→${afterInit}`})${aggregateNote}`,
        };

        const fullSettle = afterOut === 0;
        if (fullSettle) {
            const transitionOk = afterBillStatus === 'No Bill Back';
            checks.bill_status = {
                status: transitionOk ? 'PASS' : 'FAIL',
                detail: `full-settle: ${beforeState.billStatus}→${afterBillStatus} ${transitionOk ? '(ok)' : '(FAIL, expected "No Bill Back")'}`,
            };
        } else {
            const statusUnchanged = afterBillStatus === beforeState.billStatus;
            checks.bill_status = {
                status: statusUnchanged ? 'PASS' : 'INFO',
                detail: `partial-settle: ${beforeState.billStatus}→${afterBillStatus} ${statusUnchanged ? '(ok, unchanged)' : '(changed)'}`,
            };
        }
    }

    if (collEntry) {
        const payments = await getPaymentsByCollectionInvoiceId(collEntry.id);
        const matched = payments.find(p => Number(p.amount) === adj);
        const aggNote = uniqueCount > 1 ? ` — expected ${uniqueCount} payment rows` : '';
        const countOk = uniqueCount === 1 || payments.length >= uniqueCount;
        checks.payments = matched
            ? { status: countOk ? 'PASS' : 'FAIL', detail: `(payment_type:${matched.payment_type}, amount:${matched.amount}, total:${payments.length})${aggNote}${countOk ? '' : ' — COUNT MISMATCH'}` }
            : { status: 'FAIL', detail: `no payment with amount=${amount} under collection_invoice_id=${collEntry.id} (found ${payments.length})${aggNote}` };
    } else {
        checks.payments = { status: 'SKIP', detail: 'no collection_invoices row to query payments' };
    }

    return checks;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2 — Duplicate Detection (re-upload same file)
// ─────────────────────────────────────────────────────────────────────────────
test.describe.skip(`OBC Elimination [${CFG.brand}] — Duplicate Detection`, () => {

    let page, loginPage, obcPage;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        loginPage = new LoginPage(page);
        obcPage = new ObcEliminationPage(page, CFG);
    });

    test.afterAll(async () => { await page.close(); });

    test('Open Login Page', async () => { await loginPage.navigate(); });
    test('Fill Email', async () => { await loginPage.emailInput.fill(USERS.obc.email); });
    test('Fill Password', async () => { await loginPage.passwordInput.fill(USERS.obc.password); });
    test('Click Login Button', async () => { await loginPage.loginBtn.click(); });

    test('Click Adapter Uploads', async () => { await obcPage.clickAdapterUploads(); });
    test('Click Upload Button', async () => { await obcPage.clickUpload(); });

    test('Select Upload Type', async () => {
        await obcPage.clickUploadTypeDropdown();
        await obcPage.selectUploadType();
    });

    test('Select FC', async () => {
        await obcPage.clickFCDropdown();
        await obcPage.typeFC();
        await obcPage.selectFC();
    });

    test('Select Brand', async () => {
        await obcPage.clickBrandDropdown();
        await obcPage.typeBrand();
        await obcPage.selectBrand();
    });

    test('Re-upload same Collection Report', async () => {
        console.log(`Re-uploading for invoice: ${runtime.invoiceNo}`);
        await obcPage.uploadCollectionReport(FILE);
    });

    test('Click Submit', async () => { await obcPage.clickSubmit(); });

    test('Wait for Fully Processed and Open View', async () => {
        test.setTimeout(150000);
        await obcPage.waitForProcessingAndClickStatus();
    });

    test('Verify View: Previously Captured > 0, Unique Entries = 0', async () => {
        const results = await obcPage.captureViewResults();
        expect(results.previouslyCaptured, 'Re-upload — Previously Captured must be > 0').toBeGreaterThan(0);
        expect(results.uniqueEntries, 'Re-upload — Unique Entries must be 0').toBe(0);
    });

    test('DB Post-check: no new obc_adjustment_data entry on re-upload', async () => {
        const entry = await getObcAdjustmentEntry(CFG.brandId, CFG.fcId, runtime.invoiceNo, runtime.adjustedCrAmount);
        expect(entry, 'Original entry must still exist').toBeTruthy();
        console.log('Entry created_at after re-upload:', entry.created_at);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3 — Zero Amount Rows Silently Skipped
// ─────────────────────────────────────────────────────────────────────────────
test.describe.skip(`OBC Elimination [${CFG.brand}] — Zero Amount Skipped`, () => {

    let page, loginPage, obcPage;
    let zeroAmtCollectionNumber;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        loginPage = new LoginPage(page);
        obcPage = new ObcEliminationPage(page, CFG);
    });

    test.afterAll(async () => { await page.close(); });

    test('Generate zero-amount file', async () => {
        zeroAmtCollectionNumber = generateCollectionNumber();
        generateCollectionReport({
            invoiceNo: runtime.invoiceNo,
            billDate: runtime.billDate,
            collectionNumber: zeroAmtCollectionNumber,
            collectionDate: runtime.collectionDate,
            adjustedCrAmount: '0.00',
            outputPath: FILE,
        });
    });

    test('Open Login Page', async () => { await loginPage.navigate(); });
    test('Fill Email', async () => { await loginPage.emailInput.fill(USERS.obc.email); });
    test('Fill Password', async () => { await loginPage.passwordInput.fill(USERS.obc.password); });
    test('Click Login Button', async () => { await loginPage.loginBtn.click(); });

    test('Click Adapter Uploads', async () => { await obcPage.clickAdapterUploads(); });
    test('Click Upload Button', async () => { await obcPage.clickUpload(); });

    test('Select Upload Type', async () => {
        await obcPage.clickUploadTypeDropdown();
        await obcPage.selectUploadType();
    });

    test('Select FC', async () => {
        await obcPage.clickFCDropdown();
        await obcPage.typeFC();
        await obcPage.selectFC();
    });

    test('Select Brand', async () => {
        await obcPage.clickBrandDropdown();
        await obcPage.typeBrand();
        await obcPage.selectBrand();
    });

    test('Upload zero-amount Collection Report', async () => {
        await obcPage.uploadCollectionReport(FILE);
    });

    test('Click Submit', async () => { await obcPage.clickSubmit(); });

    test('Wait for Fully Processed and Open View', async () => {
        test.setTimeout(150000);
        await obcPage.waitForProcessingAndClickStatus();
    });

    test('Verify View: all counts = 0 (all skipped)', async () => {
        const results = await obcPage.captureViewResults();
        expect(results.uniqueEntries, 'Unique must be 0').toBe(0);
        expect(results.previouslyCaptured, 'Previously Captured must be 0').toBe(0);
        expect(results.errors, 'Error must be 0').toBe(0);
    });

    test('DB Post-check: no obc_adjustment_data for zero-amount', async () => {
        const entry = await getObcAdjustmentEntry(CFG.brandId, CFG.fcId, runtime.invoiceNo, '0.00');
        expect(entry, 'Zero-amount must NOT create entry').toBeNull();
    });
});
