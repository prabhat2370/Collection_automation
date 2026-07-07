// Shared K6 options: thresholds (pass/fail SLOs) and reusable stage profiles.
//
// This file is the single source of truth for load-test shapes. Each API
// declares its own stage profiles for the five standard scenarios
// (smoke, load, stress, spike, soak) plus its own SLO thresholds.
//
// In a scenario file:
//   import { buildOptions } from '../../config/options.js';
//   export const options = buildOptions('segAllocation', __ENV.SCENARIO || 'smoke');
//
// Override the scenario at the CLI:
//   k6 run -e SCENARIO=stress loadtest/scenarios/per-api/segAllocation.js

// ---------------------------------------------------------------------------
// Generic (fallback) stage profiles — kept for backward compatibility with
// older scenarios (scenarios/load.js) that import `stages` directly.
// ---------------------------------------------------------------------------
export const stages = {
  smoke:  [{ duration: '30s', target: 1 }],
  load: [
        { duration: '1m', target: 100 },   // ramp
        { duration: '3m', target: 100 },   // hold
        { duration: '1m', target: 0 },     // ramp down
      ],
  stress: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  spike: [
    { duration: '10s', target: 200 },
    { duration: '1m',  target: 200 },
    { duration: '10s', target: 0 },
  ],
  soak: [
    { duration: '2m', target: 30 },
    { duration: '1h', target: 30 },
    { duration: '2m', target: 0 },
  ],
};

export const defaultThresholds = {
  http_req_failed:   ['rate<0.01'],
  http_req_duration: ['p(95)<800', 'p(99)<1500'],
  checks:            ['rate>0.99'],
};

