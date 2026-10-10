# AION Digital Financial Platform — Security Hardening Plan

Status: engineering control plan; **not** a security certification, penetration-test report, banking license, or production approval.

## Scope and safe operating mode

The current financial-core branch is a non-production foundation. Keep market endpoints read-only, order routing disabled, custody/deposit-taking disabled, and regulated financial offers unavailable until their specific approvals are documented. Never use real customer funds during engineering tests.

## Threat model

| Threat | Required control | Verification evidence |
|---|---|---|
| Forged browser payment-success claims | Server-side provider lookup/signature verification; never trust client status | Negative API tests and provider sandbox capture |
| Duplicate/replayed payment events | Provider event/capture IDs, idempotency, durable journal invariants | Concurrent duplicate-event and replay tests |
| Amount/currency/order substitution | Exact match across stored order and provider capture | Mismatch tests for amount, currency, order and capture ID |
| Unauthorized privileged actions | Dedicated server-side admin secret, least privilege, secret rotation, no browser exposure | Missing/invalid-token tests and access review |
| Ledger tampering or imbalance | Balanced entries, immutable posted history, hash-chain validation, compensating entries only | Tamper, imbalance, and recovery tests |
| Redis loss, eviction, OOM or failover | Explicit persistence policy, capacity limits, backups, restore drills, alerts; fail closed | Documented restore and failover exercises |
| Market-data spoofing or stale data | Approved provider adapter, licensed provenance, timestamps, schema validation, stale/future rejection | Provider contract tests and stale-data tests |
| Injection and unsafe output | Validate all inputs, avoid dynamic HTML, parameterize storage operations, sanitize logs | Static review and injection tests |
| Abuse, brute force, denial of service | Rate limits, request/body limits, timeouts, bounded retries, alerting | Load/abuse tests with thresholds recorded |
| Secrets or customer data leakage | Secret manager/environment config, redacted logs, data minimization, retention controls | Secret scanning and log review |
| Supply-chain compromise | Lockfile review, dependency scanning, pinned CI actions where practical, provenance | CI dependency/security reports |
| Unauthorized release | Protected branch, reviewed PR, signed release, rollback procedure | Release approval record and rollback drill |

## Mandatory pre-production gates

1. All required CI checks pass on the exact release commit; no ignored or unexplained failures.
2. Independent security review and scoped penetration test complete; findings triaged and critical/high findings closed or formally blocked from launch.
3. PayPal Sandbox flow succeeds end-to-end with provider-issued evidence, including duplicate webhook replay and mismatched amount/currency cases. No live payment test is needed to prove this gate.
4. Redis persistence, backup restore, failover, eviction policy, connection saturation, and recovery are tested against production-like configuration.
5. Authentication, MFA where appropriate, role separation, privileged action audit, rate limiting, monitoring, incident response, and key rotation are verified.
6. Market provider and data redistribution license are approved; freshness and outage behavior are demonstrated.
7. UK-specific counsel/compliance review determines which activities require authorization or a regulated partner. Obtain written evidence before offering the relevant service.
8. Customer terms, privacy notice, complaints, refunds, chargebacks, safeguarding (if applicable), tax/accounting and data retention are reviewed for the actual product scope.
9. Release owner records go/no-go, rollback commit, on-call contact, backup snapshot, and monitoring thresholds.

## Five-day engineering plan (not a promise of launch)

- Day 1: fix failing tests, map endpoints/secrets/permissions, establish baseline CI.
- Day 2: add negative security tests for auth, input validation, replay, and market-data boundaries.
- Day 3: exercise Redis failure/recovery and provider Sandbox integration; document gaps.
- Day 4: independent review, dependency/secret scan, load and abuse tests, remediate findings.
- Day 5: evidence review and go/no-go decision. If any gate is incomplete, remain in sandbox/non-production mode.

Calendar time alone does not confer legal permission or establish security. This plan intentionally does not auto-enable live mode or trading.
