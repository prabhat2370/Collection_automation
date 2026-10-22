import { firstOBCData } from '../../utils/excelReader.js';
import { PAYMENT_MODES } from '../../test-data/cashier.js';
import { SEG } from '../../test-data/seg.js';
import { DELIVERY } from '../../test-data/deliveryAllocation.js';
import { insertBankStatement } from '../../utils/dbHelper.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function getCollectionRefs() {
    const file = resolve(process.cwd(), 'test-data/runtime/collectionRefs.json');
    if (!existsSync(file)) throw new Error('collectionRefs.json not found — run collection test first');
    return JSON.parse(readFileSync(file));
}

function getSOInvoices() {
    const file = resolve(process.cwd(), 'test-data/runtime/soInvoices.json');
    if (!existsSync(file)) throw new Error('soInvoices.json not found — run SO upload test first');
    return JSON.parse(readFileSync(file));
}

export class CashVerificationPage {
    constructor(page) {
        this.page = page;

        const { salesman } = firstOBCData;

        this.collectionSettlementLink = this.page.locator("//a[normalize-space()='Collection Settlement']");
        this.delivererTab = this.page.locator(":text('Deliverer')");
        this.salesmanSettle = this.page.locator(`//tr[td[1][contains(., '${salesman}')]]//td[10]//div[@cursor='pointer']`);
        this.deliveryRow = this.page.locator(`//tr[td[contains(., '${DELIVERY.vehicleNo}')]]//td[12]//div[@cursor='pointer']`);
        this.startVerification = this.page.locator(":text('Start Verification')");
        this.cashGreenTick = this.page.locator("//img[@alt='greenTick']");
        this.cashRedClose = this.page.locator("img[alt='redClose']");
        this.addReasonBtn = this.page.locator("//span[normalize-space()='Add Reason']");
        this.commentInput = this.page.locator("//input[@placeholder='Type your comment here...']");
        this.addBtn = this.page.locator(":text-is('Add')");
        this.saveBtn = this.page.locator(":text('Save')");
        this.bothBtn = this.page.locator(":text-is('Both')");
        this.submitBtn = this.page.locator(":text('Submit')");
        this.verifyBtn = this.page.locator(":text('Verify')");
        // Step tab "NEFT" in the verification wizard (first match = the step header,
        // before the "NEFT ₹.." summary entry lower on the page).
        this.neftTab = this.page.getByText('NEFT', { exact: true }).first();
    }

    async clickNEFTTab() { await this.neftTab.click({ force: true }); }

    // Checkbox in the invoice row matching the given SO invoice number.
    invoiceCheckbox(invoiceNo) {
        return this.page.locator(`//tr[td[normalize-space()='${invoiceNo}']]//input[@type='checkbox']`);
    }

    async clickCollectionSettlement() { await this.collectionSettlementLink.click(); }
    async clickDeliverer() { await this.delivererTab.click(); }
    async clickSalesmanSettle() { await this.salesmanSettle.click(); }
    async clickDeliveryRow() { await this.deliveryRow.click(); }
    async clickStartVerification() { await this.startVerification.click(); }

    // After a page.reload() the verification wizard always closes — but which page reload()
    // actually leaves us on isn't reliable enough to assume Deliverer-tab / delivery-row are
    // already reachable from there (they live on the Collection Settlement list, not necessarily
    // on whatever URL we reloaded). Re-enter fully from the sidebar nav link — always present,
    // unlike page-specific elements — and replay the exact original entry sequence
    // (Collection Settlement → Deliverer/salesman row → Start Verification). `startVerification`
    // is a page-wide text locator with no row scoping, so re-selecting our own row first is also
    // what keeps it pointed at our invoice rather than whichever row's button is first in DOM
    // order once earlier steps (cash/cheque/upi) have already completed for us.
    async reopenVerificationIfClosed() {
        await this.waitForLoader();
        await this.clickCollectionSettlement();
        await this.waitForLoader();
        if (SEG.verificationType === 'D') {
            await this.clickDeliverer();
            await this.waitForLoader();
            await this.deliveryRow.click();
        } else {
            await this.salesmanSettle.click();
        }
        await this.waitForLoader();
        const startBtn = this.startVerification.first();
        if (await startBtn.isVisible().catch(() => false)) {
            await startBtn.scrollIntoViewIfNeeded().catch(() => {});
            await startBtn.click();
            await this.waitForLoader();
            await this.page.waitForTimeout(1000);
        }
    }

    // Wait for page to settle and loader to hide before interacting
    async waitForLoader() {
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        const loader = this.page.locator('#loader.show');
        if (await loader.isVisible().catch(() => false)) {
            await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        }
    }

