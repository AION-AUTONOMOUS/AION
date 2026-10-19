# AION × SI — Technical Integration Gate

## Objective
Provide a discoverable AION entry point to the intended SI provider and prepare a secure integration without claiming that an API connection is already active.

## Official provider verification (2026-10-19)
Reviewed the provider's public website: https://www.thesuperintelligence.si/
- The site describes a native SI Engine for structured decision support and says no separate account is required for the on-site experience.
- The site explicitly describes its native engine as deterministic discovery and templates, with no language model running in that part; scores are heuristic estimates rather than verified confidence.
- The public pages reviewed do not document a public API endpoint, developer portal, authentication scheme, or programmatic integration method.
- Consequently, the verified supported path today is to open and use the SI website. A server-to-server connector cannot responsibly be implemented until the provider publishes or supplies official integration documentation and grants access.

## Current deliverable
- `si.html` is a portal page linking to the intended SI website and the AION repository.
- It explicitly distinguishes an external link from a working provider integration.

## Required before live integration
1. Ask the provider for official API/partner integration documentation, endpoint list, authentication scheme, supported use, and an issued test credential.
2. Confirm pricing/rate limits, data retention, and whether company/customer data may be sent.
3. Implement a server-side adapter only (never expose provider credentials to browser JavaScript).
4. Add request validation, timeouts, rate limits, redacted logs, and a feature flag defaulting to off.
5. Add tests with mocked provider responses and verify error handling, authentication failures, and data minimization.
6. Deploy to staging, verify end-to-end with the provider's test environment, and only then enable production after owner approval.

## Not yet verified
- No provider API key/token is available to this change.
- No official API endpoint or integration permission has been verified.
- No live SI engine call is made by this change; SI is not yet an active autonomous agent inside AION.

## Safety boundaries
SI may propose analysis and next steps. Financial transfers, token deployments, external messages, account changes, and publication require separate authorization and verified execution evidence.
