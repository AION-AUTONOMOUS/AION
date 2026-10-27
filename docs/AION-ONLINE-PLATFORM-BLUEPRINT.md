# AION Online Platform Blueprint

Status: architecture and readiness plan. This document does not assert that every component is deployed or operational.

## Goal

Operate AION as a globally accessible digital organization. Keep the public website, SI Exchange, API services, digital asset contracts, treasury records, and any future EVM networks separately deployable, observable, and secured. Prefer free tiers and existing infrastructure; do not create paid resources or incur usage charges without explicit budget approval.

## Service inventory and truth labels

| Component | Current evidence / intended role | Public-launch gate |
|---|---|---|
| AION main repository | https://github.com/AION-AUTONOMOUS/AION — source, workflows, documentation | CI green; protected deployment path |
| SI Exchange demo | https://si-exchange-1vq1.vercel.app — simulated exchange only | Keep demo balances and prices clearly labelled; no real deposits or withdrawals |
| AION Coin on BSC testnet | Test workflow exists; prior run failed because DEPLOYER_PRIVATE_KEY was malformed | Correct secret privately; rerun; verify contract address and transaction on explorer |
| AION Nova | Proposed EVM network; proposed chain ID 71101 | Chain ID uniqueness check, client/consensus choice, genesis, multiple independent validators, public RPC, monitoring, explorer, security review |
| AION Orbit | Proposed EVM network; proposed chain ID 71102 | Same gates as Nova; independent genesis and infrastructure |
| Digital vault / treasury | Design and records must be separated from key custody | Threat model, least privilege, backups, recovery drills; never store seed phrases in repo or chat |
| Website / API / domains | Use existing hosted deployments where verified | HTTPS, health checks, privacy policy, error monitoring, tested DNS and rollback |
| SI integration | No verified public SI API documented in current evidence | Integrate only through official, documented API and scoped credentials |

Chain IDs above are proposals, not proof that networks exist. Check for collisions before publishing network configuration.

## Delivery sequence

### Phase 1 — Make the existing online surface accurate
1. Inventory every repository, deployment, domain, environment variable, scheduled workflow, and payment endpoint.
2. Mark each item as VERIFIED LIVE, DEMO, BLOCKED, or PLANNED, with timestamp and evidence URL.
3. Keep simulated exchange trading isolated from any real-money system.
4. Add health checks and smoke tests for the website/API; document rollback instructions.

### Phase 2 — Repair and verify AION Coin testnet
1. In GitHub repository Settings → Secrets and variables → Actions, replace `DEPLOYER_PRIVATE_KEY` privately with the deployer's 32-byte hex private key (64 hex characters, optionally prefixed by `0x`). Do not use a wallet address, quotes, or whitespace.
2. Never paste private keys, seed phrases, or recovery codes into issues, commits, logs, or chat.
3. Run the testnet workflow and inspect the complete job logs.
4. Record the chain ID, contract address, transaction hash, verified source, and explorer links only after independently confirming them on BSC testnet.
5. Keep mainnet deployment blocked until separate explicit approval, independent review, and all deployment safeguards pass.

### Phase 3 — Build reproducible local test networks first
1. Select and pin a maintained EVM client and consensus implementation.
2. Add versioned genesis/config files for Nova and Orbit, with separate chain IDs and separate validator keys.
3. Add automated tests for chain ID, genesis hash, block production, JSON-RPC, transaction submission, restart persistence, and network isolation.
4. Run reproducible local or CI devnets first. A local devnet is not a public network.
5. Publish testnet RPC endpoints only after a stable multi-node deployment and abuse protections are verified.

### Phase 4 — Public networks and free-first-50 program
A public chain requires persistent compute, storage, bandwidth, validator operations, monitoring, and incident response. Public RPC access alone does not constitute a secure network.

The first-50-free promise must not be advertised until its scope is explicit (50 total or 50 per network), the sponsor/relayer is funded, rate limits and a hard spending cap are enforced, and usage is auditable. Gas is not intrinsically free; someone pays it. Do not deploy a relayer or cloud service that can spend funds without a hard cap and owner-controlled stop switch.

### Phase 5 — Digital vault and treasury
- Keep wallet addresses and balances as public/read-only metadata; keep private keys off GitHub and ordinary application servers.
- Separate treasury, deployer, validator, and relayer keys.
- Prefer hardware-backed or managed key custody with multi-party approvals for material transfers.
- Require transaction simulation, allowlists, limits, monitoring, backup/recovery procedures, and a documented emergency pause.
- Never claim custody, wallet ownership, or a balance without evidence.

## Operational controls

- Store credentials only in the hosting provider's secret manager or GitHub Actions secrets with least privilege.
- Use separate development, testnet, and production environments.
- Require CI, review, and explicit approval for mainnet or spending actions.
- Log status and transaction identifiers, never secrets.
- Set health checks, alerting, backup/restore tests, dependency scanning, and rollback procedures.
- Provide clear contact, privacy, terms, and risk disclosures before public financial services.

## Definition of done

A component is **LIVE** only when its public URL responds over HTTPS, health/smoke tests pass, logs/monitoring are available, and a second independent check confirms its behavior. A token is **DEPLOYED** only when its contract address and transaction hash are verified on the intended chain. A network is **PUBLIC** only when independent nodes produce and validate blocks, external RPC works, persistence survives restarts, and operational/security controls are in place.

Until those conditions are evidenced, report the component as DEMO, BLOCKED, or PLANNED—not launched.
