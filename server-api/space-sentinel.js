import {
  SATELLITE_PROVIDER_CONFIG,
  satelliteProviderHealth
} from '../config/aion-satellite-providers.js';

const provider = SATELLITE_PROVIDER_CONFIG.sentinelHub;
const COLLECTIONS = SATELLITE_PROVIDER_CONFIG.collections;

function credentials() {
  const clientId = String(process.env.SENTINEL_HUB_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.SENTINEL_HUB_CLIENT_SECRET || '').trim();
  if (!clientId || !clientSecret) {
    throw new Error('Sentinel Hub credentials are not configured');
  }
  return { clientId, clientSecret };
}

async function token() {
  const c = credentials();
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: c.clientId,
    client_secret: c.clientSecret
  });
  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    throw new Error(
      'Sentinel Hub authentication failed: ' +
      (data?.error_description || data?.error || response.statusText)
    );
  }
  return data.access_token;
}

function bbox(value) {
  if (!Array.isArray(value) || value.length !== 4 || value.some(x => !Number.isFinite(Number(x)))) {
    throw new Error('bbox must be [minLon,minLat,maxLon,maxLat]');
  }
  const b = value.map(Number);
  if (b[0] < -180 || b[2] > 180 || b[1] < -90 || b[3] > 90 || b[0] >= b[2] || b[1] >= b[3]) {
    throw new Error('bbox bounds are invalid');
  }
  return b;
}

function times(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start >= end) {
    throw new Error('valid from/to ISO dates are required');
  }
  return { from: start.toISOString(), to: end.toISOString() };
}

function collection(value) {
  const selected = String(value || COLLECTIONS.sentinel2).trim();
  if (![COLLECTIONS.sentinel1, COLLECTIONS.sentinel2].includes(selected)) {
    throw new Error('unsupported satellite collection');
  }
  return selected;
}

async function requestJson(path, options = {}) {
  const accessToken = await token();
  const response = await fetch(provider.baseUrl + path, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + accessToken,
      Accept: 'application/json',
      ...(options.headers || {})
    }
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { raw }; }
  if (!response.ok) {
    throw new Error(
      'Sentinel Hub API ' + response.status + ': ' +
      (data?.error?.message || data?.message || data?.error || response.statusText)
    );
  }
  return data;
}

async function requestBinary(path, options = {}) {
  const accessToken = await token();
  const response = await fetch(provider.baseUrl + path, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + accessToken,
      ...(options.headers || {})
    }
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) {
    let message = response.statusText;
    try {
      const parsed = JSON.parse(bytes.toString('utf8'));
      message = parsed?.error?.message || parsed?.message || parsed?.error || message;
    } catch {}
    throw new Error('Sentinel Hub API ' + response.status + ': ' + message);
  }
  return {
    bytes,
    contentType: response.headers.get('content-type') || 'application/octet-stream'
  };
}

export function sentinelHubHealth() {
  return satelliteProviderHealth();
}

export async function searchSentinelCatalog({
  bbox: bb,
  from,
  to,
  collection: requestedCollection = COLLECTIONS.sentinel2,
  limit = 5
} = {}) {
  const b = bbox(bb);
  const t = times(from, to);
  const selectedCollection = collection(requestedCollection);
  const l = Math.max(1, Math.min(Number(limit) || 5, 100));

  return requestJson(provider.catalogPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bbox: b,
      datetime: t.from + '/' + t.to,
      collections: [selectedCollection],
      limit: l
    })
  });
}

function sentinel2Evalscript() {
  return `//VERSION=3
function setup() {
  return {
    input: [{ bands: ['B04', 'B03', 'B02', 'SCL', 'dataMask'] }],
    output: { bands: 4, sampleType: 'AUTO' }
  };
}
function evaluatePixel(sample) {
  if (sample.dataMask === 0) return [0, 0, 0, 0];
  const cloudOrShadow = [3, 8, 9, 10].includes(sample.SCL);
  if (cloudOrShadow) return [0.05, 0.05, 0.05, 0.15];
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02, 1];
}`;
}

