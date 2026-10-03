# AION Financial Asset Evidence Standard

A verified financial or real-world asset requires an authoritative identifier, issuer, source reference, external ownership evidence, external custody evidence, valuation source and date, verification reference, legal owner, and jurisdiction.

Allowed evidence sources: issuer, regulated custodian, official registry, or independent audit.

The registry must not create ownership, custody, cash, revenue, or valuation. Cryptographic fingerprints provide integrity and duplicate identity inside AION but do not create legal title.

For bonds and securities, officialIdentifier should be an authoritative identifier such as ISIN, CUSIP, or an applicable equivalent. Capture issuer, quantity/face value, currency, maturity/coupon where applicable, custodian reference, evidence references, valuation source/date, and jurisdiction.

Never store private keys or custody secrets in this record.
