// Per-API load scenario: Seg-Salesman Allocation
// Run:  npm run load:segAllocation                 (uses api.defaultScenario)
//       k6 run -e SCENARIO=smoke  loadtest/scenarios/per-api/segAllocation.js
//       k6 run -e SCENARIO=load   loadtest/scenarios/per-api/segAllocation.js
//       k6 run -e SCENARIO=stress loadtest/scenarios/per-api/segAllocation.js
//       k6 run -e SCENARIO=spike  loadtest/scenarios/per-api/segAllocation.js
//       k6 run -e SCENARIO=soak   loadtest/scenarios/per-api/segAllocation.js
//
// Stages + thresholds come from loadtest/config/options.js (apis.segAllocation).
//
// Each VU logs in ONCE (module-scope `token` persists across iterations
// within the same VU), then hammers the allocation endpoint with sleep
// in between. This isolates measurement to the allocation API itself
// rather than re-paying the login cost on every iteration.

import { sleep } from 'k6';
import { login } from '../../lib/auth.js';
import { segSalesmanAllocation } from '../../lib/segAllocation.js';
import { buildOptions } from '../../config/options.js';

export const options = buildOptions('segAllocation', __ENV.SCENARIO);

let token; // VU-local — populated on first iteration of each VU

export default function () {
  if (!token) token = login();
  segSalesmanAllocation(token);
  sleep(1);
}

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export function handleSummary(data) {
  const scenario = (__ENV.SCENARIO || 'default').toLowerCase();
  return {
    [`loadtest/reports/segAllocation-${scenario}.html`]: htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
