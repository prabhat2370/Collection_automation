// Reads test-results/results.json (Playwright JSON reporter output)
// Reads TestCases_CollectionAuto.xlsx
// Adds/updates a dated column "Result_YYYY-MM-DD" with Pass/Fail/Skip per TC
// Saves the Excel back to Downloads + project backup
//
// Usage: node test-cases/update-results.js
// Prereq: playwright tests have been run with json reporter, producing test-results/results.json

import XLSX from 'xlsx';
import { readFileSync, existsSync, copyFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, extname } from 'path';
import 'dotenv/config';

// catbox.moe — zero-setup public file host. Anonymous uploads, permanent URLs.
const CATBOX_CACHE_FILE = resolve(process.cwd(), 'test-cases/.catbox-cache.json');

// Cache: TC ID → catbox URL, so re-runs don't re-upload unchanged screenshots
let catboxCache = {};
if (existsSync(CATBOX_CACHE_FILE)) {
    try { catboxCache = JSON.parse(readFileSync(CATBOX_CACHE_FILE, 'utf-8')); } catch { catboxCache = {}; }
}

async function uploadToCatbox(filePath, tcId) {
    try {
        const buf = readFileSync(filePath);
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', new Blob([buf]), `${tcId}.png`);
        const res = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: formData,
        });
        const text = (await res.text()).trim();
        if (!res.ok || !text.startsWith('https://')) {
            console.warn(`[update-results] catbox upload failed for ${tcId}: ${text || res.statusText}`);
            return null;
        }
        return text; // e.g. https://files.catbox.moe/abc123.png
    } catch (err) {
        console.warn(`[update-results] catbox upload error for ${tcId}: ${err.message}`);
        return null;
    }
}

const RESULTS_JSON = resolve(process.cwd(), 'test-results/results.json');
const RUN_TCS_FILE = resolve(process.cwd(), 'test-cases/.run-tcs.json');
const DOWNLOADS_XLSX = resolve('C:\\Users\\User\\Downloads', 'TestCases_CollectionAuto.xlsx');
const BACKUP_XLSX = resolve(process.cwd(), 'test-cases', 'TestCases_CollectionAuto.xlsx');

// If run-selected.js wrote run-tcs.json, only update those TCs in the Excel.
let filterTcIds = null;
if (existsSync(RUN_TCS_FILE)) {
    filterTcIds = new Set(JSON.parse(readFileSync(RUN_TCS_FILE, 'utf-8')));
    console.log(`[update-results] Filtering to ${filterTcIds.size} TCs from run-tcs.json`);
}

// ── Today's column header in YYYY-MM-DD ──────────────────────────────────────
function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const TODAY_COL = `Result_${todayISO()}`;
console.log(`[update-results] Today's column: ${TODAY_COL}`);

// ── 1. Load Playwright JSON ──────────────────────────────────────────────────
if (!existsSync(RESULTS_JSON)) {
    console.error(`[update-results] ERROR: ${RESULTS_JSON} not found. Run \`npx playwright test\` first.`);
    process.exit(1);
}
const json = JSON.parse(readFileSync(RESULTS_JSON, 'utf-8'));

// ── 2. Build a map: (specFile, testTitle, stepName) → status ─────────────────
// Playwright statuses: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted'
// We collapse into Pass / Fail / Skip
function mapStatus(s) {
    if (s === 'passed') return 'Pass';
    if (s === 'skipped') return 'Skip';
    return 'Fail'; // failed | timedOut | interrupted
}

const stepMap = new Map(); // key = `${specFile}|${testTitle}|${stepName}` → status
const testMap = new Map(); // key = `${specFile}|${testTitle}` → status
const screenshotMap = new Map(); // key = `${specFile}|${testTitle}` → screenshot path

function normalizeSpec(file) {
    // Playwright JSON reports paths relative to testDir (./tests), so we get
    // "login.spec.js" — but our tcMapping uses "tests/login.spec.js". Normalize
    // both to "tests/<filename>".
    let f = file.replace(/\\/g, '/');
    if (f.startsWith('tests/')) return f;
    if (/^[^/]+\.spec\.js$/.test(f)) return `tests/${f}`;
    return f;
}

