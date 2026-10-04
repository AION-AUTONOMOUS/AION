export const SATELLITE_PROVIDER_CONFIG = Object.freeze({
  sentinelHub: {
    id: 'sentinel-hub',
    name: 'Copernicus Data Space / Sentinel Hub',
    tokenUrl: 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
    baseUrl: 'https://sh.dataspace.copernicus.eu',
    processPath: '/process/v1',
    catalogPath: '/catalog/v1/search',
    credentials: ['SENTINEL_HUB_CLIENT_ID', 'SENTINEL_HUB_CLIENT_SECRET']
  },
  collections: Object.freeze({
    sentinel2: 'sentinel-2-l2a',
    sentinel1: 'sentinel-1-grd'
  })
});

export function satelliteProviderHealth() {
  const p = SATELLITE_PROVIDER_CONFIG.sentinelHub;
  const collections = SATELLITE_PROVIDER_CONFIG.collections;
  const configured = Boolean(
    String(process.env.SENTINEL_HUB_CLIENT_ID || '').trim() &&
    String(process.env.SENTINEL_HUB_CLIENT_SECRET || '').trim()
  );
  return {
    provider: p.id,
    name: p.name,
    configured,
    execution: configured ? 'ready-for-live-provider-api' : 'authorization-gated',
    dataSource: 'Copernicus Data Space Ecosystem',
    mock: false,
    supportedCollections: Object.values(collections)
  };
}
