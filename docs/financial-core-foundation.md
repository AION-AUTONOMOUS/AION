# AION Digital Bank — Financial Core Foundation

Status: non-production foundation with a limited customer-payment route integration. This document does not represent a licensed bank, live custody service, or production-ready financial system.

## Product boundary
AION is building a digital financial platform from its own codebase. Regulated services (deposit-taking, payment services, custody, brokerage, securities dealing, exchange operation, issuance/distribution of regulated tokens) remain disabled until jurisdiction-specific legal review, authorization, controls, and any required licensed partners are in place.

## Core modules
1. Identity and access: account lifecycle, MFA, least-privilege roles, session revocation, audit trail.
2. Double-entry ledger: immutable journal entries, balanced postings, idempotency keys, currency/asset precision, reversals by compensating entries only.
3. Reconciliation: `financial-core/reconciliation.js` compares internal posted records with provider statements by unique reference, amount in minor units, and currency. Any missing, unexpected, duplicate, or mismatched record blocks settlement. It does not move money.
4. Payment intents: internal payment state machine with deduplicated provider events, exact amount/currency/provider matching, and verified-evidence gating. The current module does not create checkout sessions or communicate with PayPal or any other payment provider.
5. PayPal webhook verification boundary: `financial-core/paypal-webhook-verifier.js` requires PayPal transmission headers and the configured webhook ID, then delegates authenticity verification to a trusted server-side callback. The app route in `server-api/webhook.js` separately obtains a server-side OAuth token and asks PayPal to verify the signed event before processing it.
6. PayPal route integration: `server-api/webhook.js` handles `PAYMENT.CAPTURE.COMPLETED` by resolving `resource.supplementary_data.related_ids.order_id`, fetching PayPal's server-side checkout order, matching the completed capture ID plus amount/currency, and resolving the AION order through `custom_id`/`invoice_id`. `server-api/customer-revenue.js` also obtains capture details server-side and rejects client-supplied payment-success claims. These paths have mocked integration tests; real PayPal credentials and real sandbox payment flows remain untested.
7. Asset registry: metadata and ownership references; do not imply custody or on-chain control unless independently verified.
8. Treasury: company funds separated from customer balances in data model and access policy; no customer funds accepted before authorization.
9. Market gateway: adapter interface for price feeds and future licensed venues; read-only market data first, order placement disabled by default.
10. Digital vault: encrypted document metadata, integrity hashes, access logging, retention and deletion policy.
11. Risk and compliance: jurisdiction/product gating, sanctions/KYC hooks where legally required, transaction limits, suspicious-activity escalation, incident records.
12. Operations: health checks, backups, recovery drills, alerting, signed releases, change approvals.
13. Persistence: the journal prototype uses Redis WATCH/MULTI for a single journal-state key with bounded optimistic-lock retries and hash-chain validation. For customer orders/payments/receipts/revenue, `config/aion-stack-store.js` fails closed when durable Redis is absent or errors and uses Redis Lua scripts to create orders, commit payment receipts, save delivery evidence in a pending-recognition state, and finalize recognized revenue only after the matching journal posting succeeds. Scripts preflight key types before mutation. Redis Lua execution is isolated from interleaving, but it does not generally roll back writes already performed if an unexpected runtime/resource error occurs mid-script; therefore these scripts are not a substitute for capacity controls, `noeviction` policy, monitoring, backups and recovery drills. CI exercises these scripts against a real Redis service, including wrong-type preflight failure, duplicate capture delivery, recovery from an unreadable journal, deferred income recognition, and rejection of a different capture. It has not tested live-provider credentials, OOM/failover, or production disaster recovery. This is not a production-approved ledger.

## Customer payment accounting lifecycle

- A provider-verified PayPal capture creates one durable receipt. The first journal entry debits `assets:paypal-clearing` and credits `liabilities:customer-prepayments`; this tracks money received without treating an undelivered service as earned income.
- Revenue is recognized only after `recordDelivery` receives non-empty delivery evidence and commits the order plus the recognized-revenue record. The second idempotent journal entry debits `liabilities:customer-prepayments` and credits `revenue:services`.
- The `/receipts` API and `capturedPayments` metric report confirmed payment receipts. The `/revenue` API and `recognizedRevenue` metric only report delivered services with a matching confirmed payment reference.
- Both PayPal webhook and synchronous capture paths must durably post the receipt journal before acknowledging success. If journal posting fails, the route returns an error so a retry can complete the idempotent posting.
- The journal uses a dedicated Redis connection, and operations sharing that connection are serialized around WATCH/MULTI to protect connection-scoped WATCH state.
- These entries are a foundation for accounting operations, not a complete general ledger: PayPal fees, refunds, chargebacks, settlement to a bank account, tax, foreign-exchange gains/losses, and formal accounting-policy approval remain unimplemented.