// ---------------------------------------------------------------------------
// Per-API configuration
// ---------------------------------------------------------------------------
// Each API gets:
//   • defaultScenario — which scenario runs when SCENARIO env var is not set
//   • slo             — error-rate + p95/p99 latency budget (drives thresholds)
//   • scenarios       — stage profiles tuned for THIS API's traffic shape
//
// Latency budgets reflect the nature of the endpoint:
//   • login            — fast, hot path, must stay snappy (p95 < 800ms)
//   • segAllocation    — write-heavy PUT, larger budget (p95 < 2s)
//
// Scenario shapes:
//   • smoke   — 1 VU, ~30s. CI gate. Wiring sanity check.
//   • load    — steady, expected production volume. Hold for several minutes.
//   • stress  — ramp past expected load to find the breaking point.
//   • spike   — instantaneous burst (e.g. morning login rush).
//   • soak    — long-duration hold to surface leaks / pool exhaustion.
// ---------------------------------------------------------------------------
export const apis = {
  // ---------------------------- LOGIN ---------------------------------------
  login: {
    defaultScenario: 'smoke',
    slo: { errorRate: 0.01, p95: 800, p99: 1500 },
    scenarios: {
      smoke:  [{ duration: '30s', target: 1 }],
      load: [
        { duration: '1m', target: 2000 },   // ramp
        // { duration: '3m', target: 100 },   // hold
        // { duration: '1m', target: 0 },     // ramp down
      ],
      stress: [
        { duration: '1m', target: 200 },
        { duration: '2m', target: 500 },
        { duration: '2m', target: 1000 },
        { duration: '1m', target: 0 },
      ],
      spike: [
        { duration: '10s', target: 1000 }, // morning login flood
        { duration: '1m',  target: 1000 },
        { duration: '10s', target: 0 },
      ],
      soak: [
        { duration: '2m', target: 50 },
        { duration: '1h', target: 50 },
        { duration: '2m', target: 0 },
      ],
    },
  },

  // -------------------------- CHATBOT --------------------------------------
  // POST /webhook — Meta/Gupshup WhatsApp passthrough (Format A).
  //
  // ── Product data (confirmed) ─────────────────────────────────────────────
  //   Peak concurrent users : worst case 46,000
  //   Response SLO          : p95 ≤ 5 s  ("3–5 seconds acceptable")
  //   Error rate            : TBD — update when product answers Q4
  //   Campaign spike        : TBD — update spike profile when product answers Q5
  //
  // ── Scale ─────────────────────────────────────────────────────────────────
  //   1 VU = 1 REAL concurrent user.  target:N below = N real users.
  //   Test range: 1,000 → 46,000 real users.
  //   Breaking point = the step where p95 > 5,000 ms OR error rate > 1%
  //
  //   ⚠ INFRA NOTE: 46,000 VUs cannot run on a single 16 GB laptop
  //   (realistic ceiling ≈ 10k–40k VUs, depends on script weight). To reach
  //   46k reliably you need distributed k6 (k6-operator on k8s, or several
  //   load-generator VMs). The numbers below are the TRUE user counts.
  // ─────────────────────────────────────────────────────────────────────────
  chatbot: {
    defaultScenario: 'smoke',
    slo: { errorRate: 0.01, p95: 5000, p99: 8000 },
    scenarios: {

      // Smoke — wiring check, 1 VU
      smoke: [{ duration: '30s', target: 1 }],

      // Load — sustained baseline: 1,000 real concurrent users
      load: [
        { duration: '1m', target: 3000 }, // ramp
        // { duration: '5m', target: 1000 }, // hold
        // { duration: '2m', target: 0    }, // ramp down
      ],

      // Stress / Breakpoint — 1,000 → 46,000 real concurrent users in 6 steps
      //
      //  Scale : 1 VU = 1 REAL concurrent user.
      //  Ramp  : 1 min per step (users "arrive" over 1 min).
      //  Hold  : grows from 1 min → 10 min so you can clearly see stable vs degraded.
      //
      //  Step │  VUs   │ Real users │ Hold   │ Total time
      //  ─────┼────────┼────────────┼────────┼───────────
      //   1   │  1,000 │  1,000     │  1 m   │ 0:00 – 2:00
      //   2   │  5,000 │  5,000     │  2 m   │ 2:00 – 5:00
      //   3   │ 10,000 │ 10,000     │  3 m   │ 5:00 – 9:00
      //   4   │ 20,000 │ 20,000     │  3 m   │ 9:00 –13:00
      //   5   │ 30,000 │ 30,000     │  5 m   │13:00 –19:00
      //   6   │ 46,000 │ 46,000     │ 10 m   │19:00 –30:00
      //
      //  Total run ≈ 31 minutes.  Needs distributed k6 above ~10k–40k VUs.
      stress: [
        { duration: '1m',  target: 1000  }, // ramp  → 1k users
        // { duration: '1m',  target: 1000  }, // hold 1 m — is baseline stable?
        { duration: '1m',  target: 5000  }, // ramp  → 5k
        { duration: '2m',  target: 5000  }, // hold 2 m
        { duration: '1m',  target: 10000 }, // ramp  → 10k
        { duration: '3m',  target: 10000 }, // hold 3 m
        { duration: '1m',  target: 20000 }, // ramp  → 20k — watch for latency creep
        { duration: '3m',  target: 20000 }, // hold 3 m
        { duration: '1m',  target: 30000 }, // ramp  → 30k
        { duration: '5m',  target: 30000 }, // hold 5 m
        { duration: '1m',  target: 46000 }, // ramp  → 46k (worst-case ceiling)
        { duration: '10m', target: 46000 }, // hold 10 m — if system still alive
        { duration: '1m',  target: 0     }, // ramp down — watch for recovery
      ],

      // Spike — instant burst to see how the system reacts to sudden floods
      spike: [
        { duration: '1m',  target: 1000  }, // warm up at baseline
        { duration: '10s', target: 20000 }, // instant burst → 20k users
        { duration: '3m',  target: 20000 }, // hold — does it recover?
        { duration: '10s', target: 46000 }, // slam to max (46k)
        { duration: '3m',  target: 46000 }, // hold
        { duration: '10s', target: 0     }, // drop — watch recovery
      ],

      // Soak — long hold at baseline to surface leaks / pool exhaustion
      soak: [
        { duration: '2m', target: 1000 },
        { duration: '1h', target: 1000 },
        { duration: '2m', target: 0    },
      ],
    },
  },

  // ------------------------ SEG ALLOCATION ----------------------------------
  // PUT /api/v4/invoice-handover/update-v2 — Segregator reassigns salesman.
  segAllocation: {
    defaultScenario: 'smoke',
    slo: { errorRate: 0.01, p95: 2000, p99: 4000 },
    scenarios: {
      smoke: [{ duration: '30s', target: 1 }],
      load: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      stress: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
      ],
      spike: [
        { duration: '10s', target: 300 },
        { duration: '1m',  target: 300 },
        { duration: '10s', target: 0 },
      ],
      soak: [
        { duration: '2m', target: 25 },
        { duration: '1h', target: 25 },
        { duration: '2m', target: 0 },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

// Build a tagged threshold set for an API. Uses the API's SLO budget and
// scopes p95/p99 to the `{api:<name>}` tag so cross-API noise doesn't
// dirty the threshold.
export function buildThresholds(api) {
  const cfg = apis[api];
  if (!cfg) throw new Error(`buildThresholds: unknown api "${api}"`);
  const { errorRate, p95, p99 } = cfg.slo;
  return {
    'http_req_failed':                       [`rate<${errorRate}`],
    'checks':                                ['rate>0.99'],
    [`http_req_duration{api:${api}}`]:       [`p(95)<${p95}`, `p(99)<${p99}`],
  };
}

// One-call builder for a scenario file's `export const options = …`.
//   buildOptions('segAllocation', 'spike')   →  { stages, thresholds, tags }
//   buildOptions('segAllocation')            →  uses api.defaultScenario
//   buildOptions('segAllocation', undefined) →  same — defaults applied
export function buildOptions(api, scenario) {
  const cfg = apis[api];
  if (!cfg) throw new Error(`buildOptions: unknown api "${api}"`);

  const chosen = scenario || cfg.defaultScenario || 'smoke';
  const stageProfile = cfg.scenarios[chosen];
  if (!stageProfile) {
    throw new Error(
      `buildOptions: unknown scenario "${chosen}" for api "${api}". ` +
      `Valid: ${Object.keys(cfg.scenarios).join(', ')}`,
    );
  }
  return {
    stages:     stageProfile,
    thresholds: buildThresholds(api),
    tags:       { api, scenario: chosen },
  };
}
