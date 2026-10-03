# AION Asset Vault — Security & Custody Architecture

## Security objective
Protect the registry and the control plane with defense in depth. Absolute invulnerability is not a technically honest guarantee.

## Layers
1. Identity: strong authentication, short-lived credentials, least privilege.
2. Keys: external KMS/HSM; never commit secrets or private keys.
3. Custody: threshold/multisignature authorization for movements of real assets or money.
4. Registry: tamper-evident records and independent evidence references.
5. Network: TLS, private networking where supported, restricted administrative surfaces.
6. Detection: immutable audit events, anomaly detection and alerting.
7. Recovery: encrypted offline backups, tested restore procedures, geographic redundancy.
8. Verification: independent reconciliation with banks, brokers, custodians, registries and blockchains.
9. Testing: dependency scanning, threat modeling, penetration testing and incident exercises.
10. Governance: separation between AI analysis, execution permissions, custody and legal ownership.

## Non-negotiable controls
- No secret or private key in source code.
- No AI-only authority to irreversibly transfer all assets.
- No single credential should control the entire reserve.
- No asset is treated as legally owned solely because it exists in the AION registry.
- Failed verification must fail closed rather than create a successful ownership record.

## Production gate
The vault should not be described as globally trusted until the above controls have been independently tested and the relevant legal/custody arrangements are operational.