function sentinel1Evalscript() {
  return `//VERSION=3
function setup() {
  return {
    input: ['VV', 'VH', 'dataMask'],
    output: { bands: 3, sampleType: 'AUTO' }
  };
}
function toDb(linear) {
  if (!linear || linear <= 0) return 0;
  return Math.max(0, Math.min(1, Math.log(linear) * 0.21714724095 + 1));
}
function evaluatePixel(sample) {
  if (sample.dataMask === 0) return [0, 0, 0];
  const vv = toDb(sample.VV);
  const vh = toDb(sample.VH);
  return [vv, vh, Math.max(0, Math.min(1, vv / Math.max(vh, 0.01) / 10))];
}`;
}

export async function processSentinelImage({
  bbox: bb,
  from,
  to,
  collection: requestedCollection = COLLECTIONS.sentinel2,
  width = 1024,
  height = 1024,
  maxCloudCoverage = 35
} = {}) {
  const b = bbox(bb);
  const t = times(from, to);
  const selectedCollection = collection(requestedCollection);
  const w = Math.max(64, Math.min(Number(width) || 1024, 2048));
  const h = Math.max(64, Math.min(Number(height) || 1024, 2048));
  const cloud = Math.max(0, Math.min(Number(maxCloudCoverage) || 35, 100));

  const dataFilter = { timeRange: t };
  const data = {
    type: selectedCollection,
    dataFilter
  };

  if (selectedCollection === COLLECTIONS.sentinel1) {
    data.processing = {
      orthorectify: 'true',
      backCoeff: 'GAMMA0_ELLIPSOID'
    };
  } else {
    dataFilter.maxCloudCoverage = cloud;
  }

  const evalscript = selectedCollection === COLLECTIONS.sentinel1
    ? sentinel1Evalscript()
    : sentinel2Evalscript();

  return requestBinary(provider.processPath, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'image/png'
    },
    body: JSON.stringify({
      input: {
        bounds: {
          properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
          bbox: b
        },
        data: [data]
      },
      output: {
        width: w,
        height: h,
        responses: [{ identifier: 'default', format: { type: 'image/png' } }]
      },
      evalscript
    })
  });
}

export async function runSentinelMission(input = {}) {
  const catalog = await searchSentinelCatalog(input);
  const image = await processSentinelImage(input);
  return {
    provider: provider.id,
    source: 'Copernicus Data Space Ecosystem',
    mock: false,
    evidence: {
      catalogFeatures: Array.isArray(catalog?.features) ? catalog.features.length : 0,
      collection: input.collection || COLLECTIONS.sentinel2,
      bbox: input.bbox,
      from: input.from,
      to: input.to,
      imageContentType: image.contentType,
      imageBytes: image.bytes.length
    },
    image: image.bytes
  };
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.AION_PUBLIC_ORIGIN || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const path = new URL(req.url || '/', 'http://aion.local').searchParams.get('path') || 'health';

  try {
    if (req.method === 'GET' && path === 'health') {
      return res.status(200).json({ success: true, ...sentinelHubHealth() });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const input = await readBody(req);

    if (path === 'catalog') {
      const result = await searchSentinelCatalog(input);
      return res.status(200).json({
        success: true,
        provider: provider.id,
        source: 'Copernicus Data Space Ecosystem',
        mock: false,
        catalog: result
      });
    }

    if (path === 'process') {
      const result = await processSentinelImage(input);
      res.statusCode = 200;
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('X-AION-Satellite-Provider', provider.id);
      res.setHeader('X-AION-Satellite-Collection', collection(input.collection));
      return res.end(result.bytes);
    }

    if (path === 'mission') {
      const result = await runSentinelMission(input);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-AION-Satellite-Provider', result.provider);
      res.setHeader('X-AION-Satellite-Image-Bytes', String(result.evidence.imageBytes));
      return res.end(result.image);
    }

    return res.status(404).json({ success: false, error: 'Unknown satellite route' });
  } catch (error) {
    return res.status(400).json({ success: false, error: String(error?.message || error) });
  }
}