## Checkout eligibility for finance-adjacent offers

The public catalogue currently marks `investment-report`, `portfolio-analysis`, and `investment-consulting` as `pending-regulatory-review` with `checkoutEnabled: false`. These items remain discoverable for internal planning, but `getOffer` rejects them, so checkout/order creation cannot sell them. The guard has no environment-variable bypass. Re-enablement requires explicit product-scope and jurisdiction-specific legal/compliance review followed by a reviewed code change. This control is not a determination of legal status, and it does not authorize any regulated service.

## API authorization boundary

- Public endpoints may list offers and initialize customer checkout; they cannot set a payment-confirmed flag or assert successful delivery.
- The administrative `dashboard`, `orders`, `receipts`, and `revenue` endpoints, plus `delivery` and `outcome` mutation routes, require the dedicated server-side bearer token `AION_REVENUE_ADMIN_TOKEN`. No other subsystem token is accepted. If the dedicated token is not configured, these routes fail closed. Do not expose the token to browser code.
- A capture is acknowledged only after both the provider evidence and the durable receipt journal are stored. A delivery is reported as recognized revenue only after delivery evidence and its idempotent journal entry are durable; retries complete pending work without double-posting.

## Non-negotiable invariants
- No fake execution or simulated success presented as a real financial transaction.
- No balance mutation outside the ledger posting service.
- Every posted transaction has a unique idempotency key and balanced debit/credit entries.
- External payment status requires a verified server-side provider event or authenticated provider lookup.
- A verified flag is a service-layer trust boundary, not cryptographic verification by itself; only trusted webhook/API verification code may set it.
- Payment event amount, currency, provider, and event identity must match the stored intent.
- Reversals are compensating entries; posted history is not silently edited.
- Any reconciliation discrepancy blocks settlement until reviewed.
- All privileged actions are attributable and logged.
- Production release requires tests, independent security review, and rollback plan.
- Regulatory status and partner availability must be stated accurately.

## Build sequence
Phase 0: inspect current AION modules and deployment health; preserve existing production behavior.
Phase 1: ledger domain model, schema, invariants, idempotency, optimistic-lock persistence prototype, unit tests.
Phase 2: payment-intent state machine and first customer-payment route integration with server-side PayPal OAuth/webhook verification; real sandbox checkout and Redis-backed integration testing remain gates.
Phase 3: reconciliation, identity, permissions, and digital-vault controls.
Phase 4: read-only market data and asset catalogue; trading/custody features remain disabled.
Phase 5: threat modeling, penetration testing, disaster recovery, legal/regulatory mapping.
Phase 6: enable specific regulated services only after written authorization and operational sign-off.

## Acceptance gates
- Ledger invariant tests and Redis adapter tests pass in CI, including duplicate requests, optimistic-lock conflicts, and tampered persisted state.
- Payment-intent tests reject unverified events, amount/currency/provider mismatches, duplicate-event mutation, and illegal transitions.
- Confirmed payment receipts are journaled to clearing/prepayment accounts exactly once; service revenue is posted only after delivery evidence and remains idempotent on retry.
- Finance-adjacent offers marked pending review remain visible but are rejected by `getOffer`, preventing order creation and checkout until a reviewed code change.
- PayPal webhook verifier tests reject missing transmission headers, absent webhook ID, failed/unknown verification results, and provider verification errors.
- PayPal sandbox-client tests prove the fixed sandbox endpoint, OAuth-before-verification sequence, correct event payload, and fail-closed handling.
- Reconciliation tests prove mismatches block settlement, including missing/extra records and amount/currency discrepancies.
- Production persistence uses a dedicated connection strategy, durable Redis configuration, backup/restore verification, monitoring, and access controls.
- Mocked route tests cover OAuth, signature-verification results, PayPal capture/order matching, duplicate handling, and fail-closed storage outages.
- Real webhook replay, invalid-signature tests, and a completed sandbox checkout pass against the provider before integration is considered complete.
- Backup restoration is tested.
- No secrets are committed to source control.
- Security and legal sign-off recorded before enabling any regulated transaction.
