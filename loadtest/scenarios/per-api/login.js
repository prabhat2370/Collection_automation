// Per-API load scenario: Champ Login
// Run:  npm run load:login                          (uses api.defaultScenario)
//       k6 run -e SCENARIO=smoke  loadtest/scenarios/per-api/login.js
//       k6 run -e SCENARIO=load   loadtest/scenarios/per-api/login.js
//       k6 run -e SCENARIO=stress loadtest/scenarios/per-api/login.js
//       k6 run -e SCENARIO=spike  loadtest/scenarios/per-api/login.js
//       k6 run -e SCENARIO=soak   loadtest/scenarios/per-api/login.js
//
// Stages + thresholds come from loadtest/config/options.js (apis.login).
//
// Each VU performs a full login on every iteration with a short think-time
// pause in between — this matches the real-world login burst where users
// authenticate once per session rather than holding a token.

import { sleep } from 'k6';
import { login } from '../../lib/auth.js';
import { buildOptions } from '../../config/options.js';

export const options = buildOptions('login', __ENV.SCENARIO);

export default function () {
  login();                              // runs its own checks + fail-on-error
  sleep(Math.random() * 2 + 1);         // 1–3s think time
}

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export function handleSummary(data) {
  const scenario = (__ENV.SCENARIO || 'default').toLowerCase();
  return {
    [`loadtest/reports/login-${scenario}.html`]: htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
