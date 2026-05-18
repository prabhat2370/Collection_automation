// Resolves runConfig.tcRange → Playwright filter → runs tests → updates Excel.
//
// Usage: node test-cases/run-selected.js
// Or via npm: npm run test:selected

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { TC_MAPPING } from './tcMapping.js';
import { RUN_CONFIG } from './runConfig.js';

const RUN_TCS_FILE = resolve(process.cwd(), 'test-cases/.run-tcs.json');

// ── 1. Resolve TC IDs from config ────────────────────────────────────────────
function resolveTCs(config) {
    const allIds = Object.keys(TC_MAPPING);
    const rng = (config.tcRange || '').trim();

    if (!rng || rng.toUpperCase() === 'ALL') return allIds;

    if (rng.includes(':')) {
        const [start, end] = rng.split(':').map(s => s.trim());
        const startIdx = allIds.indexOf(start);
        const endIdx = allIds.indexOf(end);
        if (startIdx === -1) throw new Error(`[run-selected] Unknown TC ID in range start: ${start}`);
        if (endIdx === -1) throw new Error(`[run-selected] Unknown TC ID in range end: ${end}`);
        const lo = Math.min(startIdx, endIdx);
        const hi = Math.max(startIdx, endIdx);
        return allIds.slice(lo, hi + 1);
    }

    // Comma-separated list
    const list = rng.split(',').map(s => s.trim()).filter(Boolean);
    for (const id of list) {
        if (!TC_MAPPING[id]) throw new Error(`[run-selected] Unknown TC ID: ${id}`);
    }
    return list;
}

const tcIds = resolveTCs(RUN_CONFIG);
console.log(`[run-selected] Range: "${RUN_CONFIG.tcRange}"`);
console.log(`[run-selected] Resolved ${tcIds.length} TCs: ${tcIds[0]} ... ${tcIds[tcIds.length - 1]}`);

// ── 2. Split into automated vs manual ────────────────────────────────────────
const automated = tcIds.filter(id => TC_MAPPING[id]?.specFile);
const manual = tcIds.filter(id => !TC_MAPPING[id]?.specFile);

if (manual.length > 0) {
    console.log(`[run-selected] ${manual.length} manual TCs (will be marked "Manual" in Excel): ${manual.join(', ')}`);
}

if (automated.length === 0) {
    console.log('[run-selected] No automated TCs in range — nothing to run.');
    process.exit(0);
}

// ── 3. Group by spec file + test title for Playwright filtering ──────────────
const specs = new Set();
const titles = new Set();
for (const id of automated) {
    const m = TC_MAPPING[id];
    specs.add(m.specFile);
    titles.add(m.testTitle);
}

console.log(`[run-selected] Specs: ${[...specs].join(', ')}`);
console.log(`[run-selected] Test titles: ${titles.size}`);

// Escape regex special chars for Playwright --grep
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const grepPattern = [...titles].map(escapeRegex).join('|');

// ── 4. Persist resolved TC list — update-results.js reads it for filtering ──
// (Use test-cases/, not test-results/, since Playwright wipes test-results/ on each run.)
writeFileSync(RUN_TCS_FILE, JSON.stringify(tcIds, null, 2));
console.log(`[run-selected] Wrote ${RUN_TCS_FILE}`);

// ── 5. Spawn Playwright (shell:true for Windows .cmd compatibility) ─────────
// Browser is visible when RUN_CONFIG.headed is true (default).
const specArgs = [...specs].join(' ');
const headedFlag = RUN_CONFIG.headed ? '--headed' : '';
const pwCommand = `npx playwright test ${specArgs} --grep "${grepPattern}" ${headedFlag}`.trim();

// Pass screenshot capture setting to test process via env var (afterEach hooks read it)
const captureSS = (RUN_CONFIG.captureScreenshots || 'Y').toUpperCase();
const childEnv = { ...process.env, CAPTURE_SCREENSHOTS: captureSS };
console.log(`[run-selected] CAPTURE_SCREENSHOTS=${captureSS}`);

console.log(`[run-selected] Running: ${pwCommand}`);

const pwProc = spawn(pwCommand, { stdio: 'inherit', shell: true, env: childEnv });

pwProc.on('close', (code) => {
    console.log(`[run-selected] Playwright exit code: ${code}`);
    console.log('[run-selected] Updating Excel...');

    const updProc = spawn('node test-cases/update-results.js', { stdio: 'inherit', shell: true });
    updProc.on('close', (updCode) => {
        console.log(`[run-selected] update-results exit code: ${updCode}`);
        process.exit(code);
    });
});

pwProc.on('error', (err) => {
    console.error(`[run-selected] Failed to spawn Playwright:`, err);
    process.exit(1);
});
