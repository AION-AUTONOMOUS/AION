# AION VERITY — Verifiable Information Provenance Protocol

**Parent company:** AION AUTONOMOUS GLOBAL NETWORK  
**Status:** Research and prototype proposal; not a deployed global trust network.  
**Principle:** لا نطارد الضجيج؛ نطارد القيمة المثبتة.

## Mission
Build an open, interoperable protocol that helps people and organizations inspect the provenance, timing, context, and corroboration of digital claims and media. VERITY does not declare truth by authority. It records evidence and makes uncertainty and conflicts visible.

## The problem
Generative AI makes synthetic media cheap to produce. A file, a screenshot, or a cryptographic signature alone cannot establish that an event happened as depicted, that a timestamp is honest, or that a source's explanation is complete. Trust needs to be evidence-based, contextual, privacy-aware, and independently auditable.

## Proposed protocol layers

### 1. Capture and provenance record
At capture or submission, create a canonical record containing:
- content digest (cryptographic hash) and media type;
- claimed event time and separately recorded submission/receipt time;
- source identity or pseudonymous credential, with the assurance level stated;
- capture method, device/software claims, and relevant transformations;
- context fields: who is making the claim, when, intended audience, purpose, and source links;
- explicit consent, visibility, retention, and redaction settings.

The record must distinguish device-reported time from independently witnessed time. A hash proves that bytes match a prior digest; it does not prove that the content is true.

### 2. Independent timestamp receipts
Anchor record digests using multiple independent timestamp providers or append-only logs. Record the provider, receipt, clock assumptions, and verification path. Avoid reliance on one clock or one operator. Public anchoring is optional where it could expose sensitive information; only digests or privacy-preserving commitments should be published.

### 3. Witness mesh
Allow independent witnesses—newsrooms, organizations, devices, or people—to sign observations or attestations. Each attestation must say what the witness actually observed, the method, time, and limitations. Do not treat witness count as truth: identities may be duplicated, coordinated, compromised, or biased. Model independence and conflicts explicitly; use Sybil resistance and abuse monitoring.

### 4. Context and claim graph
Represent the relationship between a claim, original source, derivatives, corrections, translations, and independent corroboration. Keep claim text and provenance separate. Preserve a versioned history of edits and retractions rather than silently overwriting records.

### 5. Verification and confidence report
Return a human-readable report:
- what is cryptographically verified;
- what is only asserted;
- what independent corroboration exists;
- contradictions and missing evidence;
- transformations detected or declared;
- privacy limitations and the verification time.

Never return a binary “true” verdict solely from a signature, timestamp, hash, or AI detector. AI detection is a signal with error rates, not proof.

## Minimal data model
A prototype record may include:
- `record_id`, `schema_version`, `content_digest`, `media_type`;
- `claimed_event_time`, `received_at`, `timestamp_receipts[]`;
- `source_credential_ref`, `context_statement`, `purpose`, `audience`;
- `transformations[]`, `attestations[]`, `related_claims[]`;
- `consent_policy`, `visibility`, `retention_policy`;
- `revocation_or_correction_events[]`.

Do not put raw sensitive media, personal identifiers, biometric templates, or private keys in a public ledger. Store sensitive content separately with access controls and encryption.

## MVP — no paid infrastructure required
1. Build a local software prototype that hashes a supplied file and creates a signed provenance manifest.
2. Support explicit capture time versus receipt time and a mock independent timestamp receipt.
3. Add a witness-attestation schema and a verifier that checks signatures and record integrity.
4. Display a report that clearly separates verified facts, claims, and unknowns.
5. Test edits, missing receipts, duplicate witnesses, conflicting attestations, clock skew, and revoked keys.
6. Use synthetic/demo files first; do not publish private media or identify people without consent.

## Success criteria
- Any byte-level change to a manifested file is detected.
- Signature and timestamp receipt verification is reproducible by an independent verifier.
- Reports never imply that integrity equals truth.
- Conflicting witnesses and missing evidence are visible.
- Sensitive source information can be withheld or redacted without falsely implying it was independently verified.
- A documented threat model covers compromised devices, false witnesses, coercion, collusion, stolen keys, privacy leakage, and denial of service.

## Threats and limitations
- A truthful timestamp does not prove the recorded event occurred as claimed.
- A source can submit fabricated material at capture time.
- Witnesses can collude or be pressured.
- Device attestation and AI detectors can fail or be bypassed.
- Public immutable records can create privacy and safety harms; corrections must be possible at the claim layer.
- The protocol must not become a tool for doxxing, surveillance, censorship, or compulsory identification.

## Governance and interoperability
Publish the schema and verification rules openly. Use documented versioning, independent implementations, reproducible tests, transparent security reviews, and a correction/appeal process. Seek external academic, newsroom, civil-society, and standards feedback before claiming global adoption.

## Phased roadmap
- **Phase 0 — specification:** threat model, data schema, abuse cases, privacy review.
- **Phase 1 — local MVP:** file digest, signed manifest, timestamp receipt, witness schema, verifier.
- **Phase 2 — independent pilots:** test with synthetic/public-interest examples and external reviewers.
- **Phase 3 — interoperable network:** only after security, privacy, governance, and abuse-resistance reviews.
- **Phase 4 — production:** only with demonstrated reliability, clear legal basis, incident response, and sustainable operations.

## Explicit non-claims
VERITY is not yet a live global network, a truth oracle, a legal certification authority, or a guarantee that media cannot be forged. No partners, adoption, revenue, or deployment should be claimed without documentary evidence.
