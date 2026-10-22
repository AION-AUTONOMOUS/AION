# AION AI Orchestration Foundation

Status: implementation plan on a feature branch; this document is not a deployed AI agent and does not assert that SI or an LLM is connected.

## Goal
Turn AION into a verifiable, modular AI-assisted operating system. Keep the company global, digital, online, and cloud-native. Every action must be attributable, policy-checked, testable, and auditable.

## Current verified baseline
- The repository contains a SI handover document, SI integration notes, an autonomous operations policy, and an autonomy-readiness GitHub Actions workflow.
- The readiness workflow runs contract compilation and core/coin tests and uploads a diagnostic report. It does not deploy contracts, move funds, or call SI.
- The public SI website has not provided a verified API endpoint, authentication scheme, or programmatic integration grant in the repository's documented checks.
- Railway production access and live deployment state have not been verified by this change.
- Do not claim an AI provider call, production deployment, customer, revenue, or on-chain token deployment without evidence.

## Target architecture
1. **Control plane** — a small server-side job API for submitting approved tasks and tracking status.
2. **Model/provider adapter** — provider-neutral interface (for example, `analyzeTask(input)`) with explicit configuration, timeouts, bounded retries, and disabled-by-default feature flag. Do not implement a guessed SI endpoint.
3. **Policy gate** — classify actions as read-only, reversible low-risk, or high-impact. High-impact actions require separate authorization.
4. **Tool adapters** — isolated GitHub, Railway, monitoring, payments, and blockchain adapters. Start read-only and use least-privilege service identities.
5. **Job runner** — idempotent jobs with validation, timeouts, retry limits, and a global emergency stop.
6. **Evidence ledger** — append-only records of task ID, timestamp, input hash, provider/model actually used, policy decision, tool calls, result, verification links, and rollback path. Redact secrets and personal data.
7. **Health and reporting** — scheduled health checks, failed-job alerts, daily status report, and independently readable artifacts.

## Delivery sequence
### Phase 0 — establish evidence
- Run the existing readiness workflow manually and inspect its logs and artifact.
- Verify current production health and deployment metadata with authorized Railway access.
- Inventory environment variable names only; never print values or expose credentials.
- Confirm the official AI/SI provider integration method before implementing a live adapter.

### Phase 1 — safe foundation
- Add unit tests for task validation, policy classification, idempotency, redaction, timeout, and emergency-stop behavior.
- Implement a local/mock provider adapter and deterministic test fixtures.
- Add structured audit records and a report artifact to CI.
- Keep all external write adapters disabled by default.

### Phase 2 — read-only integrations
- Add least-privilege read-only GitHub workflow and Railway health/deployment checks.
- Add payment reconciliation and blockchain explorer/RPC reads only after official credentials/configuration are supplied securely.
- Alert on stale health checks, failing workflows, and missing audit evidence.

### Phase 3 — bounded routine automation
- Allow linting, tests, reports, issue triage, and reversible feature-branch changes.
- Require review before merge/deploy unless an explicit narrowly scoped policy authorizes the exact class of change.
- Record proof of each operation and verify results independently.

### Phase 4 — controlled production actions
- Mainnet deployments, transfers, live billing, admin/permission changes, destructive operations, and legal/financial publication remain separately gated.
- Require allowlists, transaction caps, reserve thresholds, idempotency, audit evidence, rollback/recovery plans, and explicit authorization.
- Never expose wallet private keys to the model, browser, logs, or source code.

## Acceptance criteria
- Tests pass in CI with a downloadable report.
- A scheduled monitoring run produces timestamped evidence and alerts on failure.
- Each tool action has an auditable job ID, policy result, and verification result.
- Provider integration is considered live only after an authenticated test call succeeds against official provider documentation and a real result is recorded.
- Production is considered updated only after deployment metadata and a live health check confirm it.
- A task is not marked complete based only on a plan, a commit, or a successful build.

## Immediate next actions
1. Trigger and inspect the existing readiness workflow.
2. Obtain official SI API/partner instructions or select a documented AI provider with explicit authorization.
3. Verify Railway project/environment access.
4. Implement and test the mock-first control-plane module before enabling any external action.