function walkSuite(suite, specFile) {
    const file = specFile || normalizeSpec(suite.file || '');
    for (const test of suite.specs || []) {
        const title = test.title;
        for (const t of test.tests || []) {
            // t.results is an array (one per retry); use the LAST result
            const lastResult = t.results?.[t.results.length - 1];
            if (!lastResult) continue;
            const testStatus = mapStatus(lastResult.status);
            testMap.set(`${file}|${title}`, testStatus);

            // Capture screenshot from attachments. Two sources possible:
            //   1. Manual: testInfo.attach('screenshot', { body: buf, ... }) — has `body` (base64), preferred
            //   2. Auto: screenshot: 'on' in config — has `path` (often blank if test uses non-default page)
            // Prefer body-based attachments since they capture the right page.
            const attachments = (lastResult.attachments || []).filter(a =>
                a.contentType === 'image/png' || /screenshot/i.test(a.name)
            );
            const manual = attachments.find(a => a.body);
            const auto = attachments.find(a => a.path);
            if (manual?.body) {
                // body is base64-encoded; write to disk so we can copy/upload it like a path
                const tmpDir = resolve(process.cwd(), 'test-results/attached-screenshots');
                mkdirSync(tmpDir, { recursive: true });
                const safeTitle = title.replace(/[^a-z0-9]+/gi, '-');
                const tmpPath = resolve(tmpDir, `${safeTitle}.png`);
                writeFileSync(tmpPath, Buffer.from(manual.body, 'base64'));
                screenshotMap.set(`${file}|${title}`, tmpPath);
            } else if (auto?.path) {
                screenshotMap.set(`${file}|${title}`, auto.path);
            }

            // Walk steps
            const walkSteps = (steps) => {
                for (const s of steps || []) {
                    const stepStatus = mapStatus(s.error ? 'failed' : (lastResult.status === 'skipped' ? 'skipped' : 'passed'));
                    stepMap.set(`${file}|${title}|${s.title}`, stepStatus);
                    walkSteps(s.steps);
                }
            };
            walkSteps(lastResult.steps);
        }
    }
    for (const sub of suite.suites || []) {
        walkSuite(sub, file);
    }
}

for (const suite of json.suites || []) {
    walkSuite(suite);
}
console.log(`[update-results] Parsed ${testMap.size} tests, ${stepMap.size} steps from results.json`);

// ── 3. Load Excel (prefer Downloads, fall back to backup) ────────────────────
const xlsxPath = existsSync(DOWNLOADS_XLSX) ? DOWNLOADS_XLSX : BACKUP_XLSX;
if (!existsSync(xlsxPath)) {
    console.error(`[update-results] ERROR: Excel not found at ${DOWNLOADS_XLSX} or ${BACKUP_XLSX}. Run generateTestCases.js first.`);
    process.exit(1);
}
console.log(`[update-results] Reading Excel: ${xlsxPath}`);
const wb = XLSX.readFile(xlsxPath);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];

// Convert to array-of-arrays for column manipulation
const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const headerRow = aoa[0];

// ── 4. Find/append today's dated column ──────────────────────────────────────
let todayColIdx = headerRow.indexOf(TODAY_COL);
if (todayColIdx === -1) {
    todayColIdx = headerRow.length;
    headerRow.push(TODAY_COL);
    // Pad each data row with an empty cell to match new header width
    for (let i = 1; i < aoa.length; i++) {
        while (aoa[i].length < headerRow.length) aoa[i].push('');
    }
    console.log(`[update-results] Added new column: ${TODAY_COL} (col ${todayColIdx})`);
} else {
    console.log(`[update-results] Updating existing column: ${TODAY_COL} (col ${todayColIdx})`);
}

// ── 5. Build column index map ────────────────────────────────────────────────
const colIdx = {};
headerRow.forEach((h, i) => { colIdx[h] = i; });

const need = ['TESTCASE ID', 'SPEC_FILE', 'TEST_TITLE', 'STEP_NAME'];
for (const c of need) {
    if (colIdx[c] === undefined) {
        console.error(`[update-results] ERROR: Column "${c}" missing in Excel. Re-run generateTestCases.js.`);
        process.exit(1);
    }
}
const screenshotCol = colIdx['Screenshot']; // optional; may be undefined for older Excel files

