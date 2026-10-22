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
 *   - uploadSource         → (single mode only) where the source CSV is read from:
 *                            'testdata' → the repo fixture at files.upload (default)
 *                            'system'   → an absolute path on this machine at files.systemUpload
 *                            The source is never mutated; when reading from 'system' (or when
 *                            capping / forcing a common store) the prepared copy is written to
 *                            test-data/runtime/sunpure_so_upload.csv.
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
        invoiceCount: 5, // e.g. 3 → upload only first 3 line items; null → all rows
        // Store assignment across all invoices:
        //   'YES' → force every invoice onto the single `commonStore` below (overrides the
        //           per-row stores in the fixture). Use to put all invoices on one store.
        //   'NO'  → keep each row's own store as defined in the fixture (distinct stores).
        changeStoreForAll: 'NO',
        commonStore: { name: 'Fresh and more super market', code: 'SM011583822609' },
        // 'testdata' → read files.upload (repo fixture); 'system' → read files.systemUpload (machine path).
        uploadSource: 'system',
        files: {
            upload:       'test-data/fixtures/S0_122555_sunpure.csv',
            systemUpload: 'C:/Users/User/Downloads/S0_122555_sunpure.csv',
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
