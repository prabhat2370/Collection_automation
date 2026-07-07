// Chatbot Webhook — POST /webhook
// Simulates Meta/Gupshup WhatsApp passthrough (Format A) hitting the chatbot.
//
// `from` varies by VU so each virtual user looks like a distinct WhatsApp
// sender — prevents the server from deduplicating identical `from` numbers
// and masking actual load on session/state management.
//
// `id` (wamid) varies by VU + iteration — prevents message-level dedup.
// `timestamp` is evaluated per-call so each request carries the real wall time.

import http from 'k6/http';
import { check, fail } from 'k6';
import { env } from '../config/env.js';

const HEADERS = { headers: { 'Content-Type': 'application/json' } };

// Base phone: 91 (India) + 10-digit number.  VU offset keeps them unique.
const BASE_PHONE = 919876500000;

export function sendChatbotMessage(vuId, iterId) {
  const from  = String(BASE_PHONE + (vuId % 90000));          // 919876500000–919876589999
  const msgId = `wamid.load-vu${vuId}-iter${iterId}`;
  const ts    = String(Math.floor(Date.now() / 1000));        // current unix time

  const payload = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          messages: [{
            id:        msgId,
            from:      from,
            type:      'text',
            timestamp: ts,
            text: { body: 'Hello, what products do you have?' },
          }],
        },
      }],
    }],
  });

  const res = http.post(`${env.chatbotUrl}/webhook`, payload, {
    ...HEADERS,
    tags: { name: 'POST /webhook', api: 'chatbot', vu: String(vuId) },
  });

  const ok = check(res, {
    'chatbot webhook status 2xx': (r) => r.status >= 200 && r.status < 300,
    'chatbot response < 5s':      (r) => r.timings.duration < 5000, // product SLO: 3–5 s acceptable
  });

  if (!ok) {
    fail(
      `chatbot webhook failed — status ${res.status}, ` +
      `body: ${res.body && res.body.substring(0, 200)}`,
    );
  }

  return res;
}
