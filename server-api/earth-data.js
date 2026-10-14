const SOURCES = Object.freeze({
  nasaEvents: {
    id: 'nasa-eonet',
    name: 'NASA Earth Observatory Natural Event Tracker',
    url: 'https://eonet.gsfc.nasa.gov/api/v3/events'
  },
  noaaSpaceWeather: {
    id: 'noaa-swpc',
    name: 'NOAA Space Weather Prediction Center',
    url: 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json'
  },
  copernicusCatalog: {
    id: 'copernicus-stac',
    name: 'Copernicus Data Space STAC catalogue',
    url: 'https://stac.dataspace.copernicus.eu/v1/search'
  }
});

const REQUEST_TIMEOUT_MS = 9000;
const DEFAULT_BBOX = [-180, -90, 180, 90];

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Accept: 'application/json, application/geo+json',
      ...(options.headers || {})
    }
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; }
  catch { throw new Error('Provider returned invalid JSON'); }
  if (!response.ok) {
    throw new Error('Provider HTTP ' + response.status);
  }
  return data;
}

function validBbox(value) {
  if (!Array.isArray(value) || value.length !== 4 || value.some(v => !Number.isFinite(Number(v)))) {
    throw new Error('bbox must be [minLon,minLat,maxLon,maxLat]');
  }
  const bbox = value.map(Number);
  if (bbox[0] < -180 || bbox[2] > 180 || bbox[1] < -90 || bbox[3] > 90 ||
      bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) {
    throw new Error('bbox bounds are invalid');
  }
  return bbox;
}

function eventSummary(event) {
  const geometry = Array.isArray(event.geometry) && event.geometry.length
    ? event.geometry[event.geometry.length - 1]
    : null;
  return {
    id: event.id || null,
    title: event.title || 'Untitled event',
    categories: Array.isArray(event.categories)
      ? event.categories.map(item => item.title || item.id).filter(Boolean)
      : [],
    latestDate: geometry?.date || null,
    geometryType: geometry?.type || null,
    coordinates: geometry?.coordinates || null,
    sourceUrl: event.link || null
  };
}

export async function fetchNasaEvents() {
  const url = new URL(SOURCES.nasaEvents.url);
  url.searchParams.set('status', 'open');
  url.searchParams.set('days', '30');
  url.searchParams.set('limit', '25');
  const data = await fetchJson(url.toString());
  const events = Array.isArray(data?.events) ? data.events : [];
  return {
    provider: SOURCES.nasaEvents.name,
    source: SOURCES.nasaEvents.url,
    retrievedAt: new Date().toISOString(),
    count: events.length,
    events: events.map(eventSummary)
  };
}

export async function fetchNoaaSpaceWeather() {
  const data = await fetchJson(SOURCES.noaaSpaceWeather.url);
  const rows = Array.isArray(data) ? data : [data];
  return {
    provider: SOURCES.noaaSpaceWeather.name,
    source: SOURCES.noaaSpaceWeather.url,
    retrievedAt: new Date().toISOString(),
    measurements: rows.slice(0, 10)
  };
}

export async function searchCopernicusMetadata(input = {}) {
  const bbox = input.bbox === undefined ? DEFAULT_BBOX : validBbox(input.bbox);
  const limit = Math.max(1, Math.min(Number(input.limit) || 10, 20));
  const toDate = input.to ? new Date(input.to) : new Date();
  const fromDate = input.from ? new Date(input.from) : new Date(toDate.valueOf() - 30 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(fromDate.valueOf()) || Number.isNaN(toDate.valueOf()) || fromDate >= toDate) {
    throw new Error('valid from/to dates are required');
  }
  const query = {
    collections: ['ccm-optical'],
    bbox,
    datetime: fromDate.toISOString() + '/' + toDate.toISOString(),
    limit
  };
  const data = await fetchJson(SOURCES.copernicusCatalog.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });
  const features = Array.isArray(data?.features) ? data.features : [];
  return {
    provider: SOURCES.copernicusCatalog.name,
    source: SOURCES.copernicusCatalog.url,
    retrievedAt: new Date().toISOString(),
    collection: 'ccm-optical',
    query: { bbox, datetime: query.datetime, limit },
    count: features.length,
    items: features.map(item => ({
      id: item.id || null,
      title: item.properties?.title || item.id || 'Copernicus catalogue item',
      acquiredAt: item.properties?.datetime || item.properties?.start_datetime || null,
      platform: item.properties?.platform || item.properties?.constellation || null,
      bbox: item.bbox || null,
      thumbnail: item.assets?.thumbnail?.href || null,
      itemUrl: item.links?.find(link => link.rel === 'self')?.href || null
    }))
  };
}

async function captureSource(provider, operation) {
  try {
    return { status: 'ok', ...await operation() };
  } catch (error) {
    return {
      status: 'unavailable',
      provider,
      checkedAt: new Date().toISOString(),
      error: String(error?.message || error).slice(0, 180)
    };
  }
}

export async function fetchEarthOverview(catalogOptions = {}) {
  const [events, spaceWeather, satelliteCatalog] = await Promise.all([
    captureSource(SOURCES.nasaEvents.name, fetchNasaEvents),
    captureSource(SOURCES.noaaSpaceWeather.name, fetchNoaaSpaceWeather),
    captureSource(SOURCES.copernicusCatalog.name, () => searchCopernicusMetadata(catalogOptions))
  ]);
  const results = [events, spaceWeather, satelliteCatalog];
  const available = results.filter(result => result.status === 'ok').length;
  return {
    success: available > 0,
    status: available === results.length ? 'ok' : available > 0 ? 'partial' : 'unavailable',
    mode: 'free-public-data',
    generatedAt: new Date().toISOString(),
    availableSources: available,
    totalSources: results.length,
    sources: { events, spaceWeather, satelliteCatalog }
  };
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.AION_PUBLIC_ORIGIN || 'https://aion-production-fbf3.up.railway.app');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = new URL(req.url || '/', 'http://aion.local');
  const path = url.searchParams.get('path') || 'overview';
  const input = req.body && typeof req.body === 'object' ? req.body : {};

  try {
    if (req.method === 'GET' && path === 'health') {
      return res.status(200).json({
        success: true,
        mode: 'free-public-data',
        liveOnDemand: true,
        credentialsRequired: false,
        providers: Object.values(SOURCES).map(provider => ({
          id: provider.id,
          name: provider.name,
          endpoint: provider.url
        }))
      });
    }
    if (req.method === 'GET' && path === 'events') {
      return res.status(200).json({ success: true, ...(await fetchNasaEvents()) });
    }
    if (req.method === 'GET' && path === 'space-weather') {
      return res.status(200).json({ success: true, ...(await fetchNoaaSpaceWeather()) });
    }
    if (['GET', 'POST'].includes(req.method) && path === 'catalog') {
      const catalog = await searchCopernicusMetadata(input);
      return res.status(200).json({ success: true, ...catalog });
    }
    if (['GET', 'POST'].includes(req.method) && path === 'overview') {
      return res.status(200).json(await fetchEarthOverview(input));
    }
    return res.status(path === 'health' || path === 'events' || path === 'space-weather' || path === 'catalog' || path === 'overview' ? 405 : 404)
      .json({ success: false, error: 'Unsupported method or unknown earth-data path' });
  } catch (error) {
    const message = String(error?.message || error);
    return res.status(message.startsWith('bbox ') || message.startsWith('valid from/to') ? 400 : 502)
      .json({ success: false, error: message });
  }
}
