# AION GLOBAL COUNSEL — Adyen Production Payment Release Gate

Status: **BLOCKED — test-only checkout**

This checklist is a release gate, not a claim that the controls already exist. The Adyen session endpoint on this branch must remain pinned to Adyen's test host. Do not enable live processing or describe checkout as production-ready until every required item below has implementation evidence and staging test results.

## Current verified boundaries

- `server-api/adyen/create-session.js` is test-only on this branch.
- Session amounts are selected from the server-side service catalog.
- `server-api/webhook.js` currently verifies PayPal webhook signatures; it is not an Adyen webhook.
- The existing customer-revenue confirmation function only authorizes PayPal and does not provide Adyen payment confirmation.
- Confidential case-file intake returns `503 CASE_FILE_INTAKE_CLOSED`; keep it closed.

## Required implementation before live payments

- [ ] Create a dedicated Adyen notification endpoint and validate each notification's HMAC signature against the configured Adyen HMAC key using Adyen's documented canonical field order and constant-time comparison.
- [ ] Reject malformed, unsigned, invalid-signature, wrong-merchant, and unsupported notifications. Never trust the browser redirect or client-side payment result as proof of payment.
- [ ] Persist an AION order before checkout and bind the unique merchant reference to that order, server-defined service, amount, and currency. Do not create a paid order from a client-provided reference.
- [ ] For a successful payment event, verify the expected event code, success status, merchant account, reference, currency, and exact minor-unit amount against the stored pending order.
- [ ] Make event processing idempotent with a durable unique constraint/index on provider event identity and payment reference. Concurrent or repeated notifications must not create duplicate revenue entries or deliveries.
- [ ] Change order state and revenue ledger atomically where the storage layer supports transactions; otherwise implement a recoverable idempotent state machine and reconciliation job.
- [ ] Keep receipts and delivery disabled until the server has persisted a verified successful payment. Failed, refused, cancelled, expired, pending, and mismatched payments must not be marked paid.
- [ ] Do not log API keys, HMAC keys, full payment payloads, shopper data, or case-file content. Return generic errors to clients.
- [ ] Add automated tests for valid/invalid HMAC, wrong merchant/reference/amount/currency, unsuccessful authorisation, duplicate/replayed events, concurrent duplicates, storage failure, and delivery-before-payment attempts.
- [ ] Run full CI and end-to-end tests against Adyen's test environment, including success, refusal, cancellation, and notification retries; capture evidence for order state, ledger, receipt, and delivery.
- [ ] Review refund, cancellation, dispute, privacy, retention, tax, and customer-facing disclosures before any live launch.
- [ ] Obtain explicit release approval after independent review. Only then create a separate minimal live-payment change; do not add a live switch to the test-only endpoint.

## Required confidential-file gate (separate release)

Case-file intake must remain closed until identity and per-case authorization, private encrypted object storage, malware scanning/quarantine, tenant isolation, audit trail, retention/deletion, safe logging, rate limits, and negative staging tests are implemented and independently reviewed. Do not upload confidential case materials while the endpoint reports blocked.

## Release rule

A green build or a successful session-creation response does not prove that a payment settled. Revenue is recognized only after a verified provider notification is matched to a durable AION order and the ledger is updated idempotently. No claim of production payment readiness is permitted before the evidence above exists.
