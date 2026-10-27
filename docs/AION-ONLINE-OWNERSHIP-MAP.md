# AION Online Systems & Ownership Map

Last verified against repository and deployment metadata: 2026-10-27 (UTC).
Owner contact: aion.genesisss@gmail.com
Operating model: global, digital-first, cloud-based.

## Purpose

Keep AION's software, public entry points, token work, treasury controls, and SI Exchange work organized under repositories and accounts controlled by AION's owner. A URL being online does not by itself prove that a product is production-ready, legally cleared, secure, or owned outright by AION.

## System inventory

| System | Current evidence | Accurate status | Next gate |
|---|---|---|---|
| AION main website/API | https://aion-production-fbf3.up.railway.app/ | Railway project has a successful production deployment recorded on 2026-10-25; re-check the public URL and critical routes before claiming current uptime. | Automated health checks, uptime alerting, and deployment rollback procedure. |
| AION source and operations | https://github.com/AION-AUTONOMOUS/AION | Main engineering repository exists; deployment and feature readiness must be checked per service. | Maintain tests, security scans, release evidence, and documented owners. |
| SI Exchange | https://github.com/aiongenesisss-commits/si-exchange | Independent codebase; the trading dashboard is a simulation unless separately proven otherwise. | Keep it separate from AION's core repo; test build and deployment; clearly label demo balances/markets. |
| SI provider | https://www.thesuperintelligence.si/ | External website link only. No public API/authentication documentation was verified in the SI integration review. | Obtain official API documentation and credentials from the provider before server-to-server integration. |
| AION Coin on BNB Smart Chain testnet | https://testnet.bscscan.com/ | No verified contract address or transaction hash; the latest recorded workflow failure was caused by malformed `DEPLOYER_PRIVATE_KEY` secret formatting. | Correct the secret privately in GitHub Actions, rerun tests/deployment, then independently verify address, source, supply, and transaction. |
| AION Nova | Proposed chain ID 71101 | Specification only; not running publicly. | Select client, build genesis/consensus, provision nodes, RPC, monitoring, explorer and security tests. |
| AION Orbit | Proposed chain ID 71102 | Specification only; not running publicly. | Same gates as Nova, with a distinct chain configuration. Verify chain-ID uniqueness before public launch. |
| Digital Vault / Treasury | Repository concepts and guarded workflows | Do not describe as a live custody service or assume funds are held. No seed phrases or private keys belong in GitHub or chat. | Implement non-custodial wallet tooling and policy controls first; threat model, backups, key isolation, audit logs, and external security review before real assets. |
| Payments / revenue | PayPal integration code and dashboard history | Count revenue only after server-side payment-provider confirmation and a matching order record. | Validate sandbox end-to-end; keep live mode off until webhook, refunds, terms, privacy and legal/provider readiness are confirmed. |

## Ownership and access controls

- Keep source code in AION-controlled GitHub repositories and domains in accounts controlled by the owner.
- Use separate repositories and least-privilege credentials for AION core, SI Exchange, and infrastructure.
- Use organization/repository secrets for deploy credentials. Never commit credentials, seed phrases, recovery codes, or API keys.
- Require protected environments and explicit approval for mainnet deployments, real-money collection, custody, or infrastructure spending.
- Do not reuse one private key across chains or environments.
- Record each release with repository, commit SHA, workflow run, deployment ID, public URL, test results, and rollback path.
- Third-party providers, hosting platforms, domains, and payment processors remain external dependencies; using them does not mean AION owns those providers.

## Release gates

### Gate 1 — Public application reliability
- [ ] Scheduled health checks for the main website and API.
- [ ] Monitor critical routes, not only the homepage.
- [ ] Alert on failed health checks and failed production deploys.
- [ ] Test rollback and recovery.
- [ ] Publish only measured uptime and current deployment evidence.

### Gate 2 — SI Exchange
- [ ] CI passes from a clean checkout.
- [ ] Confirm production deployment points to the intended repository and commit.
- [ ] Verify the live site manually and with automated smoke tests.
- [ ] Keep simulated funds and matching clearly marked as simulation.
- [ ] No live deposits, withdrawals, custody, or trading until separately reviewed and authorized.

### Gate 3 — AION Coin
- [ ] Fix the malformed testnet deploy secret privately.
- [ ] Run unit tests and compile from a clean checkout.
- [ ] Deploy only to testnet first.
- [ ] Verify transaction, source, token parameters, ownership/admin controls, and supply on the explorer.
- [ ] Do not announce a contract address until independently verified.
- [ ] Mainnet remains locked until an explicit deployment approval and security/legal readiness.

### Gate 4 — Nova and Orbit
- [ ] Choose and pin supported EVM client versions.
- [ ] Configure separate genesis, consensus, validators, and unique chain IDs.
- [ ] Run multiple nodes and prove block production/recovery.
- [ ] Secure and rate-limit RPC endpoints; do not expose administrative RPC.
- [ ] Deploy explorer, faucet, monitoring, and backups.
- [ ] Implement the first-50 free-deployment program with an auditable counter and funded gas sponsorship. Define whether the limit is 50 per chain or 50 total before advertising.
- [ ] Complete independent security review before production claims.

### Gate 5 — Digital Vault / Treasury
- [ ] Start with read-only address/transaction monitoring and policy simulation.
- [ ] Add transaction proposals, role separation, limits, and immutable audit records.
- [ ] Require independent approval for irreversible or high-value transfers.
- [ ] No automatic custody or signing until key-management and recovery controls are independently tested.

## Cost and truthfulness policy

- Do not create paid infrastructure, purchase domains, use paid APIs, or spend funds without explicit budget approval.
- Prefer free CI and free-tier hosting only where their limits and reliability are suitable; never disguise a paid requirement as free.
- Separate statuses in all reports: proposed, committed, merged, deployed, tested, and independently verified.
- A green deployment is not proof of token deployment, customer readiness, legal licensing, security, or revenue.
