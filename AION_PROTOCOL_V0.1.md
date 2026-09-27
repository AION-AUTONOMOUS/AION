# AION Protocol v0.2 — Proof-of-Intelligence Network

AION is a proposed native settlement network for verifiable AI and machine-economy work.

## Core lifecycle

`Task → Execution → Evidence → Independent Verification → PoI Score → Settlement → Chain`

## Proof-of-Intelligence

A PoI record commits to:
- task specification
- input/output digests
- measurable resource units
- quality and reproducibility
- evidence digest
- contributor identity
- contribution fingerprint
- independent validator attestations

The protocol does **not** treat an AI model's claim as proof. Work must have cryptographic evidence and independent acceptance.

## Security model

AION uses a migration-ready hybrid signature design:
- Ed25519 for the current classical validator path.
- ML-DSA-65 for post-quantum validator signatures where the Node/OpenSSL runtime supports it.
- 2/3 Byzantine quorum for block finality.
- duplicate/replay protection at the contribution and transaction layers.

NIST standardized ML-DSA in FIPS 204 as a post-quantum digital-signature standard. Node.js 24.6+ exposes ML-DSA key generation/signing/verification support, subject to the underlying crypto build.

## Monetary policy

Maximum supply: **10,000,000,000 AION**.

Smallest unit: **1 neuro = 0.00000001 AION**.

The maximum is a hard protocol parameter. No task, worker or validator may mint outside the state-machine issuance rule.

## Allocation target

- Network contribution: 50%
- Security & validators: 20%
- Ecosystem: 15%
- Protocol treasury: 10%
- Founding allocation: 5%

These are design targets pending governance, legal review and audited on-chain release logic.

## Production security gates

Before mainnet:
1. real multi-node networking
2. cryptographic validator attestations
3. durable state persistence
4. deterministic state transition tests
5. adversarial/fuzz tests
6. public testnet
7. independent security review
8. economic attack simulations
9. wallet/client interoperability
10. genesis and upgrade governance

The current repository implements protocol primitives and testnet-building blocks; it is not a claim of mainnet security or guaranteed market value.
