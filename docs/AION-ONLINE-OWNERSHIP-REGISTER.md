# AION Online Ownership Register

Last reviewed: 2026-10-27

This register separates resources that are reachable online from systems whose ownership, production readiness, or financial controls have not yet been verified. A URL being reachable is not proof that AION owns every underlying account or that a financial service is production-ready.

## Canonical company identity

- Name: AION AUTONOMOUS GLOBAL NETWORK
- Official contact: aion.genesisss@gmail.com
- Source-of-truth repository: https://github.com/AION-AUTONOMOUS/AION
- Current public web app: https://aion-production-fbf3.up.railway.app/
- Operating rule: no paid service, advertising, cloud upgrade, audit, liquidity, or listing spend without explicit owner approval.

## Online resource inventory

| Resource | Current evidence | Status and next gate |
|---|---|---|
| AION website/API | Railway URL is recorded in the repository. | Verify current deployment, health endpoints, domain/TLS, logs, and rollback before calling it production-ready. |
| AION source and workflows | GitHub repository is accessible to the linked GitHub integration. | Use protected branches, least-privilege secrets, CI, and reviewed changes. Never place secrets in commits or issue comments. |
| SI Exchange | https://si-exchange-1vq1.vercel.app/ | The recorded site is a simulated exchange. Demo balances and indicative prices are not real funds, live prices, or proof of a deployed AION token. Confirm Vercel project/account ownership and production deployment from the provider dashboard. |
| AION Coin | Intended contract: AIONCoinV2; BNB Smart Chain testnet chain ID 97. | No verified contract address or transaction hash is recorded. A prior testnet workflow failed because DEPLOYER_PRIVATE_KEY was malformed. Correct the secret only in GitHub Actions secrets; never share it in chat. Re-run tests and verify the deployed address on the explorer before reporting a deployment. |
| AION Nova | Proposed EVM chain ID 71101. | Design proposal only; no public RPC, validators, explorer, or production network verified. Confirm chain-ID uniqueness before public use. |
| AION Orbit | Proposed EVM chain ID 71102. | Design proposal only; no public RPC, validators, explorer, or production network verified. Confirm chain-ID uniqueness before public use. |
| Digital vault / wallet | Wallets and addresses mentioned in conversations are not, by themselves, proof of custody or ownership. | Never store seed phrases or private keys in GitHub, app variables exposed to browsers, issue comments, or chat. Use an audited wallet/HSM or managed signing service only after threat modelling and explicit owner control. |
| Payments and revenue | PayPal integration work exists in the project history. | Count revenue only after server-side provider verification and matching order evidence. Do not accept client-side success flags or claim revenue from payment links alone. |
| Company email and domain | Official contact email is recorded above. | Verify mailbox sign-in/recovery, DNS ownership, SPF, DKIM, DMARC, and registrar access in their respective provider dashboards. Do not claim control based only on a published email address. |

## Required deployment sequence

1. **Secure ownership:** confirm owner/admin access to GitHub, Railway, Vercel, domain registrar/DNS, email, payment provider, and wallet. Use MFA and recovery codes held privately by the owner.
2. **Make the web layer reproducible:** document build/start commands, health/readiness endpoints, environment variables by name only, logs, backup/restore, and rollback. Keep production secrets outside source control.
3. **Verify SI Exchange:** run CI, confirm its Vercel project and deployment source commit, and keep real trading/deposits/withdrawals disabled until legal, security, reconciliation, and custody reviews pass.
4. **Verify AION Coin testnet:** fix the malformed GitHub secret privately, run tests, deploy only to testnet, and publish the verified contract address and transaction hash. Mainnet requires a separate explicit owner approval.
5. **Design the two EVM networks:** select a maintained EVM client and consensus design, define validator/key management, chain IDs, RPC rate limits, monitoring, explorer, faucet, backups, incident response, and gas policy. Do not label a local single-node test as a public network.
6. **Implement the first-50 free deployment offer:** define whether the cap is 50 deployments total or 50 per network; enforce the cap server-side with an auditable counter and sponsor budget. “Free” gas still needs a funded sponsor/relayer and abuse protection.
7. **Digital vault:** define assets, signing policy, multisig threshold, recovery, transaction limits, audit trail, and independent review before holding customer funds. Never request or publish the owner's recovery phrase.
8. **Launch gate:** a component is “online” only after a public URL/RPC responds, health checks pass, logs and rollback are available, ownership is confirmed, and the exact commit/configuration is recorded. Financial capabilities require separate approval and evidence.

## Non-negotiable safety controls

- No private key, seed phrase, API secret, or recovery code in source, logs, public issues, or chat.
- No real deposits, withdrawals, custody, token sale, mainnet deployment, or live trading until their explicit safety and legal gates pass.
- No paid cloud resources or third-party spend without explicit owner approval.
- No unsupported claims of ownership, uptime, customers, revenue, token deployment, or public-chain launch.
- Treat screenshots and UI labels as clues; verify state through the authoritative provider/API or public explorer.

## Evidence to attach for each launch

Record the provider/project, public endpoint, source repository and commit SHA, deployment/run ID, health-check result and timestamp, relevant sanitized logs, rollback procedure, owner access verification, and unresolved risks. For a blockchain deployment also record chain ID, contract address, transaction hash, compiler/build metadata, and explorer verification URL.
