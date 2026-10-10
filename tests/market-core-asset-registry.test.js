import test from "node:test";
import assert from "node:assert/strict";
import { createAssetRegistry, normalizeAssetRecord } from "../market-core/asset-registry.js";

const btc = (overrides = {}) => ({
  assetId: "crypto:btc:bitcoin-mainnet",
  assetClass: "crypto",
  symbol: "BTC",
  quoteCurrency: "USD",
  network: "Bitcoin mainnet",
  jurisdictionAvailability: ["GB", "GB", "CH"],
  riskLabels: ["volatile", "crypto-asset"],
  ...overrides
});

test("normalizes metadata and keeps tradability disabled by default", () => {
  const asset = normalizeAssetRecord(btc());
  assert.equal(asset.assetId, "crypto:btc:bitcoin-mainnet");
  assert.equal(asset.tradable, false);
  assert.deepEqual(asset.jurisdictionAvailability, ["CH", "GB"]);
  assert.equal(Object.isFrozen(asset), true);
  assert.equal(Object.isFrozen(asset.riskLabels), true);
});

test("rejects missing identity, unknown classes, noncanonical symbols, and bad currencies", () => {
  assert.throws(() => normalizeAssetRecord(btc({ assetId: " " })), /assetId/);
  assert.throws(() => normalizeAssetRecord(btc({ assetClass: "exchange" })), /unsupported assetClass/);
  assert.throws(() => normalizeAssetRecord(btc({ symbol: "btc" })), /uppercase/);
  assert.throws(() => normalizeAssetRecord(btc({ quoteCurrency: "USDT" })), /quoteCurrency/);
});

test("requires jurisdiction metadata and valid risk labels", () => {
  assert.throws(() => normalizeAssetRecord(btc({ jurisdictionAvailability: [] })), /jurisdictionAvailability/);
  assert.throws(() => normalizeAssetRecord(btc({ riskLabels: [""] })), /riskLabels/);
});

test("catalogue lookup is deterministic and duplicate IDs are rejected", () => {
  const registry = createAssetRegistry([btc(), btc({ assetId: "crypto:eth:ethereum-mainnet", symbol: "ETH" })]);
  assert.equal(registry.size, 2);
  assert.equal(registry.get("crypto:btc:bitcoin-mainnet").tradable, false);
  assert.deepEqual(registry.list().map(asset => asset.assetId), ["crypto:btc:bitcoin-mainnet", "crypto:eth:ethereum-mainnet"]);
  assert.equal(registry.get("missing"), null);
  assert.throws(() => createAssetRegistry([btc(), btc()]), /duplicate assetId/);
});
