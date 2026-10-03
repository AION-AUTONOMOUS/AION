# AION Asset Vault — Evidence Reconciliation

The registry is not proof of legal ownership by itself.

For every production asset, AION should reconcile registry records against independent evidence such as a custodian statement, broker record, land registry, title document, contractual right, blockchain proof, or other authoritative source.

The reconciliation engine canonicalizes identity, owner, custodian, registry, evidence references, valuation and verification time, then computes SHA-256 fingerprints.

A mismatch produces `MISMATCH` and `failClosed: true`. It must never silently become a successful ownership state.

This layer is an integrity control, not legal advice and not a substitute for regulated custody or title transfer.
