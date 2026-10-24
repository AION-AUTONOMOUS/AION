# AION Coin — Approved Planned Tokenomics

**Status:** Approved project allocation plan; implementation and deployment must be independently verified.  
**Total supply:** 10,000,000,000 AION  
**Decimals:** 18  
**Transfer tax:** 0%  
**Public minting:** Disabled

| Allocation | Percentage | Token amount |
|---|---:|---:|
| Charity | 25% | 2,500,000,000 AION |
| Founder | 60% | 6,000,000,000 AION |
| Development | 5% | 500,000,000 AION |
| Community | 5% | 500,000,000 AION |
| Digital reserve | 5% | 500,000,000 AION |
| **Total** | **100%** | **10,000,000,000 AION** |

## Treasury rules

- Use five distinct, non-zero treasury addresses, one per allocation.
- Verify address ownership/control and the intended recipient before deployment.
- The contract allocates the charity share to a charity-designated treasury; it does not certify a charity or enforce charitable use.
- Founder tokens are not automatically vested by this token contract. If vesting is required, implement and audit a separate vesting contract before launch.
- Never commit private keys, recovery phrases, or deployer secrets.
- Testnet deployment evidence must include network, chain ID, contract address, transaction hash, supply, and bytecode verification.
- No mainnet deployment or movement of real funds without explicit approval.

## Launch status

This document describes planned tokenomics and is not proof of a deployed token, an exchange listing, a price, liquidity, or an offer to sell.
