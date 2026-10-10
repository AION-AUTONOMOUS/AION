# AION Digital Bank — Financial Core Foundation

Status: architecture baseline only. This document does not represent a licensed bank, live custody service, or production-ready financial system.

## Product boundary
AION is building a digital financial platform from its own codebase. Regulated services (deposit-taking, payment services, custody, brokerage, securities dealing, exchange operation, issuance/distribution of regulated tokens) remain disabled until jurisdiction-specific legal review, authorization, controls, and any required licensed partners are in place.

## Core modules
1. Identity and access: account lifecycle, MFA, least-privilege roles, session revocation, audit trail.
2. Double-entry ledger: immutable journal entries, balanced postings, idempotency keys, currency/asset precision, reversals by compensating entries only.
3. Reconciliation: internal ledger vs. provider/bank/custodian statements; discrepancies enter a blocked queue and never auto-resolve silently.
4. Payment intents: internal payment state machine with deduplicated provider events, exact amount/currency/provider matching, and verified-evidence gating. The current module does not create checkout sessions or communicate with PayPal or any other payment provider.
5. Asset registry: metadata and ownership references; do not imply custody or on-chain control unless independently verified.
6. Treasury: company funds separated from customer balances in data model and access policy; no customer funds accepted before authorization.
7. Market gateway: adapter interface for price feeds and future licensed venues; read-only market data first, order placement disabled by default.
8. Digital vault: encrypted document metadata, integrity hashes, access logging, retention and deletion policy.
9. Risk and compliance: jurisdiction/product gating, sanctions/KYC hooks where legally required, transaction limits, suspicious-activity escalation, incident records.
10. Operations: health checks, backups, recovery drills, alerting, signed releases, change approvals.
11. Persistence prototype: Redis WATCH/MULTI adapter for a single journal-state key with bounded optimistic-lock retries and hash-chain validation before appending. This is a foundation for integration testing, not yet a scalable or production-approved ledger.

## Non-negotiable invariants
- No fake execution or simulated success presented as a real financial transaction.
- No balance mutation outside the ledger posting service.
- Every posted transaction has a unique idempotency key and balanced debit/credit entries.
- External payment status requires a verified server-side provider event or authenticated provider lookup.
- A verified flag is a service-layer trust boundary, not cryptographic verification by itself; only trusted webhook/API verification code may set it.
- Payment event amount, currency, provider, and event identity must match the stored intent.
- Reversals are compensating entries; posted history is not silently edited.
- All privileged actions are attributable and logged.
- Production release requires tests, independent security review, and rollback plan.
- Regulatory status and partner availability must be stated accurately.

## Build sequence
Phase 0: inspect current AION modules and deployment health; preserve existing production behavior.
Phase 1: ledger domain model, schema, invariants, idempotency, optimistic-lock persistence prototype, unit tests.
Phase 2: payment-intent state machine, followed by real provider sandbox integration and webhook signature/authenticated lookup validation.
Phase 3: identity, permissions, reconciliation and digital-vault controls.
Phase 4: read-only market data and asset catalogue; trading/custody features remain disabled.
Phase 5: threat modeling, penetration testing, disaster recovery, legal/regulatory mapping.
Phase 6: enable specific regulated services only after written authorization and operational sign-off.

## Acceptance gates
- Ledger invariant tests and Redis adapter tests pass in CI, including duplicate requests, optimistic-lock conflicts, and tampered persisted state.
- Payment-intent tests reject unverified events, amount/currency/provider mismatches, duplicate-event mutation, and illegal transitions.
- Production persistence uses a dedicated connection strategy, durable Redis configuration, backup/restore verification, monitoring, and access controls.
- Real webhook replay and invalid-signature tests pass against provider sandbox before integration is considered complete.
- Reconciliation mismatch reliably blocks settlement.
- Backup restoration is tested.
- No secrets are committed to source control.
- Security and legal sign-off recorded before enabling any regulated transaction.
