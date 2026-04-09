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
