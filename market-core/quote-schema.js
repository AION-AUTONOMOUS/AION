const ALLOWED_FRESHNESS = new Set(["live", "delayed", "indicative"]);
const DEFAULT_MAX_LIVE_AGE_MS = 60_000;

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(field + " must be a non-blank string");
  }
  return value.trim();
}

/**
 * Validate and normalize a provider quote for display/analysis only.
 * This module never places orders, changes balances, or implies execution.
 * Timestamps are Unix epoch milliseconds; prices are integer minor units.
 */
export function normalizeMarketQuote(input, { now = Date.now(), maxLiveAgeMs = DEFAULT_MAX_LIVE_AGE_MS } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("quote must be an object");
  }
  const providerId = requiredText(input.providerId, "providerId");
  const assetId = requiredText(input.assetId, "assetId");
  const dataLicenseRef = requiredText(input.dataLicenseRef, "dataLicenseRef");
  if (!Number.isSafeInteger(input.priceMinor) || input.priceMinor < 0) {
    throw new TypeError("priceMinor must be a non-negative safe integer");
  }
  if (typeof input.quoteCurrency !== "string" || !/^[A-Z]{3}$/.test(input.quoteCurrency)) {
    throw new TypeError("quoteCurrency must be an uppercase ISO-style code");
  }
  for (const field of ["sourceTimestamp", "receivedTimestamp"]) {
    if (!Number.isSafeInteger(input[field]) || input[field] <= 0) {
      throw new TypeError(field + " must be a positive Unix epoch millisecond integer");
    }
  }
  if (input.receivedTimestamp < input.sourceTimestamp) {
    throw new TypeError("receivedTimestamp cannot precede sourceTimestamp");
  }
  if (!Number.isSafeInteger(now) || now <= 0 || !Number.isSafeInteger(maxLiveAgeMs) || maxLiveAgeMs < 0) {
    throw new TypeError("now and maxLiveAgeMs must be valid non-negative safe integers");
  }
  if (!ALLOWED_FRESHNESS.has(input.freshnessStatus)) {
    throw new TypeError("freshnessStatus must be live, delayed, or indicative");
  }
  const ageMs = now - input.sourceTimestamp;
  if (input.freshnessStatus === "live" && (ageMs < 0 || ageMs > maxLiveAgeMs)) {
    throw new Error("live quote is stale or has a future source timestamp");
  }
  return Object.freeze({
    providerId,
    assetId,
    priceMinor: input.priceMinor,
    quoteCurrency: input.quoteCurrency,
    sourceTimestamp: input.sourceTimestamp,
    receivedTimestamp: input.receivedTimestamp,
    freshnessStatus: input.freshnessStatus,
    dataLicenseRef
  });
}
