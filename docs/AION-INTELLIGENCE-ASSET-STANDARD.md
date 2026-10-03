# AION Intelligence Asset Standard

## Purpose
Defines when AION intelligence can be treated as a real, evidence-backed digital/intellectual asset and admitted to the Global Asset Vault.

## Evidence chain
Real Intelligence → Source → Evidence → Rights → Performance → Independent Verification → Independent Valuation → Vault Record.

## Supported asset types
AI models, AI agents, software, datasets, research, patents/IP, knowledge bases, algorithms, workflows, and verified performance.

## Admission rule
An intelligence asset is not counted as verified value unless it has:
- unique asset identity
- source reference
- evidence reference
- rights/usage reference
- measurable performance evidence
- independent verification reference
- independent valuation source

The registry does not itself create legal ownership, cash, revenue, or valuation.

## Economic integrity
A valuation is an evidence-backed assessment, not cash and not revenue. Ownership is recognized only when supported by appropriate legal/rights evidence.

## Vault integration
Validated records expose `vaultType: intelligence-asset` and `vaultEligibility: true`, allowing the existing Asset Vault / AI Value Unit pipeline to consume them without inventing value.

## Global Vault API
Authenticated `POST /api/asset-vault/intelligence` registers a verified intelligence asset directly into the durable Global Asset Vault. Required legalOwner and jurisdiction remain explicit; the standard does not infer ownership.

The vault dashboard state now exposes `verifiedIntelligenceAssetCount`, `verifiedIntelligenceValueUsd`, and `intelligenceAssetStatus`. Only cryptographically verified vault records carrying the Intelligence Asset Standard metadata are included.


## Real-Asset Evidence Gate
AION accepts an intelligence asset as vault-eligible only when its evidence source is one of: issuer, regulated custodian, official registry, signed license, independent audit, reproducible benchmark, customer contract, or public primary source. AION's registry can establish an auditable digital record and uniqueness inside AION; it cannot by itself create legal ownership of a bond, security, commodity, property, or other real-world asset. Real-world ownership/custody must be proven by the relevant issuer, regulated custodian, official registry, or legally enforceable rights document.

## Exclusivity Rule
AION can enforce unique asset IDs and reject duplicate claims inside its own vault. It must not claim that AION is the world's sole owner of an asset unless authoritative external ownership evidence proves that fact.
