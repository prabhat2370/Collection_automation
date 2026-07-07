// Seg-Salesman Allocation — PUT /api/v4/invoice-handover/update-v2
// Reassigns the salesman for an invoice (Segregator-only endpoint).
// Reuses browser-style headers + auth via lib/auth.js#authHeaders.

import http from 'k6/http';
import { check, fail } from 'k6';
import { env } from '../config/env.js';
import { authHeaders } from './auth.js';

// Static test data — every VU PUTs the same order_id.
// Swap to a CSV-pool reader if you later want per-VU variation.
const STATIC_PAYLOAD = {
  invoice_array: [{
    order_id: 11241633,
    invoice_no: 'SUNInv299LYF',
    new_salesman_id: 19521,
    store_id: 308423,
    new_collection_date: new Date().toISOString().slice(0, 10), // today, YYYY-MM-DD
    brand_id: 39,
    fc_id: 72,
  }],
  order_ids: [11241633],
};

export function segSalesmanAllocation(token) {
  const url = `${env.collectionApiUrl}/api/v4/invoice-handover/update-v2`;

  const res = http.put(url, JSON.stringify(STATIC_PAYLOAD), {
    ...authHeaders(token),
    tags: {
      name: 'PUT /invoice-handover/update-v2',
      api:  'segAllocation',
    },
  });

  const ok = check(res, {
    'segAllocation status 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  if (!ok) {
    fail(`segAllocation failed — status ${res.status}, body: ${res.body && res.body.substring(0, 200)}`);
  }

  return res;
}
