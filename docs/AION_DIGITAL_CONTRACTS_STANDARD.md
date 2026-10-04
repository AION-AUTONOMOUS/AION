# AION Digital Contract Standard v1.0

AION is designed to operate digitally. Commercial agreements therefore use an electronic lifecycle by default:

Draft -> Issue -> Electronic Acceptance / Signature -> Execute -> Monitor -> Amend / Terminate

## Evidence model
Every contract stores an immutable version number, canonical payload, SHA-256 content hash, named parties and roles, commercial and fee terms, issuance event, acceptance events, event hashes, lifecycle status and verification result.

An executed version must never be silently overwritten. Amendments must create a new version or a formally linked amendment record.

## Electronic acceptance
AION supports explicit electronic acceptance as an application-level mechanism. Where a transaction or jurisdiction requires a stronger or qualified electronic signature, AION must attach or integrate the appropriate authorized e-signature or eID evidence. A simple click is not treated as universally equivalent to a qualified signature.

Saudi Arabia's Electronic Transactions Law defines electronic transactions, electronic records and electronic signatures and provides the legal framework for electronic contracting and records. The exact signature level and enforceability must still be assessed for the transaction and applicable jurisdiction.

## Orbital Exchange contract
The commercial agreement should include parties and authority, exact service/capacity, geography and technical requirements, obligations, price and payment schedule, AION success fee and payer, attribution rules, renewal rules, confidentiality, sanctions/export-control/licensing representations, governing law, dispute resolution, amendment/termination and electronic-notice/signature clauses.

The current target success fee is 5% of qualifying contract value, payable only when the signed commercial agreement says so.

## Security boundary
Private contracts, RFQs, customer identities and commission records are not public API data. Administrative endpoints require the owning service token.

AION agents may draft, compare, route, verify evidence and maintain audit trails. A legally binding commitment must be made by an authorized legal person or an authorized electronic-signature mechanism on behalf of the contracting entity.
