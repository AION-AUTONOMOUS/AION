# AION Coin Testnet Deployment

## Target

BNB Smart Chain Testnet (chain ID 97).

## Approved allocation

- Charity: 25% (2,500,000,000 AION)
- Founder: 60% (6,000,000,000 AION)
- Development: 5% (500,000,000 AION)
- Community: 5% (500,000,000 AION)
- Digital reserve: 5% (500,000,000 AION)

Total fixed supply: 10,000,000,000 AION, 18 decimals.

## Pre-deployment gates

- Contract compilation succeeds.
- Contract unit tests pass for each allocation, fixed total supply, zero-address rejection, and distinct treasury addresses.
- BSC_TESTNET_RPC_URL is configured.
- DEPLOYER_PRIVATE_KEY is stored only as a protected GitHub Actions secret.
- Five distinct treasury addresses are configured as protected secrets:
  AION_CHARITY_TREASURY, AION_FOUNDER_TREASURY, AION_DEVELOPMENT_TREASURY,
  AION_COMMUNITY_TREASURY, AION_DIGITAL_RESERVE.
- The operator independently verifies each address and intended beneficiary.
- Deployment script refuses to run on a chain ID other than 97.

## Post-deployment evidence

Record the deployed contract address, transaction hash, network and chain ID, bytecode verification status, total supply, allocation balances, and all five treasury addresses. Independently verify evidence through a block explorer/RPC before making any public release claim.

No mainnet deployment should be inferred from a testnet deployment. Mainnet deployment and movement of real funds require explicit approval.

## Charity and founder safeguards

The charity allocation is sent to a designated treasury but the token contract cannot certify charitable status or enforce charitable spending. Founder vesting is not built into this token contract and must be designed and audited separately if required.

## Security

Private keys and recovery phrases must never be committed to the repository, printed in workflow logs, or shared in chat.
