import { createReadOnlyMarketGateway } from '../market-core/read-only-gateway.js';

/**
 * Read-only market API boundary.
 * No fixture data or client-submitted prices are accepted as market truth.
 * A future provider adapter must be explicitly configured server-side before
 * this endpoint serves assets or quotes.
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  // Cross-origin browser access is opt-in. Never reflect arbitrary origins and
  // never use a wildcard; configure the exact public origin at deployment.
  const requestOrigin = req.headers?.origin;
  const configuredOrigin = process.env.AION_PUBLIC_ORIGIN;
  if (requestOrigin) {
    if (!configuredOrigin || requestOrigin !== configuredOrigin) {
      return res.status(403).json({ success: false, error: 'origin_not_allowed' });
    }
    res.setHeader('Access-Control-Allow-Origin', configuredOrigin);
  }

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ success: false, error: 'method_not_allowed' });
  }

  const url = new URL(req.url || '/', 'http://aion.local');
  const path = url.searchParams.get('path') || 'health';

  // Deliberately do not load prices from query/body or fabricate demo quotes.
  // Provider integration is considered configured only when an explicit
  // server-side adapter module is provided; credentials alone are not enough.
  const providerAdapter = process.env.AION_MARKET_PROVIDER_ADAPTER;
  if (!providerAdapter) {
    const health = {
      status: 'provider_not_configured',
      realDataBacked: false,
      providerConnection: 'not-configured',
      orderRouting: 'disabled',
      tradingEnabled: false
    };
    if (path === 'health') return res.status(200).json({ success: true, market: health });
    if (['assets', 'asset', 'quotes'].includes(path)) {
      return res.status(503).json({ success: false, error: 'market_data_provider_not_configured', market: health });
    }
    return res.status(404).json({ success: false, error: 'unknown_market_path' });
  }

  // Import only a deployment-owned module path; never accept a module name from
  // the request. The adapter contract must return { assets, quotes, now? }.
  try {
    const adapterModule = await import('../market-providers/configured-adapter.js');
    const supplied = await adapterModule.loadMarketSnapshot();
    const gateway = createReadOnlyMarketGateway(supplied);
    if (path === 'health') return res.status(200).json({ success: true, market: gateway.health() });
    if (path === 'assets') return res.status(200).json({ success: true, assets: gateway.listAssets() });
    if (path === 'asset') {
      const asset = gateway.getAsset(url.searchParams.get('id'));
      return asset ? res.status(200).json({ success: true, asset }) : res.status(404).json({ success: false, error: 'asset_not_found' });
    }
    if (path === 'quotes') {
      const assetId = String(url.searchParams.get('assetId') || '');
      const quotes = gateway.getQuotes(assetId);
      return quotes === null
        ? res.status(404).json({ success: false, error: 'asset_not_found' })
        : res.status(200).json({ success: true, assetId, quotes });
    }
    return res.status(404).json({ success: false, error: 'unknown_market_path' });
  } catch (error) {
    // Keep upstream details and credentials out of public responses.
    return res.status(503).json({ success: false, error: 'market_data_temporarily_unavailable' });
  }
}
