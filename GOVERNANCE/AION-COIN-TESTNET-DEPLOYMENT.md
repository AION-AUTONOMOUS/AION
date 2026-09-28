# AION Coin Testnet Deployment

## Target

BNB Smart Chain Testnet (chain ID 97).

## Pre-deployment gates

- AIONCoin compiles successfully.
- AIONCoin tests pass.
- BSC_TESTNET_RPC_URL is configured as a GitHub Actions secret.
- DEPLOYER_PRIVATE_KEY is configured as a protected GitHub Actions secret.
- AION_COIN_OWNER is configured as a protected GitHub Actions secret.
- The deployer account is funded with testnet gas.
- The owner address is independently verified before deployment.

## Post-deployment evidence

The release record must contain:

- deployed contract address;
- deployment transaction hash;
- network and chain ID;
- deployed bytecode verification status;
- total supply at deployment;
- owner address.

No mainnet deployment should be inferred from a testnet deployment.

## Security

Private keys must never be committed to the repository, printed in workflow logs, or placed in source files.
