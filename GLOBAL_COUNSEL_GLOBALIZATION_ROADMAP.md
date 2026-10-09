# AION GLOBAL COUNSEL — Global Legal Integrity & Expansion Roadmap
Version: 1.0
Status: Implementation roadmap; NOT a certification, legal opinion, or proof that controls are deployed.
Owner: AION GLOBAL COUNSEL
Last reviewed: 2026-10-09

## 1. Mission and product boundary
Build a multilingual, digital legal-information and case-organization service that helps users identify relevant jurisdictions, organize facts and evidence, locate primary legal sources, and prepare questions or drafts for review by a qualified lawyer. The service must not represent itself as a law firm, licensed lawyer, court, or guaranteed legal outcome unless the relevant authorization has been independently verified.

## 2. Non-negotiable legal-integrity rules
1. No legal proposition is marked VERIFIED unless a reviewer can open the primary source and confirm the exact text.
2. Every cited rule or decision must carry jurisdiction, issuing authority, instrument/case identifier, exact article/paragraph/page where applicable, source URL, publication date, effective date, version/amendment history where available, access/check timestamp, language, and reviewer/status.
3. Separate (a) primary-source text, (b) official explanatory guidance, (c) secondary commentary, (d) AI-generated analysis, and (e) user-provided facts.
4. Never invent case citations, article numbers, quotations, court names, dates, or procedural deadlines.
5. If source access fails, a date is unknown, sources conflict, or law may have changed, show NEEDS_REVIEW / SOURCE_UNAVAILABLE and do not state the proposition as current law.
6. Explain that jurisdiction and deadlines can depend on facts; urgent deadlines, criminal matters, immigration, family safety, and court filings require prompt qualified local advice.
7. Do not claim global coverage. Coverage is per jurisdiction, topic, source set, and last verified date.

## 3. Legal-source record schema
Each source record should include:
- source_id (stable internal ID)
- jurisdiction_id and jurisdiction_name
- issuing_authority
- source_type: legislation | regulation | court_decision | official_guidance | treaty | secondary_source
- title, citation_or_case_number, article_or_paragraph
- canonical_url and optional archived_url (where legally permitted)
- publication_date, effective_from, effective_to (nullable), last_amended_date
- language, official_status, document_version
- retrieved_at, last_verified_at, verification_method
- reviewer_id, review_note, content_hash (for integrity tracking)
- status: UNREVIEWED | VERIFIED_PRIMARY_SOURCE | VERIFIED_OFFICIAL_GUIDANCE | STALE | CONFLICT | UNAVAILABLE | SUPERSEDED
- supersedes_source_id / superseded_by_source_id where applicable
A URL alone is not proof of current validity. A content hash proves only that captured bytes have not changed since hashing; it does not prove authenticity or legal force.

## 4. Jurisdiction rollout model
Phase A — Saudi Arabia pilot: prioritize a narrow set of official legislative and judicial-service sources. Verify the exact legal texts and version status before presenting a rule as current.
Phase B — Add one jurisdiction at a time using a published source inventory, language support, local review, privacy assessment, and regression tests.
Phase C — Expand topic-by-topic (e.g. commercial, employment, consumer) only after the source and update workflow is operational.
Phase D — Add cross-border workflows only with conflict-of-laws and forum-selection warnings, and qualified review where required.
A country is not “launched” until its sources, scope limitations, update owner, quality checks, and incident path are documented.

## 5. Verification workflow
1. Identify jurisdiction, topic, relevant dates, court/authority, and procedural stage.
2. Search primary official source first; secondary sources may help discovery but cannot replace primary verification.
3. Open the actual document and confirm citation, wording, version, effective date, and amendments/repeal status.
4. Record retrieval/check timestamps and reviewer evidence; preserve an allowed source snapshot or checksum when lawful.
5. Run contradiction and supersession checks; if unresolved, mark CONFLICT or NEEDS_REVIEW.
6. Have a qualified human reviewer approve high-impact claims before release.
7. Recheck sources on a defined schedule and after known amendment alerts; record every status transition in an audit log.

