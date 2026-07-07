// Per-API load scenario: Chatbot Webhook (Meta/Gupshup Format A)
//
// Run:  npm run chatbot:smoke
//       k6 run -e SCENARIO=smoke  loadtest/scenarios/per-api/chatbot.js
//       k6 run -e SCENARIO=load   loadtest/scenarios/per-api/chatbot.js
//       k6 run -e SCENARIO=stress loadtest/scenarios/per-api/chatbot.js
//       k6 run -e SCENARIO=spike  loadtest/scenarios/per-api/chatbot.js
//       k6 run -e SCENARIO=soak   loadtest/scenarios/per-api/chatbot.js
//
// Stages + thresholds come from loadtest/config/options.js (apis.chatbot).
//
// No login required — /webhook is unauthenticated (Meta passthrough).
// Each VU uses a distinct `from` phone number; each iteration uses a unique
// wamid so the chatbot cannot deduplicate messages and hide real processing.

import { sleep } from 'k6';
import { sendChatbotMessage } from '../../lib/chatbot.js';
import { buildOptions } from '../../config/options.js';

export const options = buildOptions('chatbot', __ENV.SCENARIO);

export default function () {
  sendChatbotMessage(__VU, __ITER);
  sleep(Math.random() * 2 + 1); // 1–3s think time — realistic WhatsApp cadence
}

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export function handleSummary(data) {
  const scenario = (__ENV.SCENARIO || 'default').toLowerCase();
  return {
    [`loadtest/reports/chatbot-${scenario}.html`]: htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
