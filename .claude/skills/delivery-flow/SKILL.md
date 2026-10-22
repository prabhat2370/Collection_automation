---
name: delivery-flow
description: Use when asked to run the SO Upload → Delivery Allocation → Return to FC → Seg/Cash Verification chain (delivery-verification path) in this Playwright collection suite — e.g. "run the so->cashV flow", "run login->so->dA->rfc->segV/cashV", "run the delivery verification flow/chain/pipeline".
---

# Delivery Flow

## Overview

Runs the delivery-verification leg of the Collection E2E chain end to end:
**SO Upload → Delivery Allocation → Return to FC → Seg Verification → Cash Verification**.
Each step is an existing npm script backed by a Playwright spec in `web/tests/`; every
spec logs in on its own (`loginAs` with the role it needs), so no separate login step
is required.

## Steps

Run from the repo root, in this exact order. Each command must finish with
`X passed` before moving to the next — do not start the next step while the
previous one is still running or after it failed.

1. `npm run so` — SO Upload (`web/tests/soUpload.spec.js`)
2. `npm run dA` — Delivery Allocation (`web/tests/deliveryAllocation.spec.js`)
3. `npm run rfc` — Return to FC (`web/tests/returnToFC.spec.js`)
4. **Verification-type check** (see below) before continuing
5. `npm run segV` — Seg Verification (`web/tests/segVerification.spec.js`)
6. `npm run cashV` — Cash Verification (`web/tests/cashVerification.spec.js`)

## Verification-type check (step 4)

Seg/Cash Verification branch on `test-data/seg.js` → `SEG.verificationType`
(`'D'` = Delivery Verification, `'S'` = Salesman Verification). This flow is the
**Delivery** leg, so it expects `'D'`.

Read `test-data/seg.js` before running `segV`/`cashV`. If `verificationType` is not
`'D'`, stop and ask the user whether to proceed anyway or switch it — do not edit
the file automatically.

## Failure handling

Stop at the first failing step. Do not run later steps against a state a failed
step never reached. Report:
- which step failed
- the last ~40-60 lines of its Playwright output (enough to show the failing
  assertion/step, not the full log)

## Reporting

After the chain (or after stopping on failure), give a short summary: one line per
step run, pass/fail, and rough duration. This mirrors what each spec already prints
(e.g. SO Upload logs the invoice numbers it picked up — worth surfacing since later
steps depend on them).

## Notes

- `npm run login` is a standalone smoke test for the login page and is NOT part of
  this chain — every spec below already logs in with the role it needs
  (`obc` for so/dA/rfc, `seg` for segV, `cash` for cashV).
- This is the `'D'` counterpart to the later `collection → SegV/CashV('S')` leg of
  the full suite — don't confuse the two when checking `verificationType`.
