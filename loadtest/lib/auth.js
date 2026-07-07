// Login helper for CDMS preprod — mirrors the browser request exactly
// so the API treats k6 traffic the same as a real Chrome session.

import http from 'k6/http';
import { check, fail } from 'k6';
import { env, creds, geoHeaders } from '../config/env.js';

const browserHeaders = {
  'accept':           'application/json, text/plain, */*',
  'accept-language':  'en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7',
  'content-type':     'application/json',
  'origin':           env.webUrl,
  'referer':          `${env.webUrl}/`,
  'sec-ch-ua':        '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest':   'empty',
  'sec-fetch-mode':   'cors',
  'sec-fetch-site':   'same-site',
  'user-agent':       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
};

/**
 * POST /api/champ/login — returns the auth token (or fails the iteration).
 */
export function login() {
  const url = `${env.apiUrl}/api/champ/login`;
  const payload = JSON.stringify({
    username: creds.username,
    password: creds.password,
  });

  const res = http.post(url, payload, {
    headers: { ...browserHeaders, ...geoHeaders },
    tags:    { name: 'POST /api/champ/login' },  // groups metrics under one label
  });

  const ok = check(res, {
    'login status 200':  (r) => r.status === 200,
    'login has token':   (r) => !!extractToken(r),
  });

  if (!ok) {
    fail(`login failed — status ${res.status}, body: ${res.body && res.body.substring(0, 200)}`);
  }

  return extractToken(res);
}

/**
 * The CDMS API may return the token under different keys depending on the
 * version. Try the common ones; widen this list if you spot the real one.
 */
function extractToken(res) {
  try {
    const body = res.json();
    const dataToken = body.data && body.data.token;
    return (dataToken && (dataToken.access || dataToken))
        || body.token
        || body.accessToken
        || (body.data && body.data.accessToken)
        || null;
  } catch (_) {
    return null;
  }
}

/**
 * Build auth headers for subsequent calls.
 */
export function authHeaders(token, extra = {}) {
  return {
    headers: {
      ...browserHeaders,
      ...geoHeaders,
      Authorization: `Bearer ${token}`,
      ...extra,
    },
  };
}