## 6. Privacy and security release gate
The existing browser-only prototype is not approved for confidential or sensitive case files. Before such data is accepted, implement and independently test:
- server-side identity and secure session management;
- tenant and case-level authorization on every read/write/download;
- private document storage with managed encryption keys and rotation;
- TLS in transit, secrets management, least privilege, and environment separation;
- upload size/type limits, malware scanning, safe parsing, and quarantine;
- tamper-evident audit events without unnecessarily copying case contents into logs;
- retention/deletion workflows, backup deletion policy, incident response, and privacy notices;
- abuse/rate limits, dependency/secrets scanning, penetration testing, and recovery tests.
Client-side-only checklists and static source tests are not evidence that these controls are implemented. Do not invite users to upload confidential case files until release gates pass.

## 7. AI output contract
Every legal answer should show:
- jurisdiction and issue understood;
- source citations with exact pinpoint references where available;
- source verification status and last checked date;
- facts assumed vs facts supplied by the user;
- uncertainty, missing facts, and competing interpretations;
- suggested next steps, distinguishing information from legal advice;
- when local counsel or urgent professional help is needed.
If no verified primary source is available, say so plainly and provide a research checklist rather than fabricate a citation.

## 8. Quality and release tests
Required test groups:
- source record schema validation and mandatory metadata;
- expired/repealed/superseded source is never displayed as current;
- missing URL, missing effective date, source conflict, and failed retrieval produce fail-closed status;
- citations resolve and pinpoint references match the source;
- language switching preserves citation identity and does not translate official quotations as if original;
- authorization tests prove user A cannot read, modify, list, or download user B's cases;
- unauthenticated access is denied; logs do not contain sensitive case text;
- deletion, backup/retention, upload scanning, and key rotation are tested;
- regression tests for disclaimers, urgent deadlines, and no-guarantee language.
CI passing is necessary but not sufficient; independent security and legal review remain required.

## 9. Transparency labels
Use these labels consistently:
- VERIFIED PRIMARY SOURCE — primary official text checked, with date and pinpoint citation.
- OFFICIAL GUIDANCE — guidance published by an official body; not itself necessarily binding law.
- SECONDARY SOURCE — commentary or research aid, not primary legal authority.
- AI DRAFT — generated analysis requiring review.
- NEEDS REVIEW — source, currency, jurisdiction, or interpretation not resolved.
- SOURCE UNAVAILABLE — unable to access/verify source at the stated time.
- SUPERSEDED — source replaced, repealed, or no longer current for the stated purpose.

## 10. Operating metrics
Track coverage only when evidence exists:
- jurisdictions with reviewed source inventories;
- share of displayed legal claims with verified primary citations;
- stale/conflicting/unavailable source rates;
- citation error rate from sampled human audits;
- median time from official amendment notice to reviewed update;
- unauthorized-access test pass rate;
- deletion and incident-response test outcomes;
- user-reported corrections and time to resolution.
Do not market a metric until the measurement method and underlying results can be audited.

## 11. Phased delivery
P0 — Protect users: maintain no-sensitive-data warning; inventory all data flows; establish owner and incident contact.
P1 — Source integrity: implement the source schema, review states, change history, and a narrow Saudi source registry.
P2 — Legal workflow: jurisdiction intake, evidence chronology, source-linked draft, uncertainty display, export with citations.
P3 — Secure backend: authentication, case isolation, private storage, audit, deletion, and tested backups.
P4 — Human review and QA: qualified legal reviewers for each supported jurisdiction/topic; sampling and correction process.
P5 — Controlled expansion: add jurisdiction/topic only after source, privacy, support, and QA gates pass.
P6 — Commercial launch: transparent terms, privacy notice, service scope, support, payment confirmation, refunds, and consumer-law review.

## 12. Current truthful status
This document specifies a target operating model. It does not establish that secure case storage, encryption, authentication, automated legal database verification, lawyer review, licensing, certification, or global jurisdiction coverage currently exists. The current browser-only Global Counsel prototype must continue to warn users not to enter confidential data until those controls are implemented and tested.
