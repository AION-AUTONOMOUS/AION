# AION Economic Model v0.1

## Objective

Design AION around durable network demand rather than a promised market price.

### Supply

- Maximum: 21,000,000 AION
- Precision: 8 decimals
- Smallest unit: neuro

### Demand sources

AION is intended to be required for protocol-level economic activity:

- transaction fees
- compute/service settlement
- validator security
- machine/agent payments
- protocol services
- future application execution fees

Demand must emerge from actual usage; it must not be manufactured by a promised price floor.

### Initial design allocation

| Pool | % | AION |
|---|---:|---:|
| Network contribution | 50% | 10,500,000 |
| Security & validators | 20% | 4,200,000 |
| Ecosystem | 15% | 3,150,000 |
| Protocol treasury | 10% | 2,100,000 |
| Founding allocation | 5% | 1,050,000 |

All allocations are design targets pending governance and legal review. Vesting and release schedules must be encoded on-chain before any mainnet distribution.

### Fees

The protocol should separate three concepts:

1. **Network fee** — paid to process a transaction.
2. **Verification fee** — paid to validators for verification work.
3. **Application/service fee** — optional fee paid to the provider of an actual service.

A future fee market can route a defined portion to security and optionally burn a defined portion. Burn must never be the only reason to expect appreciation.

### Issuance discipline

No component may mint beyond the protocol supply cap.

The future chain state machine must reject:

`totalSupply + issuance > MAX_SUPPLY`

### Validator economics

Validators should earn for honest availability and verification, and face deterministic penalties for provable protocol violations.

The exact inflation/emission curve is intentionally left to economic simulation rather than invented now.

### Why this model is different

The thesis is:

`Real usage → real settlement demand → security demand → network effects`

not:

`Marketing → speculative demand → promised price`

### Mainnet economic tests

Before launch, simulate at minimum:

- 10x demand growth
- 90% demand collapse
- validator cartel
- Sybil flood
- evidence forgery
- duplicate contribution
- dishonest majority
- fee market congestion
- treasury concentration
- reward concentration
- maximum supply exhaustion

No mainnet launch should occur until the protocol remains economically coherent under adverse scenarios.
