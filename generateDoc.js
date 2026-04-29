import {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, AlignmentType,
    BorderStyle, ShadingType, PageBreak,
    Header, Footer,
} from 'docx';
import { writeFileSync } from 'fs';

// ── Colour palette ─────────────────────────────────────────────────────────
const BLUE    = '1B4F8A';
const LBLUE   = 'D6E4F0';
const GREEN   = '1E7F4E';
const LGREEN  = 'D5F5E3';
const ORANGE  = 'CA6F1E';
const LORANGE = 'FAE5D3';
const GREY    = 'F2F3F4';
const WHITE   = 'FFFFFF';
const DARK    = '1C2833';

// ── Helpers ────────────────────────────────────────────────────────────────
const bold = (text, size = 22, color = DARK) =>
    new TextRun({ text, bold: true, size, color });

const h1 = (text) => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    run: { color: BLUE, bold: true, size: 32 },
    shading: { type: ShadingType.SOLID, color: LBLUE },
});

const h2 = (text) => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    run: { color: BLUE, bold: true, size: 26 },
});

const para = (text, size = 20) => new Paragraph({
    children: [new TextRun({ text, size, color: DARK })],
    spacing: { after: 120 },
});

const bullet = (text, size = 20) => new Paragraph({
    children: [new TextRun({ text, size, color: DARK })],
    bullet: { level: 0 },
    spacing: { after: 80 },
});

const spacer = () => new Paragraph({ text: '', spacing: { after: 160 } });

// Coloured info box
const infoBox = (label, text, bg = LBLUE) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        new TableRow({ children: [
            new TableCell({
                children: [new Paragraph({
                    children: [
                        new TextRun({ text: label + '  ', bold: true, size: 20, color: BLUE }),
                        new TextRun({ text, size: 20, color: DARK }),
                    ],
                    spacing: { before: 80, after: 80 },
                })],
                shading: { type: ShadingType.SOLID, color: bg },
                margins: { top: 80, bottom: 80, left: 160, right: 160 },
                borders: { top: none, bottom: none, left: { style: BorderStyle.THICK, size: 24, color: BLUE }, right: none },
            }),
        ]}),
    ],
    borders: { top: none, bottom: none, left: none, right: none, insideH: none, insideV: none },
});

const none = { style: BorderStyle.NONE };

// Flow diagram table (vertical steps)
const flowDiagram = (steps) => {
    const rows = [];
    steps.forEach((step, i) => {
        // Step box
        rows.push(new TableRow({ children: [
            new TableCell({ children: [], width: { size: 10, type: WidthType.PERCENTAGE }, borders: { top: none, bottom: none, left: none, right: none } }),
            new TableCell({
                children: [new Paragraph({
                    children: [
                        new TextRun({ text: `${i + 1}.  `, bold: true, size: 20, color: WHITE }),
                        new TextRun({ text: step.title, bold: true, size: 20, color: WHITE }),
                        ...(step.desc ? [new TextRun({ text: `\n     ${step.desc}`, size: 18, color: 'D5D8DC' })] : []),
                    ],
                    spacing: { before: 100, after: 100 },
                })],
                shading: { type: ShadingType.SOLID, color: step.color || BLUE },
                margins: { top: 100, bottom: 100, left: 200, right: 200 },
                borders: { top: none, bottom: none, left: none, right: none },
                width: { size: 80, type: WidthType.PERCENTAGE },
            }),
            new TableCell({ children: [], width: { size: 10, type: WidthType.PERCENTAGE }, borders: { top: none, bottom: none, left: none, right: none } }),
        ]}));

        // Arrow (except after last)
        if (i < steps.length - 1) {
            rows.push(new TableRow({ children: [
                new TableCell({ children: [], borders: { top: none, bottom: none, left: none, right: none } }),
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: '▼', size: 24, color: BLUE })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 40, after: 40 },
                    })],
                    borders: { top: none, bottom: none, left: none, right: none },
                }),
                new TableCell({ children: [], borders: { top: none, bottom: none, left: none, right: none } }),
            ]}));
        }
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
        borders: { top: none, bottom: none, left: none, right: none, insideH: none, insideV: none },
    });
};

