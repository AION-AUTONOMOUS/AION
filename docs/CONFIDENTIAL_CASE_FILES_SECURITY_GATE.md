# Confidential legal case-file intake: security gate

**Status: CLOSED — do not upload real case files.**

The AION GLOBAL COUNSEL page is currently an informational/organizing prototype. A visible upload control is not evidence of secure intake.

## Required before activation
1. Verified user authentication and per-case authorization (deny by default).
2. Private object storage with encryption in transit and at rest; no public object URLs.
3. Strict upload size limits, extension/MIME/signature validation, and malware scanning/quarantine.
4. No case content, filenames, access tokens, or secrets in logs.
5. CSRF/origin protections, rate limiting, audit events without sensitive payloads, and short-lived download access.
6. Retention/deletion controls and a documented incident response process.
7. Automated negative tests: anonymous upload, cross-case access, spoofed MIME, disallowed types, oversized files, storage failures, and cache leakage.
8. Staging end-to-end verification for upload, access isolation, retrieval, deletion, and audit trail; then independent security review.

## Storage policy
Do not store file bytes or case contents in Redis, process memory, GitHub, or public static assets. Memory fallback is not durable and is not a confidentiality boundary.

## Activation rule
The intake endpoint must fail closed whenever any required identity, authorization, storage, scanning, or audit control is missing. Do not enable production intake until all acceptance tests pass and the deployment has been verified in staging.

## Current limitation
The repository context does not establish a verified per-user authentication/case ACL or a configured private encrypted object-storage service. Those are hard blockers, not optional future enhancements.
