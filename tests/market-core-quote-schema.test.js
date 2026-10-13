import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMarketQuote } from "../market-core/quote-schema.js";

const NOW = 1_800_000_000_000;
const quote = (overrides = {}) => ({
  providerId: "fixture-provider",
  assetId: "btc-usd",
  priceMinor: 6_750_000,
  quoteCurrency: "USD",
  sourceTimestamp: NOW - 5_000,
  receivedTimestamp: NOW - 4_000,
  freshnessStatus: "live",
  dataLicenseRef: "fixture-license",
  ...overrides
});

test("normalizes a valid live quote without adding execution behavior", () => {
  const result = normalizeMarketQuote(quote(), { now: NOW });
  assert.equal(result.assetId, "btc-usd");
  assert.equal(result.priceMinor, 6_750_000);
  assert.equal(result.freshnessStatus, "live");
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(Object.keys(result), [
    "providerId", "assetId", "priceMinor", "quoteCurrency", "sourceTimestamp",
    "receivedTimestamp", "freshnessStatus", "dataLicenseRef"
  ]);
});

test("rejects invalid prices, currencies, and missing provenance", () => {
  assert.throws(() => normalizeMarketQuote(quote({ priceMinor: -1 }), { now: NOW }), /priceMinor/);
  assert.throws(() => normalizeMarketQuote(quote({ priceMinor: 1.5 }), { now: NOW }), /priceMinor/);
  assert.throws(() => normalizeMarketQuote(quote({ quoteCurrency: "usd" }), { now: NOW }), /quoteCurrency/);
  assert.throws(() => normalizeMarketQuote(quote({ providerId: "  " }), { now: NOW }), /providerId/);
  assert.throws(() => normalizeMarketQuote(quote({ dataLicenseRef: "" }), { now: NOW }), /dataLicenseRef/);
});

test("rejects invalid timestamps and receive-before-source ordering", () => {
  assert.throws(() => normalizeMarketQuote(quote({ sourceTimestamp: NaN }), { now: NOW }), /sourceTimestamp/);
  assert.throws(() => normalizeMarketQuote(quote({ receivedTimestamp: NOW - 6_000 }), { now: NOW }), /cannot precede/);
});

test("rejects stale or future-dated quotes labeled live", () => {
  assert.throws(() => normalizeMarketQuote(quote({ sourceTimestamp: NOW - 120_000, receivedTimestamp: NOW - 119_000 }), { now: NOW }), /stale/);
  assert.throws(() => normalizeMarketQuote(quote({ sourceTimestamp: NOW + 1_000, receivedTimestamp: NOW + 2_000 }), { now: NOW }), /future/);
});

test("accepts delayed and indicative quotes without labeling them live", () => {
  assert.equal(normalizeMarketQuote(quote({ freshnessStatus: "delayed", sourceTimestamp: NOW - 3_600_000 }), { now: NOW }).freshnessStatus, "delayed");
  assert.equal(normalizeMarketQuote(quote({ freshnessStatus: "indicative", sourceTimestamp: NOW - 3_600_000 }), { now: NOW }).freshnessStatus, "indicative");
  assert.throws(() => normalizeMarketQuote(quote({ freshnessStatus: "guaranteed" }), { now: NOW }), /freshnessStatus/);
});
