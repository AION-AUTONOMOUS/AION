# AION Market Gateway — Read-Only Foundation

Status: design specification for a non-production, read-only market-information layer. This does not enable brokerage, exchange, custody, settlement, or investment advice.

## Product goal
AION's differentiator is a provenance-first, multi-provider market gateway: one consistent catalogue for assets and market data, with explicit freshness, source attribution, and a hard boundary between information and execution.

## Initial capabilities
- Asset catalogue: stable internal asset ID, asset class, canonical symbol, network/issuer where applicable, quote currency, jurisdiction availability, and risk labels.
- Market-data adapters: provider-specific connectors normalized into a common quote schema without hiding the original source.
- Freshness controls: every quote records provider, source timestamp, received timestamp, currency, unit, and live/delayed/indicative status.
- Data-quality checks: reject malformed prices, non-finite values, unsupported currencies, stale observations, and conflicting duplicate provider events.
- Read-only API: browse assets, retrieve quotes, view source metadata, and manage watchlists. No endpoint places or routes an order.
- Auditability: log provider errors and data-quality rejections without logging secrets or unnecessary personal data.

## Canonical quote contract
Required fields: providerId, assetId, priceMinor or a documented decimal representation, quoteCurrency, sourceTimestamp, receivedTimestamp, freshnessStatus, and dataLicenseRef.

Rules:
- Never combine values from different currencies without an explicit, timestamped FX conversion.
- Never label delayed or indicative data as live.
- A quote is informational, not an executable price or a promise of liquidity.
- Keep provider payload provenance so normalized values can be traced back to their source.
- If the source is stale or unavailable, show that state instead of silently substituting a fabricated or cached-as-live quote.

## Future order-routing boundary
Order placement must be a separate capability and disabled by default. It may only be enabled per asset class, jurisdiction, and licensed provider after legal review, partner authorization, customer eligibility controls, risk limits, explicit customer confirmation, provider execution acknowledgement, and reconciliation are all evidenced.

An order intent is not an order accepted; an accepted order is not an execution; an execution is not settlement. The UI and ledger must preserve those distinctions.

## Security and operational controls
- Server-side provider credentials only; never expose API secrets to browser code.
- Per-provider timeouts, bounded retries, rate limits, circuit breaking, and clear degraded states.
- Least-privilege access, change audit trail, dependency review, and secret rotation.
- No financial balance changes in market-data adapters.
- No unverified market prices in customer-facing claims.

## Acceptance checklist
- Unit tests for normalization, missing fields, invalid values, timestamps, stale data, and currency mismatch.
- Contract tests using provider sandbox or fixtures clearly marked as fixtures.
- API tests prove read-only endpoints cannot create orders, transfer funds, or change ledger balances.
- UI clearly distinguishes live, delayed, indicative, unavailable, and fixture data.
- A disabled-by-default order-routing feature flag is enforced server-side, not just hidden in the UI.
- Production enablement requires data-provider licensing, security review, jurisdiction-specific legal review, and a documented rollback plan.

## Suggested implementation order
1. Define the asset registry and quote schema.
2. Add schema validation and deterministic normalization tests.
3. Implement one read-only provider adapter with clear source attribution.
4. Add freshness monitoring and operational dashboards.
5. Build watchlists and customer-facing read-only views.
6. Evaluate each future executable product separately; do not enable order routing as a side effect of adding a data provider.