    // Applies a per-row Verify/Reject decision across however many rows are currently rendered.
    // `rawMode` is a PAYMENT_MODES.* value: a plain string 'V'/'R'/'NA'/'' broadcasts the same
    // decision to every row (today's existing uniform config still works unchanged) — a `/`
    // -separated string with more than one token ('V/R/V') is per-row. An ARRAY is always
    // strictly positional — index i must have its own entry, even at length 1 (['V'] applies ONLY
    // to row 0; it does NOT broadcast to every row the way the plain string 'V' does). A row past
    // the end of a shorter list, or an empty/invalid token, is skipped — no click at all for that
    // row. `rejectExtra` runs the type-specific steps after clicking redClose for a rejected row
    // (cash's Add-Reason flow differs from cheque/UPI/NEFT's Both+Submit flow).
    //
    // ASSUMES cashGreenTick and cashRedClose render as a parallel accept/reject pair per row (same
    // DOM order, same count) — unverified against a live screen with genuinely mixed V/R rows;
    // the uniform case (all 'V' or all 'R') degrades to the previously-confirmed behavior either way.
    async processRowModes(rawMode, rejectExtra) {
        const isArray = Array.isArray(rawMode);
        const modes = isArray
            ? rawMode.map(s => String(s).trim())
            : (rawMode ? String(rawMode).split('/').map(s => s.trim()) : []);
        if (modes.length === 0) return; // NA/empty = skip entirely

        await this.waitForLoader();
        await this.page.waitForTimeout(1000);
        const greenTicks = await this.cashGreenTick.all();
        const redCloses = await this.cashRedClose.all();
        const rowCount = Math.max(greenTicks.length, redCloses.length);
        if (rowCount === 0) {
            console.log('[CashVerification] processRowModes: no rows found — skipping Save.');
            return;
        }

        let anyProcessed = false;
        for (let i = 0; i < rowCount; i++) {
            // Arrays are strictly positional, even at length 1. Only a non-array (plain) string
            // with exactly one token broadcasts to every row.
            const rowMode = (!isArray && modes.length === 1) ? modes[0] : modes[i];
            if (rowMode === 'V') {
                await greenTicks[i].click({ force: true });
                anyProcessed = true;
            } else if (rowMode === 'R') {
                await redCloses[i].click({ force: true });
                await rejectExtra();
                anyProcessed = true;
            }
            // else: skip this row — no click at all.
        }
        if (anyProcessed) await this.saveBtn.click();
    }

    async runCashFlow() {
        await this.processRowModes(PAYMENT_MODES.cash, async () => {
            await this.addReasonBtn.click();
            await this.commentInput.fill('REJECT');
            await this.addBtn.click();
        });
    }

    // RFC (multi-row) persists upi/neft as an array of {refNumber, amount} — one entry per
    // payment. The salesman-side Collection flow still persists a single {refNumber, amount}
    // object (always exactly one row there) — normalize both shapes to a list so every payment
    // gets its own matching bank-statement row inserted, not just one.
    async runUPIInsert() {
        const { upi } = getCollectionRefs();
        const rows = Array.isArray(upi) ? upi : (upi ? [upi] : []);
        for (const row of rows) {
            await insertBankStatement('UPI', row.refNumber, row.amount);
        }
    }

    async runNEFTInsert() {
        const { neft } = getCollectionRefs();
        const rows = Array.isArray(neft) ? neft : (neft ? [neft] : []);
        for (const row of rows) {
            await insertBankStatement('NEFT', row.refNumber, row.amount);
        }
    }

    async runUPIFlow() {
        await this.processRowModes(PAYMENT_MODES.upi, async () => {
            await this.bothBtn.click();
            await this.submitBtn.click();
        });
    }

    async runNEFTFlow() {
        const mode = PAYMENT_MODES.neft;
        // The 'D'-mode NEFT screen verifies via checkbox + a single global Verify click — it can
        // only do all-or-nothing, never per-row reject. So the checkbox path engages for the plain
        // string 'V' (today's uniform config) OR an array where EVERY entry is 'V' (e.g. ['V','V']
        // — "verify all rows", the only array shape this UI can actually serve). Anything else
        // (a mix, any 'R', or empty) falls through to processRowModes, which will find no tick
        // icons on this screen and no-op with a visible log — not a silent false pass.
        const isUniformVerify = Array.isArray(mode)
            ? mode.length > 0 && mode.every(m => String(m).trim() === 'V')
            : mode === 'V';

        if (isUniformVerify && SEG.verificationType === 'D') {
            await this.waitForLoader();
            await this.page.waitForTimeout(1000);
            // The spec calls page.reload() after inserting the NEFT bank statement so the UI
            // picks up the new payment. That reload CLOSES the verification wizard and drops
            // back to the invoice list (the "Start Verification" button reappears at the
            // bottom). Re-open the wizard before touching the NEFT tab — otherwise clickNEFTTab
            // just hits the "NEFT ₹.." summary on the list page and the invoice checkboxes
            // never render (root cause of the SUNInv checkbox timeout).
            await this.reopenVerificationIfClosed();
            // RFC delivery verification: green tick does not work here — move to the NEFT tab,
            // select the invoice checkbox(es) from soInvoices.json, then Verify.
            //
            // The NEFT tab renders one row per NEFT payment, not one row per invoice — an invoice
            // with multiple NEFT rows (RFC_COLLECTION.neft with >1 entry) matches invoiceCheckbox()
            // more than once. .all() + check-each handles that instead of assuming exactly one row.
            await this.clickNEFTTab();
            await this.waitForLoader();
            await this.page.waitForTimeout(1000);
            const invoices = getSOInvoices();
            for (const inv of invoices) {
                const cbLocator = this.invoiceCheckbox(inv);
                await cbLocator.first().waitFor({ state: 'attached', timeout: 15000 });
                const checkboxes = await cbLocator.all();
                for (const cb of checkboxes) {
                    await cb.check({ force: true });
                }
            }
            await this.verifyBtn.click();
            return;
        }

        // Non-'D' path — including a per-row list ('V/R/V') and any 'R': however many rows are
        // rendered, mark each per its own decision, Save once.
        await this.processRowModes(mode, async () => {
            await this.bothBtn.click();
            await this.submitBtn.click();
        });
    }

    async runChequeFlow() {
        await this.processRowModes(PAYMENT_MODES.cheque, async () => {
            await this.bothBtn.click();
            await this.submitBtn.click();
        });
    }
}
