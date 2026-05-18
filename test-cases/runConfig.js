// Config for selective test runs.
//
// `tcRange` selects which TCs to run. Three formats supported:
//   1. Range:        'TC_LOGIN_001:TC_LOGIN_008'   → runs everything from start to end (inclusive)
//   2. Comma list:   'TC_SOU_001,TC_SOU_005,TC_DA_001'  → runs only these specific TCs
//   3. Everything:   'ALL'                          → runs the full suite
//
// The runner resolves these TC IDs to the underlying Playwright spec(s) and test
// title(s) via tcMapping.js, then runs only those tests with --grep filtering.
//
// After the run, update-results.js writes Pass/Fail/Skip ONLY for the TCs in
// this range — other TCs in the Excel are left untouched.

export const RUN_CONFIG = {
    tcRange: 'TC_LOGIN_001:TC_LOGIN_005',

    // If true, runs Playwright with --headed (visible browser).
    // If false, runs headless. Default true to match existing npm scripts.
    headed: true,

    // 'Y' to capture & upload a screenshot per test, 'N' to skip (faster runs).
    // Screenshots are taken in test.afterEach hooks across every spec file.
    captureScreenshots: 'Y',
};
