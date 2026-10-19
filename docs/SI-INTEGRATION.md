# AION × SI — Technical Integration Gate

## Objective
Provide a discoverable AION entry point to the intended SI provider and prepare a secure server-side integration without claiming that an API connection is already active.

## Current deliverable
- `si.html` is a portal page linking to the SI website and the AION repository.
- It explicitly distinguishes an external link from a working provider integration.

## Required before live integration
1. Confirm the exact SI provider and official developer documentation/domain.
2. Obtain provider-issued API access through the provider's own account/console. Never commit tokens or paste them into chat.
3. Confirm permitted use, pricing/rate limits, data retention, and whether customer/company data may be sent.
4. Implement a server-side adapter only (never expose provider credentials to browser JavaScript).
5. Add request validation, timeouts, rate limits, redacted logs, and a feature flag defaulting to off.
6. Add tests with mocked provider responses and verify error handling, authentication failures, and data minimization.
7. Deploy to a staging environment, verify end-to-end, and only then enable production after owner approval.

## Not yet verified
- No provider API key/token is available to this change.
- No confirmed API endpoint or integration permission has been supplied.
- Therefore this change does not call the SI model and does not represent SI as an active autonomous agent inside AION.

## Safety boundaries
SI may propose analysis and next steps. Financial transfers, token deployments, external messages, account changes, and publication require separate authorization and verified execution evidence.