// ── 6. For each TC row, look up result by (specFile, testTitle, stepName) ────
let counts = { Pass: 0, Fail: 0, Skip: 0, NotMapped: 0, Manual: 0, Filtered: 0 };
const pendingUploads = []; // collected here, uploaded to Imgur in batch after the loop
for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i];
    const tcId = row[colIdx['TESTCASE ID']];
    const specFile = row[colIdx['SPEC_FILE']];
    const testTitle = row[colIdx['TEST_TITLE']];
    const stepName = row[colIdx['STEP_NAME']];

    // If a filter is active, leave non-selected TCs untouched
    if (filterTcIds && !filterTcIds.has(tcId)) {
        counts.Filtered++;
        continue;
    }

    if (!specFile || !testTitle) {
        // Manual / negative test — leave existing value or write Manual if blank
        if (!row[todayColIdx]) row[todayColIdx] = 'Manual';
        counts.Manual++;
        continue;
    }

    let status;
    if (stepName) {
        status = stepMap.get(`${specFile}|${testTitle}|${stepName}`);
    }
    if (!status) {
        // Fall back to test-level status (covers tests with no test.step)
        status = testMap.get(`${specFile}|${testTitle}`);
    }

    if (!status) {
        // Test was not in results.json — likely the spec wasn't run
        row[todayColIdx] = 'Skip';
        counts.NotMapped++;
        continue;
    }

    row[todayColIdx] = status;
    counts[status] = (counts[status] || 0) + 1;

    // Populate Screenshot column — each TC gets its own copy of the source PNG,
    // named by TC ID. We collect uploads and process them in a batch below.
    if (screenshotCol !== undefined) {
        const srcPath = screenshotMap.get(`${specFile}|${testTitle}`);
        if (srcPath && existsSync(srcPath)) {
            const ssDir = resolve(process.cwd(), 'test-results/tc-screenshots');
            mkdirSync(ssDir, { recursive: true });
            const ext = extname(srcPath) || '.png';
            const dstPath = resolve(ssDir, `${tcId}${ext}`);
            try {
                copyFileSync(srcPath, dstPath);
                row[screenshotCol] = dstPath; // local fallback; replaced by Imgur URL below
                pendingUploads.push({ tcId, filePath: dstPath, row });
            } catch (err) {
                console.warn(`[update-results] WARN: failed to copy screenshot for ${tcId}: ${err.message}`);
                row[screenshotCol] = srcPath;
            }
        }
    }
}

// ── 6b. Upload screenshots to catbox.moe in parallel ─────────────────────────
if (pendingUploads.length > 0) {
    console.log(`[update-results] Uploading ${pendingUploads.length} screenshots to catbox.moe...`);
    const results = await Promise.all(pendingUploads.map(async ({ tcId, filePath, row }) => {
        // Reuse cached URL if same file (avoid re-upload spam)
        if (catboxCache[tcId]) {
            row[screenshotCol] = catboxCache[tcId];
            return { tcId, cached: true };
        }
        const url = await uploadToCatbox(filePath, tcId);
        if (url) {
            catboxCache[tcId] = url;
            row[screenshotCol] = url;
            return { tcId, url };
        }
        return { tcId, failed: true };
    }));
    const uploaded = results.filter(r => r.url).length;
    const cached = results.filter(r => r.cached).length;
    const failed = results.filter(r => r.failed).length;
    console.log(`[update-results] catbox.moe: uploaded=${uploaded} cached=${cached} failed=${failed}`);
    writeFileSync(CATBOX_CACHE_FILE, JSON.stringify(catboxCache, null, 2));
}

console.log(`[update-results] Results: Pass=${counts.Pass} Fail=${counts.Fail} Skip=${counts.Skip} NotMapped=${counts.NotMapped} Manual=${counts.Manual} Filtered=${counts.Filtered}`);

// ── 7. Write back ────────────────────────────────────────────────────────────
const newWs = XLSX.utils.aoa_to_sheet(aoa);

// Preserve original column widths if present, extend for new column
const oldCols = ws['!cols'] || [];
const newCols = [...oldCols];
while (newCols.length < headerRow.length) newCols.push({ wch: 14 });
newWs['!cols'] = newCols;

const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, newWs, sheetName);

XLSX.writeFile(newWb, BACKUP_XLSX);
console.log(`[update-results] Backup: ${BACKUP_XLSX}`);

try {
    XLSX.writeFile(newWb, DOWNLOADS_XLSX);
    console.log(`[update-results] Saved: ${DOWNLOADS_XLSX}`);
} catch (err) {
    if (err.code === 'EBUSY') {
        console.warn(`[update-results] WARN: Downloads file is locked (Excel open?). Backup at ${BACKUP_XLSX} is up-to-date.`);
    } else {
        throw err;
    }
}
