# Adyen Standard notifications — test-only integration

This endpoint is intentionally limited to Adyen **test** checkout. It does not enable live charging.

## Required environment

- `REDIS_URL`: Railway Redis, used as durable storage. The handler fails closed without it.
- `ADYEN_HMAC_KEY`: Standard webhook HMAC key (hex).
- `ADYEN_MERCHANT_ACCOUNT`: exact Adyen merchant account name.
- `ADYEN_API_KEY` and `ADYEN_CLIENT_KEY`: test checkout session creation.
- `AION_PUBLIC_ORIGIN`: public site origin used for checkout return URLs.

Configure the Adyen Standard webhook URL to the deployed serverless route for
`server-api/adyen/handle-notification.js` (normally `/api/adyen/handle-notification` in this deployment layout).

## Processing rules

1. Test checkout persists an `awaiting-payment` order to Redis before creating a session.
2. The webhook verifies the Standard HMAC, exact merchant account, order reference,
   expected amount and currency. Only successful `AUTHORISATION` events can recognize revenue.
3. Revenue is written under a deterministic key derived from the Adyen PSP reference using
   `SET NX`; duplicate deliveries cannot create a second ledger entry.
4. The ledger is written before the order is marked paid. If the order write fails, a provider
   retry reuses and verifies the same ledger entry, then repairs the order.
5. Any missing configuration, missing order, signature mismatch, or storage failure is not
   acknowledged as successful. No in-memory fallback is used for these financial writes.

## Still required before any live release

- Run CI and staging end-to-end tests against Adyen test credentials and the deployed webhook.
- Verify webhook retry, concurrent duplicate delivery, Redis outage, amount/currency mismatch,
  wrong merchant, invalid HMAC, and order/ledger reconciliation.
- Confirm Adyen dashboard webhook URL and HMAC key are configured by an authorized account owner.
- Independently review refunds, cancellations, disputes, retention, privacy, and tax handling.

Do not switch this route or session endpoint to live mode until the release gate is approved.
