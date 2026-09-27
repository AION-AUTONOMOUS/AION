# AION Protocol

This directory is the first executable layer of the AION economic protocol.

## Included

- `aion-value-ledger.js` — deterministic Value Record creation, verification and bounded settlement.
- `aion-value-ledger.test.js` — executable tests.
- `genesis.json` — testnet/reference economic parameters.

## Run

`node --test protocol/aion-value-ledger.test.js`

## Important

This is a protocol reference implementation, not a blockchain and not a production financial system.

The next layer is a deterministic chain simulator followed by a real consensus/testnet implementation. The AION Worker Runtime must remain behind the verification boundary.
