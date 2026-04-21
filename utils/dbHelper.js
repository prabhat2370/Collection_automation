import { createRequire } from 'module';
import { resolve } from 'path';
const require = createRequire(import.meta.url);

const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
const dotenv = require('dotenv');

dotenv.config({ path: resolve(process.cwd(), '.env') });

const DB = {
    ssh: {
        host: process.env.DB_SSH_HOST,
        port: Number(process.env.DB_SSH_PORT),
        username: process.env.DB_SSH_USER,
        password: process.env.DB_SSH_PASSWORD,
    },
    mysql: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
};

function createSSHTunnel() {
    return new Promise((resolve, reject) => {
        const ssh = new Client();
        ssh.on('ready', () => {
            ssh.forwardOut(
                '127.0.0.1', 0,
                DB.mysql.host, DB.mysql.port,
                (err, stream) => {
                    if (err) { ssh.end(); return reject(err); }
                    resolve({ stream, ssh });
                }
            );
        });
        ssh.on('error', reject);
        ssh.connect({
            host: DB.ssh.host,
            port: DB.ssh.port,
            username: DB.ssh.username,
            password: DB.ssh.password,
        });
    });
}

// ─── OBC Elimination Helpers ──────────────────────────────────────────────────

/**
 * Returns up to `limit` Bill Back invoices for the given FC+Brand.
 * collected_amount = 0 ensures a clean invoice with no prior collections —
 * makes before/after balance assertions unambiguous.
 */
export async function getBillBackInvoices(fcId, brandId, limit = 5) {
    const sql = `
        SELECT *
        FROM ChampOutstandingInvoices
        WHERE fc_id = ? AND brand_id = ?
          AND bill_status IN ('Bill Back')
          AND collected_amount = 0
        ORDER BY id DESC
        LIMIT ${Number(limit)}
    `;
    return runQuery(sql, [fcId, brandId]);
}

/**
 * Returns the ChampFcBrands row for the given fc+brand.
 * Key columns: obc_adjustment_date, invoice_threshold_date
 */
export async function getChampFcBrandsConfig(fcId, brandId) {
    const sql = `
        SELECT obc_adjustment_date, invoice_threshold_date
        FROM ChampFcBrands
        WHERE fc_id = ? AND brand_id = ?
        LIMIT 1
    `;
    const rows = await runQuery(sql, [fcId, brandId]);
    return rows[0] ?? null;
}

/**
 * Returns the most recent Orders row for a given invoice_no (all columns).
 * Used to check TC 007/008 (invoice_date vs invoice_threshold_date boundary).
 * Query: SELECT * FROM Orders WHERE invoice_no = ?
 */
export async function getInvoiceDateFromOrders(invoiceNo) {
    const sql = `
        SELECT *
        FROM Orders
        WHERE invoice_no = ?
        ORDER BY id DESC
        LIMIT 1
    `;
    const rows = await runQuery(sql, [invoiceNo]);
    return rows[0]?.invoice_date ?? null;
}

/**
 * Returns the most recent obc_adjustment_data row for the given invoice.
 * Actual columns from schema: brand_id, fc_id, adjusted_bill_no, adjusted_amount,
 * type, unique_key_hash, file_id, credit_note_no, created_at
 */
export async function getObcAdjustmentEntry(brandId, fcId, invoiceNo, adjustedAmount) {
    const sql = `
        SELECT *
        FROM obc_adjustment_data
        WHERE brand_id = ?
          AND fc_id = ?
          AND adjusted_bill_no = ?
          AND adjusted_amount = ?
        ORDER BY id DESC
        LIMIT 1
    `;
    const rows = await runQuery(sql, [brandId, fcId, invoiceNo, adjustedAmount]);
    return rows[0] ?? null;
}

/**
 * Returns the most recent collection_invoices row for a given invoice_no.
 * ORDER BY id DESC so we always get the new OBC entry, not an older one.
 */
export async function getCollectionInvoiceEntry(invoiceNo) {
    const sql = `
        SELECT *
        FROM collection_invoices
        WHERE invoice_no = ?
        ORDER BY id DESC
        LIMIT 1
    `;
    const rows = await runQuery(sql, [invoiceNo]);
    return rows[0] ?? null;
}

/**
 * Returns all payments rows for a given collection_invoice_id.
 * Used to verify the payment entry created by OBC Elimination.
 * Query: SELECT * FROM payments WHERE collection_invoice_id = ?
 */
export async function getPaymentsByCollectionInvoiceId(collectionInvoiceId) {
    const sql = `
        SELECT *
        FROM payments
        WHERE collection_invoice_id = ?
    `;
    return runQuery(sql, [collectionInvoiceId]);
}

/**
 * Returns the ChampOutstandingInvoices row for the given invoice_no in the given FC+Brand.
 * Used to check the outstanding balance before and after upload.
 */
export async function getChampOutstandingInvoice(invoiceNo, fcId, brandId) {
    const sql = `
        SELECT *
        FROM ChampOutstandingInvoices
        WHERE invoice_no = ?
          AND fc_id = ?
          AND brand_id = ?
        LIMIT 1
    `;
    const rows = await runQuery(sql, [invoiceNo, fcId, brandId]);
    return rows[0] ?? null;
}

/**
 * Deletes obc_adjustment_data entries for the given invoice+amount combination.
 * Used as cleanup before re-running the happy-path test.
 */
export async function deleteObcAdjustmentEntries(brandId, fcId, invoiceNo, adjustedAmount) {
    const sql = `
        DELETE FROM obc_adjustment_data
        WHERE brand_id = ?
          AND fc_id = ?
          AND adjusted_bill_no = ?
          AND adjusted_amount = ?
    `;
    return runQuery(sql, [brandId, fcId, invoiceNo, adjustedAmount]);
}

// ─────────────────────────────────────────────────────────────────────────────

export async function subtractCollectionDate(invoiceNo) {
    const sql = `
        UPDATE collection_invoices
        SET collection_date = DATE_SUB(collection_date, INTERVAL 1 DAY)
        WHERE invoice_no = ?
    `;
    return runQuery(sql, [invoiceNo]);
}

export async function insertBankStatement(paymentMode, refNumber, amount) {
    const sql = `
        INSERT INTO bank_statement_api (
            bank_name, transaction_date, transaction_number, transaction_type,
            value_date, particulars, cheque_number, ifsc_code, va_number,
            debit, credit, balance, raw_data,
            created_at, created_by, updated_at, updated_by,
            remitter_name, verification_status
        ) VALUES (
            ?, NOW(), ?, ?,
            NOW(), ?, '', '', '',
            0.00, ?, 0.00, 'Manual entry for payment resolution',
            NOW(), 'SYSTEM', NOW(), 'SYSTEM',
            'Remitter Name', ''
        )
    `;
    return runQuery(sql, [paymentMode, refNumber, paymentMode, refNumber, parseFloat(amount)]);
}

export async function runQuery(sql, params = []) {
    const { stream, ssh } = await createSSHTunnel();
    const connection = await mysql.createConnection({
        user: DB.mysql.user,
        password: DB.mysql.password,
        database: DB.mysql.database,
        stream,
    });
    try {
        const [result] = await connection.execute(sql, params);
        return result;
    } finally {
        await connection.end();
        ssh.end();
    }
}
