# AION Coin — Testnet Deployment Record

This record triggers the existing guarded GitHub Actions workflow for a **testnet-only** deployment attempt after the Hardhat build, dependency audit, and token tests passed in CI.

- Contract: `AIONCoinV2`
- Target network: BNB Smart Chain Testnet (chain ID `97`)
- Trigger policy: the repository workflow requires a main-branch commit message containing `[run-aion-coin-testnet]` or a manual workflow dispatch.
- Required secrets remain in GitHub Actions; never commit or share deployer private keys.
- The workflow validates the deployer key and five distinct treasury addresses before deployment.
- This record is not proof of deployment. Record the contract address and transaction details only from a successful workflow log and a verified testnet explorer transaction.
- Mainnet deployment is out of scope and remains guarded separately.