// Config table
const configTable = (rows, headers = ['Setting', 'Value', 'What it means']) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        new TableRow({
            tableHeader: true,
            children: headers.map(h => new TableCell({
                children: [new Paragraph({ children: [bold(h, 20, WHITE)], spacing: { before: 80, after: 80 } })],
                shading: { type: ShadingType.SOLID, color: BLUE },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
            })),
        }),
        ...rows.map((row, ri) => new TableRow({ children: row.map((cell) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 18, color: DARK })], spacing: { before: 60, after: 60 } })],
            shading: { type: ShadingType.SOLID, color: ri % 2 === 0 ? WHITE : GREY },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
        }))})),
    ],
});

// ── DOCUMENT BUILD ─────────────────────────────────────────────────────────
const doc = new Document({
    title: 'Collection Auto – User Guide',
    description: 'Non-technical documentation for the Ripplr Collection Automation System',
    numbering: { config: [] },
    sections: [{
        properties: {},
        headers: {
            default: new Header({ children: [
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Ripplr Collection Automation  |  User Guide', size: 18, color: '888888' }),
                    ],
                    alignment: AlignmentType.RIGHT,
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE } },
                }),
            ]}),
        },
        footers: {
            default: new Footer({ children: [
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Ripplr Collection Automation  |  User Guide', size: 18, color: '888888' }),
                    ],
                    alignment: AlignmentType.CENTER,
                    border: { top: { style: BorderStyle.SINGLE, size: 6, color: BLUE } },
                }),
            ]}),
        },
        children: [

            // ── COVER PAGE ─────────────────────────────────────────────────
            new Paragraph({
                children: [new TextRun({ text: '', break: 6 })],
            }),
            new Paragraph({
                children: [bold('RIPPLR COLLECTION', 72, BLUE)],
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                children: [bold('AUTOMATION SYSTEM', 72, BLUE)],
                alignment: AlignmentType.CENTER,
            }),
            spacer(),
            new Paragraph({
                children: [new TextRun({ text: 'Complete User Guide', size: 40, color: ORANGE, bold: true })],
                alignment: AlignmentType.CENTER,
            }),
            spacer(),
            new Paragraph({
                children: [new TextRun({ text: 'For Business & Operations Teams', size: 26, color: '555555' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 800 },
            }),
            new Paragraph({
                children: [new TextRun({ text: 'Version 1.0  |  2024', size: 20, color: '888888' })],
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ children: [new PageBreak()] }),

            // ── WHAT IS THIS SYSTEM ────────────────────────────────────────
            h1('📋  What is this System?'),
            para('The Ripplr Collection Automation System automatically handles the entire collection cycle — from uploading sales data to verifying payments — without manual clicking through every screen.'),
            spacer(),
            para('Think of it as a robot that logs into the system, fills in forms, uploads files, and confirms payments — just like a team member would, but faster and without errors.'),
            spacer(),
            infoBox('💡 Key Benefit:', 'What used to take hours of manual work across multiple screens now runs automatically in minutes.'),
            spacer(),

            // ── OVERALL FLOW DIAGRAM ───────────────────────────────────────
            h1('🔄  Complete Process Overview'),
            para('Every working day, the automation runs these steps in order:'),
            spacer(),
            flowDiagram([
                { title: 'Login to System',            desc: 'Securely logs in using stored credentials',                       color: BLUE },
                { title: 'Upload Sales Order (SO)',     desc: 'Uploads 3 report files and captures invoice numbers',            color: '1A5276' },
                { title: 'Delivery Allocation',         desc: 'Assigns captured invoices to the delivery driver/vehicle',       color: '1F618D' },
                { title: 'Return to FC',                desc: 'Marks delivery status, records collections, uploads documents',  color: '2874A6' },
                { title: 'Upload OBC File',             desc: 'Uploads the outbound collection Excel report',                   color: '2E86C1' },
                { title: 'SEG Allocation',              desc: 'SEG team assigns invoices to the salesman',                     color: GREEN },
                { title: 'Collection Entry',            desc: 'Salesman submits cash, cheque, UPI and NEFT payments',          color: '1E8449' },
                { title: 'SEG Verification',            desc: 'SEG team approves or rejects the collection',                   color: '239B56' },
                { title: 'Cash Verification',           desc: 'Cashier verifies each payment type individually',               color: ORANGE },
            ]),
            spacer(),
            new Paragraph({ children: [new PageBreak()] }),

            // ── CONFIGURATION GUIDE ────────────────────────────────────────
            h1('⚙️  Configuration Guide'),
            para('All settings are controlled from one file: config/testData.js. You do NOT need to touch any other file to change how the automation runs.'),
            spacer(),

            h2('👤  User Accounts'),
            para('These are the login credentials used by the automation for each part of the system:'),
            spacer(),
            configTable([
                ['OBC / Admin',   'admin@ripplr.in',    'Used for SO Upload, Delivery, RFC, OBC Upload'],
                ['SEG Staff',     'seg4@ripplr.in',     'Used for SEG Allocation and SEG Verification'],
                ['Collection App','Mobile: 9739492646', 'Used for the Collection mobile app (PIN: 1234)'],
                ['Cashier',       'cash4@ripplr.in',    'Used for Cash Verification'],
            ], ['Role', 'Credential', 'Used For']),
            spacer(),

            h2('📁  Upload File Paths'),
            para('These are the files the automation uploads. Update these paths when you receive new files:'),
            spacer(),
            configTable([
                ['OBC File',       'preprodobc 2 (version 1).xlsb.xlsx', 'Outbound collection Excel report'],
                ['SO Report',      'm1 6.csv',                           'Sales order report CSV'],
                ['Invoice Report', 'h1 6.csv',                           'Invoice report CSV'],
                ['Sales Register', 'sr 10.csv',                          'Sales register CSV'],
            ], ['File', 'Current Filename', 'Purpose']),
            spacer(),
            infoBox('📌 Note:', 'All files should be placed in the Downloads folder: C:\\Users\\User\\Downloads\\', LORANGE),
            spacer(),

            h2('💰  Payment Amounts'),
            para('These are the amounts entered during the Collection step:'),
            spacer(),
            configTable([
                ['Cash',   '₹1',  'Amount entered as cash payment'],
                ['Cheque', '₹2',  'Amount entered as cheque payment'],
                ['UPI/QR', '₹3',  'Amount entered as UPI/QR payment'],
                ['NEFT',   '₹4',  'Amount entered as NEFT transfer'],
            ], ['Payment Type', 'Amount', 'Description']),
            spacer(),

            h2('✅  Verification Modes'),
            para('Control whether each payment type is Verified, Rejected, or Skipped during Cash Verification:'),
            spacer(),
            configTable([
                ['V  (Verify)',  'Approves the payment — marks it as confirmed'],
                ['R  (Reject)',  'Rejects the payment — adds a rejection reason'],
                ['NA (Skip)',    'Does nothing — leaves the payment as-is'],
            ], ['Code', 'What Happens']),
            spacer(),
            para('Current settings:'),
            configTable([
                ['Cash',   'NA', 'Skipped (not verified)'],
                ['Cheque', 'V',  'Verified (approved)'],
                ['UPI',    'V',  'Verified (approved)'],
                ['NEFT',   'V',  'Verified (approved)'],
            ], ['Payment Type', 'Mode', 'Action']),
            spacer(),

            h2('🚚  Delivery Settings'),
            para('These settings are used when creating the delivery allocation:'),
            spacer(),
            configTable([
                ['Vehicle Number', 'TN09TN9090',  'The vehicle assigned for delivery'],
                ['Driver Name',    'Test Driver', 'Driver receiving the allocation'],
                ['Driver Mobile',  '8303111111',  'Driver contact number'],
                ['Vendor',         'Test Vendor', 'Vendor associated with delivery'],
                ['Delivery Status','D (Delivered)','Default status set for all invoices in RFC'],
            ], ['Setting', 'Value', 'Description']),
            spacer(),

            h2('📦  RFC Collection Amounts'),
            para('Amounts filled in the collection form during Return to FC processing. Leave blank to skip that payment type:'),
            spacer(),
            configTable([
                ['Cash',   '1',      'Filled during RFC'],
                ['Cheque', '(blank)','Skipped during RFC'],
                ['UPI',    '(blank)','Skipped during RFC'],
                ['NEFT',   '(blank)','Skipped during RFC'],
            ], ['Payment Type', 'Amount', 'Status']),
            spacer(),
            new Paragraph({ children: [new PageBreak()] }),

            // ── FLOW 1: OBC UPLOAD ─────────────────────────────────────────
            h1('📤  Flow 1 — OBC Upload'),
            infoBox('🎯 Purpose:', 'Uploads the daily Outbound Collection (OBC) Excel file to the system and confirms it was processed successfully.', LGREEN),
            spacer(),
            h2('Step-by-Step'),
            flowDiagram([
                { title: 'Login to CDMS',             desc: 'Opens the CDMS system and signs in',                    color: BLUE },
                { title: 'Go to Adapter Uploads',     desc: 'Navigates to the upload section',                       color: '1A5276' },
                { title: 'Select Upload Type: OBC',   desc: 'Chooses "OBC" from the type dropdown',                  color: '1F618D' },
                { title: 'Select FC and Brand',       desc: 'Picks BTML: BTM and Britannia',                          color: '2874A6' },
                { title: 'Upload the OBC File',       desc: 'Selects the Excel file from Downloads folder',           color: '2E86C1' },
                { title: 'Submit',                    desc: 'Submits the upload form',                                color: '3498DB' },
                { title: 'Search & Verify',           desc: 'Searches twice to confirm upload is processed',          color: GREEN },
                { title: 'Check Status Icon',         desc: 'Confirms upload was received by the system',             color: '239B56' },
            ]),
            spacer(),
            h2('What to Check'),
            bullet('The status icon should turn green after the upload is processed'),
            bullet('If the file is not found, verify the filename matches exactly in FILE_PATHS.obcFile'),
            spacer(),
            new Paragraph({ children: [new PageBreak()] }),

            // ── FLOW 2: SO UPLOAD ──────────────────────────────────────────
            h1('📊  Flow 2 — Sales Order (SO) Upload'),
            infoBox('🎯 Purpose:', 'Uploads three sales report files and captures the invoice numbers that will be used throughout the rest of the automation.', LGREEN),
            spacer(),
            h2('Step-by-Step'),
            flowDiagram([
                { title: 'Login to CDMS',                  desc: 'Signs in as admin user',                                      color: BLUE },
                { title: 'Go to Adapter Uploads',          desc: 'Navigates to the upload section',                             color: '1A5276' },
                { title: 'Select Type: Sales Order',       desc: 'Chooses "Sales Order" from dropdown',                         color: '1F618D' },
                { title: 'Select FC and Brand',            desc: 'Picks BTML: BTM and Britannia',                                color: '2874A6' },
                { title: 'Upload SO Report',               desc: 'Uploads the sales order CSV file',                            color: '2E86C1' },
                { title: 'Upload Invoice Report',          desc: 'Uploads the invoice CSV file',                                color: '3498DB' },
                { title: 'Upload Sales Register',          desc: 'Uploads the sales register CSV file',                         color: '5DADE2' },
                { title: 'Submit',                         desc: 'Sends all 3 files to the system',                             color: GREEN },
                { title: 'Wait for Processing',            desc: 'Checks every 5 seconds (up to 2 minutes) for completion',     color: '1E7F4E' },
                { title: 'Capture Invoice Numbers',        desc: 'Saves invoice numbers to soInvoices.json for next steps',     color: '239B56' },
            ]),
            spacer(),
            h2('What Happens Behind the Scenes'),
            bullet('The system waits up to 2 minutes for the upload to show "Fully Processed" status'),
            bullet('It also checks that the upload happened within the last 3 minutes (to avoid picking up old uploads)'),
            bullet('The captured invoice numbers are saved and automatically used by Delivery Allocation, RFC, and other steps'),
            spacer(),
            new Paragraph({ children: [new PageBreak()] }),

            // ── FLOW 3: DELIVERY ALLOCATION ────────────────────────────────
            h1('🚚  Flow 3 — Delivery Allocation'),
            infoBox('🎯 Purpose:', 'Assigns the uploaded invoices to a specific driver and vehicle for delivery.', LGREEN),
            spacer(),
            h2('Step-by-Step'),
            flowDiagram([
                { title: 'Go to Logistics Management',     desc: 'Navigates to the logistics section',                         color: BLUE },
                { title: 'Click Delivery Allocation',      desc: 'Opens the allocation list',                                  color: '1A5276' },
                { title: 'Create New Allocation',          desc: 'Starts a new delivery allocation',                           color: '1F618D' },
                { title: 'Select All Invoices',            desc: 'Ticks the checkbox for each invoice from SO Upload',         color: '2874A6' },
                { title: 'Fill Allocation Details',        desc: 'Vehicle, driver, pick type, vendor details',                 color: '2E86C1' },
                { title: 'Submit',                         desc: 'Submits the allocation form',                                color: GREEN },
                { title: 'Confirm',                        desc: 'Confirms the allocation in two dialog steps',                color: '239B56' },
            ]),
            spacer(),
            h2('Vehicle Details Used'),
            configTable([
                ['Pick Type',      'Both',        'Picks all types of goods'],
                ['Vehicle Type',   'Adhoc',       'On-demand vehicle'],
                ['Allocation Type','Eco',         'Economy allocation mode'],
                ['Vehicle No',     'TN09TN9090',  'Set in DELIVERY.vehicleNo'],
                ['Driver',         'Test Driver', 'Set in DELIVERY.driverName'],
            ], ['Field', 'Value', 'Source']),
            spacer(),
            new Paragraph({ children: [new PageBreak()] }),

            // ── FLOW 4: RETURN TO FC ───────────────────────────────────────
            h1('🔁  Flow 4 — Return to FC (RFC)'),
            infoBox('🎯 Purpose:', 'For each invoice: marks its delivery status, records the collection payment, verifies it, uploads supporting documents, and closes the RFC.', LGREEN),
            spacer(),
            h2('Step-by-Step'),
            flowDiagram([
                { title: 'Go to Return to FC',             desc: 'Navigates to Logistics → Return to FC',                      color: BLUE },
                { title: 'Open Driver Record',             desc: 'Clicks the eye icon next to "Test Driver"',                  color: '1A5276' },
                { title: 'Process Each Invoice (Loop)',    desc: 'Repeats steps below for every invoice',                      color: ORANGE },
                { title: 'Set Delivery Status',            desc: 'Selects Delivered / Partial Delivered / Attempted / Cancelled', color: '2874A6' },
                { title: 'Confirm Prompts',                desc: 'Clicks OK and Yes on confirmation dialogs',                  color: '2E86C1' },
                { title: 'Fill Collection Form',           desc: 'Enters cash / cheque / UPI / NEFT amounts',                  color: '3498DB' },
                { title: 'Submit Collection',              desc: 'Updates the collection record',                              color: '5DADE2' },
                { title: 'Verify All Invoices',            desc: 'Clicks the check icon for each invoice',                     color: GREEN },
                { title: 'Upload 2 Documents',             desc: 'Uploads rfc_doc1.jpg and rfc_doc2.jpg',                      color: '1E7F4E' },
                { title: 'Click Verify (RFC Close)',       desc: 'Closes the RFC — marks it as complete',                      color: '239B56' },
                { title: 'Update Database Dates',          desc: 'Subtracts 1 day from collection_date per invoice',           color: '1D8348' },
            ]),
            spacer(),
            h2('Delivery Status Codes'),
            configTable([
                ['D',  'Delivered',          'Invoice was fully delivered'],
                ['PD', 'Partial Delivered',  'Invoice was partially delivered'],
                ['DA', 'Delivery Attempted', 'Delivery was attempted but failed'],
                ['C',  'Cancelled',          'Delivery was cancelled'],
            ], ['Code', 'Meaning', 'When to Use']),
            spacer(),
            h2('Collection Form — When is a Field Filled?'),
            para('Only fields with a non-empty value in RFC_COLLECTION will be filled. Empty means skip that payment type.'),
            spacer(),
            new Paragraph({ children: [new PageBreak()] }),

            // ── FLOW 5: SEG ALLOCATION ─────────────────────────────────────
            h1('👥  Flow 5 — SEG Allocation'),
            infoBox('🎯 Purpose:', 'The SEG (Sales Execution Group) team assigns invoices to a specific salesman so they can collect payment from customers.', LGREEN),
            spacer(),
            h2('Step-by-Step'),
            flowDiagram([
                { title: 'Login as SEG User',              desc: 'Signs in with SEG staff credentials',                        color: GREEN },
                { title: 'Open Allocation Section',        desc: 'Clicks the Allocation link in the menu',                    color: '1E7F4E' },
                { title: 'Select FC and Brand',            desc: 'Picks BTML: BTM and Britannia',                              color: '239B56' },
                { title: 'Continue',                       desc: 'Moves to the invoice list screen',                           color: '1D8348' },
                { title: 'Select Salesman',                desc: 'Picks the salesman from the OBC Excel data',                 color: '117A65' },
                { title: 'Search Invoices',                desc: 'Loads available invoices for assignment',                    color: '0E6655' },
                { title: 'Select Invoice Checkbox',        desc: 'Ticks the invoice to be assigned',                          color: '0B5345' },
                { title: 'Assign and Submit',              desc: 'Assigns the invoice to the salesman and confirms',           color: BLUE },
            ]),
            spacer(),

            // ── FLOW 6: COLLECTION ─────────────────────────────────────────
            h1('💵  Flow 6 — Collection'),
            infoBox('🎯 Purpose:', 'The salesman enters the payment received from the customer — across cash, cheque, UPI, and NEFT.', LGREEN),
            spacer(),
            h2('Step-by-Step'),
            flowDiagram([
                { title: 'Open Collection App',            desc: 'Goes to the mobile collection portal',                       color: ORANGE },
                { title: 'Login with Mobile + PIN',        desc: 'Enters mobile number and 4-digit PIN',                      color: 'CA6F1E' },
                { title: 'Select Invoice',                 desc: 'Expands the invoice using the down arrow',                   color: 'BA4A00' },
                { title: 'Enter Cash Amount',              desc: '₹1 (as set in AMOUNTS.cash)',                               color: 'A93226' },
                { title: 'Enter Cheque Details',           desc: 'Amount, reference number, bank, and due date',               color: '922B21' },
                { title: 'Enter UPI Amount + Reference',   desc: '₹3 with auto-generated 14-digit reference number',          color: '7B241C' },
                { title: 'Enter NEFT Amount + Reference',  desc: '₹4 with auto-generated 12-digit reference number',          color: GREEN },
                { title: 'Select Split Reason',            desc: '"Shop Permanently Closed" from the dropdown',               color: '1E7F4E' },
                { title: 'Submit Collection',              desc: 'Final submission with confirmation',                         color: '239B56' },
            ]),
            spacer(),
            h2('Auto-Generated Reference Numbers'),
            infoBox('ℹ️ Info:', 'UPI and NEFT reference numbers are automatically generated using the current timestamp (14 and 12 digits respectively). These are also saved to a file so the Cash Verification step can look them up in the bank system.', LBLUE),
            spacer(),
            new Paragraph({ children: [new PageBreak()] }),

            // ── FLOW 7: SEG VERIFICATION ───────────────────────────────────
            h1('🔍  Flow 7 — SEG Verification'),
            infoBox('🎯 Purpose:', 'The SEG team reviews the collection submitted by the salesman and either approves (Verify) or rejects it.', LGREEN),
            spacer(),
            h2('Step-by-Step'),
            flowDiagram([
                { title: 'Login as SEG User',              desc: 'Signs in with SEG staff credentials',                       color: GREEN },
                { title: 'Open Verification Section',      desc: 'Clicks the Verification menu item',                         color: '1E7F4E' },
                { title: 'Select Salesman Row',            desc: 'Finds and clicks the salesman from OBC data',               color: '239B56' },
                { title: 'Start Verification',             desc: 'Clicks "Start Verification" button',                        color: '1D8348' },
                { title: 'Verify or Reject',               desc: 'Based on SEG.verificationMode setting',                     color: BLUE },
            ]),
            spacer(),
            h2('Verification Modes'),
            configTable([
                ['V (Verify)', 'Clicks the green tick → clicks Verify → collection is approved'],
                ['R (Reject)', 'Clicks the red X → fills in data correction reason → clicks Reject'],
            ], ['Mode', 'What Happens']),
            spacer(),
            infoBox('⚙️ To Change Mode:', 'Update SEG.verificationMode in config/testData.js — change "V" to "R" to reject instead of verify.', LORANGE),
            spacer(),

            // ── FLOW 8: CASH VERIFICATION ──────────────────────────────────
            h1('🏦  Flow 8 — Cash Verification'),
            infoBox('🎯 Purpose:', 'The cashier reviews and approves (or rejects) each payment type — Cash, Cheque, UPI, and NEFT — one by one.', LGREEN),
            spacer(),
            h2('Step-by-Step'),
            flowDiagram([
                { title: 'Login as Cashier',               desc: 'Signs in with cash verification credentials',               color: ORANGE },
                { title: 'Open Collection Settlement',     desc: 'Navigates to the Collection Settlement section',            color: 'CA6F1E' },
                { title: 'Select Salesman Record',         desc: 'Clicks the settle icon for the salesman',                   color: 'BA4A00' },
                { title: 'Start Verification',             desc: 'Clicks "Start Verification"',                               color: 'A93226' },
                { title: 'Verify / Skip Cash',             desc: 'Based on PAYMENT_MODES.cash setting',                       color: '922B21' },
                { title: 'Verify / Skip Cheque',           desc: 'Based on PAYMENT_MODES.cheque setting',                     color: '7B241C' },
                { title: 'Insert UPI Bank Statement',      desc: 'Adds UPI record to bank system via database',               color: GREEN },
                { title: 'Verify / Skip UPI',              desc: 'Based on PAYMENT_MODES.upi setting',                        color: '1E7F4E' },
                { title: 'Insert NEFT Bank Statement',     desc: 'Adds NEFT record to bank system via database',              color: '239B56' },
                { title: 'Verify / Skip NEFT',             desc: 'Based on PAYMENT_MODES.neft setting',                       color: '1D8348' },
            ]),
            spacer(),
            h2('Why are UPI and NEFT Inserted into the Bank System?'),
            para('Before the cashier can verify a UPI or NEFT payment, the system needs to see a matching record from the bank. The automation inserts this record automatically using the reference number saved during the Collection step — simulating what would arrive from a real bank feed.'),
            spacer(),
            h2('Smart Loader Handling'),
            infoBox('ℹ️ Info:', 'Between each payment verification, the system waits for the page to fully load before proceeding. It checks if a loading spinner is active — if yes, it waits for it to disappear before clicking. This prevents errors caused by clicking while the page is still updating.', LBLUE),
            spacer(),
            new Paragraph({ children: [new PageBreak()] }),

            // ── RUNNING THE AUTOMATION ─────────────────────────────────────
            h1('▶️  How to Run the Automation'),
            h2('Run a Single Flow'),
            para('Open a terminal/command prompt in the project folder and type one of these commands:'),
            spacer(),
            configTable([
                ['npm run obc',             'Runs only the OBC Upload flow'],
                ['npm run so',              'Runs only the SO Upload flow'],
                ['npm run dA',              'Runs only the Delivery Allocation flow'],
                ['npm run rfc',             'Runs only the Return to FC flow'],
                ['npm run segAllocation',   'Runs only the SEG Allocation flow'],
                ['npm run collection',      'Runs only the Collection flow'],
                ['npm run segVerification', 'Runs only the SEG Verification flow'],
                ['npm run cash',            'Runs only the Cash Verification flow'],
                ['npm run smoke',           'Runs ALL flows in sequence (full smoke test)'],
            ], ['Command', 'What it Runs']),
            spacer(),

            h2('Run All Flows Together'),
            infoBox('🚀 Full Run:', 'Type: npm run smoke — This runs all 9 steps in the correct order automatically.', LGREEN),
            spacer(),

            h2('View Test Reports'),
            configTable([
                ['npm run allure:generate', 'Creates the HTML test report'],
                ['npm run allure:open',     'Opens the report in your browser'],
                ['npm run allure:report',   'Creates AND opens the report in one command'],
            ], ['Command', 'What it Does']),
            spacer(),
            new Paragraph({ children: [new PageBreak()] }),

            // ── TROUBLESHOOTING ────────────────────────────────────────────
            h1('🔧  Troubleshooting Common Issues'),
            spacer(),
            configTable([
                ['File not found error',         'Check the file name and path in FILE_PATHS in testData.js. Make sure the file is in the Downloads folder.'],
                ['Login failed',                 'Check the email/password in USERS in testData.js. Try logging in manually to confirm credentials work.'],
                ['SO Upload not processing',     'The upload may take longer than 2 minutes. Wait and re-run the SO Upload step separately.'],
                ['Payment verification failing', 'Check PAYMENT_MODES in testData.js. Make sure the mode is set correctly (V, R, or NA).'],
                ['RFC Verify button not working','Ensure all invoices are verified (check icons are ticked) and both documents are uploaded before clicking Verify.'],
                ['Database error',               'Check the .env file credentials. Confirm the SSH and MySQL passwords are correct and the server is accessible.'],
            ], ['Problem', 'Solution']),
            spacer(),

            // ── QUICK REFERENCE ────────────────────────────────────────────
            h1('📌  Quick Reference Card'),
            spacer(),
            configTable([
                ['Change login credentials',     'config/testData.js  →  USERS section'],
                ['Change upload files',          'config/testData.js  →  FILE_PATHS section'],
                ['Change payment amounts',       'config/testData.js  →  AMOUNTS section'],
                ['Change verify/reject mode',    'config/testData.js  →  PAYMENT_MODES section'],
                ['Change delivery driver/vehicle','config/testData.js  →  DELIVERY section'],
                ['Change RFC payment amounts',   'config/testData.js  →  RFC_COLLECTION section'],
                ['Change flow run order',        'tests/smokeTest.spec.js  →  move test blocks up/down'],
                ['Run all flows',                'Terminal  →  npm run smoke'],
                ['View reports',                 'Terminal  →  npm run allure:report'],
            ], ['I want to…', 'Where to Look']),
            spacer(),
        ],
    }],
});

// ── OUTPUT ─────────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buffer => {
    writeFileSync('Collection_Auto_User_Guide.docx', buffer);
    console.log('✅  Word document created: Collection_Auto_User_Guide.docx');
});
