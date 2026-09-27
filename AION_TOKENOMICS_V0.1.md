# AION Economic Model v0.2 — 10 Billion Supply + Proof-of-Intelligence

## Supply
- Maximum: **10,000,000,000 AION**
- Precision: 8 decimals
- Smallest unit: **1 neuro = 0.00000001 AION**
- Maximum base units: **1,000,000,000,000,000,000 neuro**

## Core demand mechanism

AION is intended to settle objectively measurable work performed by AI agents, compute providers, data processors and other permitted machine-economy participants.

The intended path is:

**Task → Execution → Evidence → Independent Verification → PoI Score → AION Settlement**

PoI is not a claim that a model is "intelligent" in the abstract. It is a protocol measurement of a verifiable contribution: task correctness/quality, reproducibility, resource usage and cryptographic evidence.

## Supply allocation target

| Pool | % | AION |
|---|---:|---:|
| Network contribution | 50% | 5,000,000,000 |
| Security & validators | 20% | 2,000,000,000 |
| Ecosystem | 15% | 1,500,000,000 |
| Protocol treasury | 10% | 1,000,000,000 |
| Founding allocation | 5% | 500,000,000 |

These are protocol-design targets, not a promise of market value. Vesting and release schedules must be enforced on-chain before mainnet distribution.

## Fees and settlement

1. Network fee — transaction processing.
2. Verification fee — validator verification.
3. Application/service fee — actual service provider.
4. PoI settlement — bounded reward for accepted verified work.

No component may mint above the protocol maximum.

## Anti-inflation invariant

The state machine must reject:

`totalSupplyNeuro + issuanceNeuro > 1,000,000,000,000,000,000`

A fee burn may be added later only as an explicit economic parameter; it is not a guaranteed price mechanism.

## Adversarial economic tests

Before mainnet, simulate:
- 10x demand
- 90% demand collapse
- validator cartel
- Sybil flood
- forged evidence
- duplicate work
- dishonest validators
- reward concentration
- treasury concentration
- supply-cap exhaustion

No price target is encoded in the protocol.
