const ALLOWED_CLASSES = new Set([
  "crypto", "equity", "bond", "fund", "fx", "commodity", "index", "other"
]);

function nonBlank(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(field + " must be a non-blank string");
  }
  return value.trim();
}

/** Validate a catalogue record. This is descriptive metadata, not a listing or trading approval. */
export function normalizeAssetRecord(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("asset record must be an object");
  }
  const assetId = nonBlank(input.assetId, "assetId");
  const assetClass = nonBlank(input.assetClass, "assetClass");
  if (!ALLOWED_CLASSES.has(assetClass)) throw new TypeError("unsupported assetClass");
  const symbol = nonBlank(input.symbol, "symbol");
  if (symbol !== symbol.toUpperCase()) throw new TypeError("symbol must be uppercase canonical text");
  const quoteCurrency = nonBlank(input.quoteCurrency, "quoteCurrency");
  if (!/^[A-Z]{3}$/.test(quoteCurrency)) throw new TypeError("quoteCurrency must be an uppercase ISO-style code");
  const jurisdictionAvailability = input.jurisdictionAvailability;
  if (!Array.isArray(jurisdictionAvailability) || jurisdictionAvailability.length === 0 ||
      jurisdictionAvailability.some(value => typeof value !== "string" || value.trim().length === 0)) {
    throw new TypeError("jurisdictionAvailability must be a non-empty array of non-blank strings");
  }
  const riskLabels = input.riskLabels;
  if (!Array.isArray(riskLabels) || riskLabels.some(value => typeof value !== "string" || value.trim().length === 0)) {
    throw new TypeError("riskLabels must be an array of non-blank strings");
  }
  const normalized = {
    assetId,
    assetClass,
    symbol,
    quoteCurrency,
    jurisdictionAvailability: [...new Set(jurisdictionAvailability.map(value => value.trim()))].sort(),
    riskLabels: [...new Set(riskLabels.map(value => value.trim()))].sort(),
    tradable: false
  };
  if (input.network !== undefined) normalized.network = nonBlank(input.network, "network");
  if (input.issuer !== undefined) normalized.issuer = nonBlank(input.issuer, "issuer");
  return Object.freeze({
    ...normalized,
    jurisdictionAvailability: Object.freeze(normalized.jurisdictionAvailability),
    riskLabels: Object.freeze(normalized.riskLabels)
  });
}

/** Build a deterministic, duplicate-safe in-memory catalogue from supplied records. */
export function createAssetRegistry(records = []) {
  if (!Array.isArray(records)) throw new TypeError("asset records must be an array");
  const byId = new Map();
  for (const record of records) {
    const asset = normalizeAssetRecord(record);
    if (byId.has(asset.assetId)) throw new Error("duplicate assetId: " + asset.assetId);
    byId.set(asset.assetId, asset);
  }
  return Object.freeze({
    list: () => [...byId.values()].sort((a, b) => a.assetId.localeCompare(b.assetId)),
    get: (assetId) => byId.get(assetId) ?? null,
    size: byId.size
  });
}
