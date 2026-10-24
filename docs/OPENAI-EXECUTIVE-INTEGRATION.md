# AION — OpenAI Executive API Integration

## Scope
This change adds a server-side adapter for the official OpenAI Responses API. It is a foundation for AION's own decision-support workflow; it is **not** a connection to TheSuperIntelligence.SI and does not itself grant autonomous control over GitHub, Railway, finance, or other services.

## Default state
The adapter is disabled unless `AION_OPENAI_ENABLED=true`. It also requires `OPENAI_API_KEY` and `OPENAI_MODEL`. No secret is stored in source control and no request is made at startup.

## Safe test procedure
1. Configure the key as a server-side environment secret only; never put it in browser code or commit it.
2. Select an allowed model in `OPENAI_MODEL` and confirm any applicable billing/usage limits first.
3. Keep `AION_OPENAI_ENABLED` unset or false until an authorized, low-risk test is ready.
4. Run a non-sensitive test prompt and verify the returned text and response ID.
5. Test missing credentials, disabled mode, invalid input, timeout, and provider error handling before any production use.

## Guardrails
- Server-side HTTPS request to `https://api.openai.com/v1/responses`.
- Integration is disabled by default.
- Request input is limited to 20,000 characters.
- Request timeout is capped at 30 seconds.
- Errors do not include credentials or provider response bodies.
- This adapter only returns analysis text. It does not execute tools, publish code, deploy contracts, transfer funds, or send external messages.
- OpenAI API usage may incur charges. Do not enable it until the account owner has approved applicable spending.

## Not yet verified
No live API call has been made by this code change. Successful integration requires a valid server-side API key, a permitted model, deployment configuration, and a successful test request. OpenAI API credentials are separate from a ChatGPT subscription.

Official references:
- https://developers.openai.com/api/docs/quickstart
- https://developers.openai.com/api/reference/overview
