# AION Protocol v0.1 — Proof-of-Value Network

## 1. Purpose

AION is proposed as a cryptographic economic network in which AION is the native settlement asset and verified economic contribution is represented by tamper-evident Value Records.

This repository currently contains a **reference protocol and testable ledger layer**. It is not a production mainnet, and it must not be represented as one.

## 2. Core invariant

AION rewards are not created from an unverifiable claim.

The intended lifecycle is:

`Task → Contribution → Evidence → Independent Verification → Value Score → Settlement`

A settlement is valid only when the underlying Value Record is valid and the minimum validator threshold is met.

## 3. Value Record

A Value Record binds:

- contributor
- subject/task
- contribution category
- measurable resource units
- outcome digest/quality
- evidence references
- timestamp
- metadata
- canonical SHA-256 record hash

The hash commits the record contents. Evidence is referenced by digest rather than trusted because an operator says it exists.

## 4. Proof-of-Verified-Contribution

The v0.1 reference implementation requires at least three distinct validator attestations.

Mainnet requirements must additionally specify:

- validator identity and Sybil resistance
- stake/bond requirements
- attestation signatures
- challenge periods
- fraud proofs
- slashing
- finality
- validator rotation
- data availability

These are deliberately not hidden behind marketing language: they remain explicit engineering work.

## 5. AION monetary policy

Target maximum supply: **21,000,000 AION**.

Smallest unit: **1 neuro = 0.00000001 AION**.

The reference ledger never changes supply merely because a Value Record was submitted. Monetary issuance belongs to the future consensus/monetary layer and must enforce the maximum supply at protocol level.

No fixed USD price is part of the protocol.

## 6. Allocation policy for economic simulation

The initial design target is:

| Allocation | Target |
|---|---:|
| Network contribution | 50% |
| Security & validators | 20% |
| Ecosystem | 15% |
| Protocol treasury | 10% |
| Founding allocation | 5% |

All non-circulating allocations should be subject to transparent vesting and on-chain release rules before mainnet.

These percentages are a design hypothesis, not a promise and not a valuation.

## 7. Settlement

The reference settlement engine calculates a bounded reward:

`reward = min(valueScore × rewardPerUnit, recordCap)`

The cap exists to prevent one record from becoming an uncontrolled issuance primitive.

Production monetary issuance must additionally enforce:

`totalSupply <= 21,000,000 AION`

## 8. Anti-fraud architecture

A production network should combine:

1. cryptographic evidence
2. independent validators
3. validator bonding
4. challenge/dispute windows
5. duplicate-work detection
6. replay protection
7. rate limits
8. anomaly detection
9. slashing for provable dishonest attestations
10. deterministic finality

AI may propose or execute work. AI does not get unilateral authority to mint money.

## 9. Machine economy

AION is intended to settle machine-to-machine and agent-to-agent services:

`AI Agent → Compute Provider → Evidence → Verification → AION Settlement`

The same model can cover storage, inference, data processing, permitted services and other objectively measurable workloads.

## 10. AION Worker Runtime integration

The existing AION Worker Runtime can emit a Value Record after a task reaches its evidence and verification stage.

The intended boundary is:

`Worker Runtime → Value Record → Verification Network → Settlement → AION Chain`

The runtime must never be allowed to bypass protocol verification by directly changing balances.

## 11. Production chain requirements

Before mainnet, AION needs a real consensus implementation. The project should not claim that the current JavaScript reference ledger is a blockchain.

Required components:

- peer-to-peer networking
- block format
- transaction format
- state machine
- consensus/finality
- validator set
- cryptographic signatures
- replay protection
- mempool
- state persistence
- light-client verification
- RPC
- wallet/address format
- genesis tooling
- deterministic state transition tests
- fuzz/property tests
- economic simulation
- independent security audit

## 12. What makes AION different

The proposed differentiator is not a larger marketing number.

It is the coupling of:

**scarce native settlement asset + verified contribution records + autonomous machine economy + cryptographic verification.**

That is the thesis to test.

## 13. Non-goals

AION v0.1 does not promise:

- a future AION price
- replacement of national currencies
- guaranteed appreciation
- exchange listing
- legal/regulatory status
- production mainnet security

Those claims require evidence outside the codebase.

## 14. Next engineering gates

**Gate A — Reference ledger:** complete and tested.

**Gate B — Deterministic chain simulator:** implement blocks, transactions, state transitions and finality simulation.

**Gate C — Economic simulator:** model issuance, validator incentives, attacks and supply.

**Gate D — Testnet:** real peer-to-peer network with public testnet.

**Gate E — Audit:** independent cryptographic and economic review.

**Gate F — Mainnet:** only after all previous gates pass.
