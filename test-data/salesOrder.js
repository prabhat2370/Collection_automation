/**
 * Brand-level SO upload configurations.
 *
 * Each entry drives one parameterised test in tests/soUpload.spec.js:
 *   - fc / brand           → option text rendered in the Ant Design dropdown
 *   - fcSearch / brandSearch → search keys typed into the dropdown
 *   - fcId / brandId       → DB ids (used by retailer-master / verification helpers)
 *   - mode                 → 'multi' (3 files: SO Report + Invoice Report + Sales Register)
 *                            'single' (1 file: combined CSV)
 *   - files                → keyed by upload kind: { soReport, invoiceReport, salesRegister } for
 *                            multi, or { upload } for single
 *   - invoiceCount         → (single mode only) positive integer to upload only the first N line
 *                            items; null/omitted uploads every row in the file.
 */
export const SALES_ORDER_BRANDS = {
    britannia: {
        fc: 'BTML: BTM',
        fcSearch: 'BTML',
        fcId: 2,
        brand: 'BRIT: Britannia',
        brandSearch: 'BRIT',
        brandId: 4,
        mode: 'multi',
        files: {
            soReport:      'test-data/fixtures/m1 6.csv',
            invoiceReport: 'test-data/fixtures/h1 6.csv',
            salesRegister: 'test-data/fixtures/sr 10.csv',
        },
    },
    sunpure: {
        fc: 'BGRD: Begur Road',
        fcSearch: 'BGRD',
        fcId: 72,
        brand: 'SNPR: Sunpure',
        brandSearch: 'SNPR',
        brandId: 39,
        mode: 'single',
        invoiceCount: 1, // e.g. 3 → upload only first 3 line items; null → all rows
        files: {
            upload: 'test-data/fixtures/S0_122555_sunpure.csv',
        },
    },
};

/**
 * Which brand(s) tests/soUpload.spec.js runs.
 *   - 'all'        → every brand in SALES_ORDER_BRANDS
 *   - 'britannia'  → only CMBT Britannia
 *   - 'sunpure'    → only BGRD Sunpure
 *   - array form   → e.g. ['britannia', 'sunpure'] to pick a subset
 */
export const ACTIVE_SO_BRAND = 'sunpure';

// Smoke test spreads this into a flat FILE_PATHS object — keep the Britannia files reachable.
export const SALES_ORDER_FILES = SALES_ORDER_BRANDS.britannia.files;
