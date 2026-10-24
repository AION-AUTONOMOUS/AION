# AION Coin Mainnet Deployment Readiness Checklist

## Current state
- The source contract is `AIONCoinV2`, with a fixed supply of 10,000,000,000 AION and 18 decimals.
- Allocation encoded in the contract: charity 25%, founder 60%, development 5%, community 5%, digital reserve 5%.
- This document and the mainnet workflow do not mean the token has been deployed.
- No mainnet contract address or transaction hash is verified by this repository checklist.

## Required before mainnet deployment
- [ ] Independently review the contract and its constructor/allocation behavior.
- [ ] Confirm in writing that all five treasury addresses are correct, distinct, and controlled by the intended recipients.
- [ ] Explicitly acknowledge the 60% founder allocation and absence of vesting in this contract.
- [ ] Confirm the project website accurately describes token utility, risks, supply, and distribution; do not imply backing, guaranteed returns, or exchange listing.
- [ ] Check applicable legal and compliance obligations for issuance, sale, presale, and marketing.
- [ ] Configure the GitHub Actions environment `aion-coin-mainnet` with required secrets. Never commit private keys or paste them into issues/chat.
- [ ] Confirm the deployer wallet has enough BNB for gas and independently verify the RPC endpoint resolves to chain ID 56.
- [ ] Ensure the environment has appropriate required reviewers/protection rules, where supported.
- [ ] Run compile and token tests successfully on the proposed commit.
- [ ] Obtain an explicit, informed final go/no-go decision immediately before the irreversible mainnet transaction.

## After deployment
- [ ] Record the transaction hash, block number, chain ID, and deployed contract address from the successful workflow output.
- [ ] Verify the contract address and constructor allocations on BscScan; publish/verify source code where feasible.
- [ ] Confirm each treasury's on-chain token balance matches the approved allocation.
- [ ] Publish the address and risks on the official website only after verification.
- [ ] Never claim an exchange/data-site listing until acceptance is confirmed.

## Free market-data listing prerequisites
A free tracker listing is not the same as exchange listing. Coinranking requires an active trading pair on an exchange it tracks, a public block explorer and verifiable project details. CoinGecko says the token must actively trade on an exchange it tracks, except for its separate preview-listing route. Do not create artificial volume or imply a trading market exists before it does.

- Coinranking requirements and submission: https://coinranking.com/coin-listing
- CoinGecko official listing guide: https://support.coingecko.com/articles/9489827481-how-to-list-a-new-cryptocurrency-on-coingecko

## Safety
- Never share a wallet recovery phrase or private key.
- Do not deploy with placeholder or guessed treasury addresses.
- Do not treat a green website deployment as proof that a token is deployed on-chain.
- Do not count pending payment orders as revenue; require confirmed capture/settlement evidence.
