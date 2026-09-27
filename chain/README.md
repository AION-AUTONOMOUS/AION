# AION Chain Simulator v0.2

This is a deterministic chain/state-machine reference layer built on top of the AION Proof-of-Value ledger.

It provides:

- Ed25519 transaction signing/verification
- deterministic transaction hashes
- balances and nonces
- block chaining
- state-root commitments
- hard maximum-supply enforcement

It intentionally does **not** claim production consensus, P2P networking, validator finality, or mainnet security.

Run:

`node --test chain/aion-chain.test.js`

Next production gates are consensus/finality, P2P, persistent state, mempool, RPC, light clients, economic simulation and independent audits.
