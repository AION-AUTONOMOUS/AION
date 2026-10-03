const BASE_URL = process.env.PLANET_TASKING_BASE_URL || 'https://api.planet.com/tasking/v2';
const API_KEY = String(process.env.PLANET_API_KEY || '').trim();
const LIVE_EXECUTION = String(process.env.AION_SPACE_LIVE_EXECUTION || '').toLowerCase() === 'true';

function jsonHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'api-key ' + API_KEY
  };
}

function requireConfigured() {
  if (!API_KEY) throw new Error('PLANET_API_KEY is not configured');
}

function requireLiveExecution() {
  requireConfigured();
  if (!LIVE_EXECUTION) {
    throw new Error('Live Planet tasking is disabled; set AION_SPACE_LIVE_EXECUTION=true only after authorized commercial access is confirmed');
  }
}

async function request(path, options = {}) {
  requireConfigured();
  const response = await fetch(BASE_URL.replace(/\\/$/, '') + path, {
    ...options,
    headers: { ...jsonHeaders(), ...(options.headers || {}) }
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { raw }; }
  if (!response.ok) {
    const detail = data?.message || data?.detail || data?.error || response.statusText;
    throw new Error(`Planet Tasking API ${response.status}: ${detail}`);
  }
  return data;
}

export function planetTaskingHealth() {
  return {
    provider: 'planet',
    apiBaseUrl: BASE_URL,
    configured: Boolean(API_KEY),
    liveExecutionEnabled: LIVE_EXECUTION,
    execution: API_KEY && LIVE_EXECUTION ? 'live-provider-api' : 'authorization-gated',
    directSatelliteCommand: false,
    requiresCommercialAuthorization: true
  };
}

export async function listPlanetOrders() {
  return request('/orders/');
}

export async function getPlanetOrder(orderId) {
  const id = String(orderId || '').trim();
  if (!id) throw new Error('orderId required');
  return request('/orders/' + encodeURIComponent(id));
}

export async function previewPlanetPricing(orderPayload) {
  if (!orderPayload || typeof orderPayload !== 'object') throw new Error('order payload required');
  return request('/pricing/', { method: 'POST', body: JSON.stringify(orderPayload) });
}

export async function createPlanetTaskingOrder(orderPayload) {
  requireLiveExecution();
  if (!orderPayload || typeof orderPayload !== 'object') throw new Error('order payload required');
  if (!orderPayload.name) throw new Error('order name required');
  if (!orderPayload.geometry) throw new Error('GeoJSON geometry required');
  return request('/orders/', { method: 'POST', body: JSON.stringify(orderPayload) });
}

export async function cancelPlanetTaskingOrder(orderId, acceptCancellationCharge = false) {
  requireLiveExecution();
  const id = String(orderId || '').trim();
  if (!id) throw new Error('orderId required');
  const suffix = acceptCancellationCharge ? '?accept_cancellation_charge=true' : '';
  return request('/orders/' + encodeURIComponent(id) + suffix, { method: 'DELETE' });
}
