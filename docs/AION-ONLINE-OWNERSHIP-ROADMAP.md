# AION Online-First Ownership & Infrastructure Roadmap

**Status:** implementation roadmap; not proof that every service is live or owned.
**Owner contact:** aion.genesisss@gmail.com
**Principle:** لا نطارد الضجيج؛ نطارد القيمة المثبتة.

## Objective

Build one coherent, internet-accessible operating environment for AION AUTONOMOUS, AION Coin, the digital treasury/vault, and SI Exchange. Prefer assets and services controlled by AION, with documented ownership, portable deployments, and recoverable backups. A service is only marked LIVE after a public endpoint and a successful health check are recorded.

## Ownership boundaries

AION can own/control its source code, contract source, deployment configurations, domain registrations (if registered in the company’s name), content, release process, and keys held in approved secret managers. AION cannot claim ownership of GitHub, Vercel, Railway, DNS providers, blockchain validators, or third-party AI/payment providers; those are external dependencies. Do not imply that a wallet address is company-controlled until control is verified safely.

## Workstreams and acceptance evidence

### 1. Public web presence and DNS
- Maintain a canonical HTTPS company landing page and link to the GitHub source repository.
- Inventory each domain, registrar, DNS zone, TLS certificate, renewal date, and accountable account.
- Require valid TLS, uptime/health checks, accessible privacy/contact pages, and an incident contact.
- Record domain ownership proof without publishing account credentials.

### 2. Source and release control
- Keep company-owned source in AION-controlled GitHub repositories; document repository owners and collaborators.
- Protect the default branch, require CI checks, use least-privilege GitHub Actions permissions, and pin critical third-party actions where practical.
- Use tagged releases and reproducible build/deploy records. Back up repositories and deployment manifests to a separately controlled location.
- Never put tokens, private keys, seed phrases, passwords, or API secrets in source code, issues, logs, or chat.

### 3. Hosting and service inventory
- Maintain a registry of every website, API, worker, database, scheduled job, provider, endpoint, region, owner, cost, backup, and recovery procedure.
- Prefer portable containers and infrastructure-as-code so the company can migrate between hosts.
- Every service needs a health endpoint, structured redacted logs, alerting, documented restore test, and a clear OFFLINE/DEVELOPMENT/STAGING/PRODUCTION status.
- No paid cloud resource or service is created without explicit budget approval. Use existing free tiers only within their terms and limits.

### 4. SI Exchange
- Keep the demo exchange clearly marked as simulated until a real market, legal requirements, custody model, security review, and financial controls have all been independently approved.
- Simulated BTC/SAR, ETH/SAR, AION/SAR prices and demo balances must never be presented as live market data or customer assets.
- Keep order matching, demo balances, and ledger tests isolated from any future real-money system. Do not enable deposits, withdrawals, custody, or live trading as part of this roadmap.

### 5. AION Coin and EVM networks
- Track BNB Smart Chain testnet separately from proposed AION Nova and AION Orbit networks.
- No token deployment is confirmed without chain ID, public explorer transaction, contract address, verified source/bytecode, and independent read-back.
- The proposed Nova/Orbit chain IDs are provisional until uniqueness and network configuration are checked.
- A public EVM network requires functioning consensus/validators, persistent nodes, protected RPC, monitoring, backup/recovery, and operational ownership; a website or single CI job is not a blockchain network.
- Do not deploy to mainnet, solicit deposits, bridge assets, seed liquidity, or promise returns without explicit approval, a budget, legal review, and security review.

### 6. Digital Vault and treasury
- Treat the vault as a security architecture and auditable record system, not a claim that assets are already secured or under company control.
- Separate public wallet addresses from signing credentials. Never store seed phrases or raw private keys in GitHub, the web app, a database, or this document.
- Use a dedicated hardware wallet or a reputable managed/multisignature custody setup when operationally justified. Verify provider terms and recovery procedures before use.
- Maintain a transaction register with network, asset, amount, timestamp, transaction hash, purpose, and independent explorer evidence. Never infer ownership from an address alone.
- Test restore/recovery procedures without exposing secrets. Use separate test and production keys.

### 7. AI, integrations, and automation
- Register each integration with provider, official documentation, authentication method, scopes, secret location, quota/cost, fallback, and last successful test.
- Do not assume that ChatGPT, SI, Microsoft, GitHub, Railway, or Vercel are automatically connected to one another. Each connection needs an explicit supported integration and verified test.
- Keep automated agents least-privileged and bounded; require human approval for spending, production blockchain deployments, key movement, legal commitments, or customer-data exports.

### 8. Privacy, compliance, and customer readiness
- Before collecting personal or confidential customer data, publish an appropriate privacy notice, retention/deletion process, access controls, backups, incident response, and data-processing review.
- Do not market legal, financial, custody, exchange, or token-sale services as operational until applicable Saudi and other target-market obligations have been reviewed by qualified professionals.
- Do not count revenue until the payment provider confirms payment and the order is reconciled server-side.

## Required single source of truth

Maintain a service register with these fields:

| Field | Requirement |
|---|---|
| Service / asset | Unique name and purpose |
| Control / owner | AION account or external provider; never assume |
| Environment | Development, staging, production |
| Public URL / chain ID | Exact value, or explicitly “not provisioned” |
| Health evidence | Timestamped passing check and evidence link |
| Secrets | Secret-manager location only; never the secret itself |
| Data and backups | Data class, retention, backup schedule, last restore test |
| Security | Access model, MFA, least privilege, incident contact |
| Cost | Free tier or approved budget; no unapproved spend |
| Status | Proposed, building, deployed-unverified, verified-live, retired |
| Next action | One specific owner/action and acceptance criterion |

## Release gates

1. **Inventory:** identify accessible repositories, production URLs, domains, integrations, secrets by name only, and existing costs.
2. **Baseline:** run read-only health checks; distinguish reachable from actually functional.
3. **Harden:** least privilege, branch protection, secret hygiene, backups, monitoring, privacy and incident documentation.
4. **Consolidate:** publish the service registry and migration/recovery instructions.
5. **Validate:** test each service from the public internet, test backups, and attach evidence.
6. **Expand:** only then implement public Nova/Orbit infrastructure and a gas-sponsor promotion under explicit budget and security gates.

## Current known blockers (do not silently mark resolved)

- BNB Smart Chain testnet deployment previously failed because the GitHub Actions `DEPLOYER_PRIVATE_KEY` secret was malformed. Correct it privately in GitHub Actions; never send it in chat.
- No verified AION Coin contract address or transaction hash is recorded here.
- AION Nova and AION Orbit remain proposals until actual chain nodes, consensus, public RPC/explorer, monitoring, and health evidence exist.
- The SI Exchange web demo is not evidence of a live exchange or custody system.
- Hosting, domain, and integration ownership must be verified against the relevant provider accounts and billing/ownership records.

## Completion rule

A work item is complete only when its acceptance test passes and evidence is linked. Documentation, a queued workflow, a successful web deployment, or a dashboard screenshot alone is not proof that the entire company stack is live.
