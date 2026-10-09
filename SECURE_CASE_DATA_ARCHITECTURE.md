# AION GLOBAL COUNSEL — Secure Case Data Architecture (Draft)

Status: design and release gate only. This document does not claim that encryption, authentication, storage, or access controls have been implemented.

## Safety decision
Do not accept real case files or sensitive personal data until every release gate below is implemented and independently tested. The current browser-only form is a low-data organizer, not a secure case-management system.

## Scope for the first pilot
- Jurisdiction: Saudi Arabia pilot only.
- Data: synthetic test cases until the security review passes.
- No public file-upload endpoint in the pilot.
- No legal conclusion is marked verified solely because a source URL exists.
- No sensitive case text in application logs, analytics, URLs, error reports, or support tickets.

## Proposed architecture (must be approved and implemented)
1. **Web client**: static UI; input validation is usability only and is never treated as an authorization boundary.
2. **API boundary**: authenticated server-side endpoints; deny by default; enforce method, content type, body size, rate limits, CSRF protections where cookie sessions are used, and a strict origin policy.
3. **Identity and sessions**: a maintained identity provider or vetted auth library; secure, HttpOnly, SameSite cookies; short-lived sessions; session rotation after authentication; MFA for staff and privileged users.
4. **Case authorization**: every read, write, export, and delete operation checks case membership on the server. Use tenant/case-scoped authorization, not client-supplied user IDs. Add automated cross-account access-denial tests.
5. **Metadata store**: use a managed database with TLS, least-privilege credentials, private access where available, encrypted backups, migrations, and a tested restore procedure. Do not store full case documents in Redis or logs.
6. **Document store**: private object storage; no public bucket; short-lived signed URLs only after authorization; size/type allow-list; malware scanning/quarantine; safe download headers; server-generated object keys; integrity hashes; lifecycle rules.
7. **Encryption**: TLS in transit; managed encryption at rest; application-level envelope encryption for especially sensitive documents if required by threat model; keys in a managed secret/key service, never in source control or client code. Document key rotation and revocation.
8. **Audit trail**: record actor, action, case identifier, timestamp, result, and request correlation ID; never log document contents, credentials, tokens, or unnecessary personal data. Protect logs from alteration and restrict access.
9. **Retention and deletion**: publish a retention schedule; implement user-authorized deletion; account for derived files, exports, and backup expiry; test deletion behavior before making a permanent-erasure promise.
10. **Incident response**: define triage, containment, evidence preservation, notification decision-making, recovery, and post-incident review. Keep secrets out of incident logs.

## Release gates (all required)
- [ ] Data-flow diagram and data inventory approved.
- [ ] Jurisdiction-specific privacy and legal review completed.
- [ ] Authentication and session security tested.
- [ ] Server-side case-level authorization implemented and tested.
- [ ] No cross-account reads, updates, exports, or deletes in negative tests.
- [ ] Upload restrictions, malware scanning, and quarantine tested.
- [ ] Encryption/key management and rotation documented and tested.
- [ ] Logs reviewed for accidental personal data/secrets.
- [ ] Retention, deletion, backup expiry, and restore tested.
- [ ] Dependency and secret scans completed; findings triaged.
- [ ] Independent security review completed; critical/high findings resolved.
- [ ] Incident-response exercise completed.
- [ ] Clear privacy notice and support contact published.
- [ ] Owner signs off on a limited pilot using informed consent.

## Minimum synthetic test cases
1. Anonymous visitor cannot read or write a case.
2. User A cannot read, update, export, or delete User B's case even when guessing its ID.
3. Revoked session cannot access a previously opened case.
4. Oversized, unsupported, malformed, and suspicious uploads are rejected or quarantined.
5. Logs contain no case narrative, document content, password, session cookie, or secret.
6. Deleted case is inaccessible immediately and expires from backups according to the declared schedule.
7. Restore from backup does not make deleted or unauthorized cases visible.
8. Expired signed download link fails; a link for one case cannot access another case.
9. Rate limits and error responses do not reveal whether another user's case exists.
10. A key rotation test confirms old ciphertext is either safely rewrapped or access is safely denied per documented procedure.

## Operational rules
- Keep the first version free to explore with synthetic data; never trade away confidentiality for a free tier.
- Review the chosen vendor's data processing terms, regions, subprocessors, backup behavior, and costs before enabling storage.
- Do not enable a public upload form until the release gates are met.
- A completed checkbox is not evidence of implementation. Attach test output, configuration evidence, and reviewer sign-off to each gate.

## Decision
**Current status: NOT APPROVED for sensitive case files.** This is an architecture draft and release checklist, not an audit, certification, or implementation report.
