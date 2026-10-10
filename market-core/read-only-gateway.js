import { createAssetRegistry } from "./asset-registry.js";
import { normalizeMarketQuote } from "./quote-schema.js";

/**
 * Read-only market information service. It consumes explicitly supplied records;
 * it does not fetch provider data, place orders, mutate balances, or imply liquidity.
 */
export function createReadOnlyMarketGateway({ assets = [], quotes = [], now = Date.now(), maxLiveAgeMs } = {}) {
  const registry = createAssetRegistry(assets);
  if (!Array.isArray(quotes)) throw new TypeError("quotes must be an array");
  const normalizedQuotes = quotes.map(quote => normalizeMarketQuote(quote, { now, ...(maxLiveAgeMs === undefined ? {} : { maxLiveAgeMs }) }));
  const quoteByAsset = new Map();
  for (const quote of normalizedQuotes) {
    if (!registry.get(quote.assetId)) throw new Error("quote references an unknown assetId: " + quote.assetId);
    const previous = quoteByAsset.get(quote.assetId);
    if (previous && previous.receivedTimestamp === quote.receivedTimestamp && previous.providerId === quote.providerId) {
      throw new Error("duplicate quote event for asset and provider");
    }
    const list = quoteByAsset.get(quote.assetId) || [];
    list.push(quote);
    quoteByAsset.set(quote.assetId, list);
  }
  for (const list of quoteByAsset.values()) {
    list.sort((a, b) => b.receivedTimestamp - a.receivedTimestamp || a.providerId.localeCompare(b.providerId));
  }
  return Object.freeze({
    listAssets: () => registry.list(),
    getAsset: (assetId) => registry.get(assetId),
    getQuotes: (assetId) => {
      if (!registry.get(assetId)) return null;
      return Object.freeze([...(quoteByAsset.get(assetId) || [])]);
    },
    health: () => Object.freeze({
      status: "read-only",
      realDataBacked: false,
      assetCount: registry.size,
      quoteCount: normalizedQuotes.length,
      providerConnection: "not-configured",
      orderRouting: "disabled"
    })
  });
}
