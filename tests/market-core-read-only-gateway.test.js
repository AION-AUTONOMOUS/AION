import test from "node:test";
import assert from "node:assert/strict";
import { createReadOnlyMarketGateway } from "../market-core/read-only-gateway.js";

const NOW = 1_800_000_000_000;
const asset = {
  assetId: "crypto:btc:bitcoin-mainnet", assetClass: "crypto", symbol: "BTC", quoteCurrency: "USD",
  jurisdictionAvailability: ["GB"], riskLabels: ["high-volatility"]
};
const quote = (overrides = {}) => ({
  providerId: "fixture-provider", assetId: asset.assetId, priceMinor: 12345, quoteCurrency: "USD",
  sourceTimestamp: NOW - 1000, receivedTimestamp: NOW - 500, freshnessStatus: "live", dataLicenseRef: "fixture-only",
  ...overrides
});

test("serves supplied assets and quotes through read-only methods", () => {
  const gateway = createReadOnlyMarketGateway({ assets: [asset], quotes: [quote()], now: NOW });
  assert.equal(gateway.listAssets().length, 1);
  assert.equal(gateway.getAsset(asset.assetId).tradable, false);
  assert.equal(gateway.getQuotes(asset.assetId)[0].priceMinor, 12345);
  assert.equal(gateway.getQuotes("unknown"), null);
  assert.deepEqual(gateway.health(), {
    status: "read-only", realDataBacked: false, assetCount: 1, quoteCount: 1,
    providerConnection: "not-configured", orderRouting: "disabled"
  });
  assert.equal("placeOrder" in gateway, false);
  assert.equal("transferFunds" in gateway, false);
});

test("rejects quotes for assets absent from the catalogue", () => {
  assert.throws(() => createReadOnlyMarketGateway({ assets: [asset], quotes: [quote({ assetId: "unknown" })], now: NOW }), /unknown assetId/);
});

test("rejects duplicate same-provider quote events with the same receive timestamp", () => {
  assert.throws(() => createReadOnlyMarketGateway({ assets: [asset], quotes: [quote(), quote()], now: NOW }), /duplicate quote event/);
});

test("keeps stale data labeled delayed rather than live", () => {
  const gateway = createReadOnlyMarketGateway({ assets: [asset], quotes: [quote({ sourceTimestamp: NOW - 3_600_000, receivedTimestamp: NOW - 3_599_000, freshnessStatus: "delayed" })], now: NOW });
  assert.equal(gateway.getQuotes(asset.assetId)[0].freshnessStatus, "delayed");
});
