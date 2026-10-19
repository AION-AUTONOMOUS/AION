# AION Autonomous Operations Policy

Status: policy and readiness specification only. This document does not enable an SI provider API, move funds, or deploy a production contract.

## Intended operating model
- SI is the intended strategic decision-support layer, pending an official provider integration method.
- AION workflows execute deterministic, testable tasks and record evidence; they must not claim SI supervised an operation unless a verified SI call and audit record exist.
- Treasury monitoring and payment reconciliation may run automatically when connected to authenticated read-only provider APIs.
- Any automated outgoing transfer must use an explicitly allowlisted recipient, a per-transaction cap, a daily cap, a balance reserve, idempotency protection, and a durable audit record. The main treasury stays isolated. No unlimited spending mode.
- Smart-contract compilation, unit tests, static checks, and testnet deployments may be automated only after required secrets and treasury-address checks pass.
- Mainnet deployment must remain disabled until independent review, reproducible successful tests, explicit chain and address verification, funding review, and a separate owner approval are all recorded. Never auto-promote a testnet deployment to mainnet.
- Emergency stop must disable transaction and deployment jobs without deleting audit records.

## Current verified blockers
1. The SI provider's public website does not currently document a verified API endpoint, authentication scheme, developer portal, or programmatic integration grant. Request official documentation and test credentials from the provider.
2. The testnet workflow requires GitHub Actions secrets: `DEPLOYER_PRIVATE_KEY`, `AION_FOUNDER_TREASURY`, `AION_COMMUNITY_TREASURY`, `AION_AI_REWARDS_TREASURY`, `AION_DEVELOPMENT_TREASURY`, `AION_DIGITAL_RESERVE`, and `AION_STRATEGIC_TREASURY`. Their presence and correctness have not been verified by this change.
3. The current coin deployment script explicitly requires BNB Smart Chain testnet chain ID 97. No verified contract address or transaction hash is asserted by this policy.
4. The mainnet workflow file was not found at `.github/workflows/aion-coin-mainnet.yml`; mainnet deployment automation is not established by this check.
5. The Railway account connector returned a permission error for the available project inventory, so production configuration and live deployment status could not be inspected here.
6. Payment-provider live API/webhook credentials, settlement reconciliation, refund handling, and idempotency are not verified as production-ready.

## Acceptance gates
- SI: provider-supplied API documentation, permission, test credentials, data-handling review, server-side adapter, timeout/rate-limit/redaction tests, and staging proof.
- Finance: provider read-only connection first; reconcile test data; define approved caps and allowlists; test duplicate callbacks, refunds, failed payments, and audit trails. No transfers until separately approved and tested.
- Coin: verify all six treasury addresses and distinctness; pass compile/unit/security checks; deploy to testnet; verify the on-chain contract and transaction through an independent explorer/RPC; only then present a separately approved mainnet release plan.
- Operations: alerts, immutable logs, emergency stop, and rollback/recovery procedure tested before enabling unattended execution.

## Non-negotiable controls
- Never request or log seed phrases or private keys in chat.
- Keep credentials in GitHub/Railway secret stores; never commit credentials or expose them to browser code.
- No paid services or spend without explicit approval.
- Report only observed outcomes with links, transaction hashes, and timestamps where available.
