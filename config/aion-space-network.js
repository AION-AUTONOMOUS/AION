import crypto from 'node:crypto';
import { addToIndex, getJson, listIndexed, setJson } from './aion-stack-store.js';

export const SPACE_NETWORK_VERSION = '1.0.0';

const ORBIT_CLASSES = Object.freeze(['LEO', 'MEO', 'GEO', 'HEO', 'UNKNOWN']);
const PROVIDER_TYPES = Object.freeze(['satellite-operator', 'ground-station', 'earth-observation', 'launch', 'space-data', 'communications']);

function text(value) { return String(value ?? '').trim(); }

export function spaceNetworkHealth() {
  return {
    version: SPACE_NETWORK_VERSION,
    status: 'provider-adapter-ready',
    orbitClasses: [...ORBIT_CLASSES],
    providerTypes: [...PROVIDER_TYPES],
    accessPolicy: 'authorized-operator-and-ground-station-APIs-only',
    noUnauthorizedSatelliteControl: true,
    noSpectrumInterference: true,
    noOwnershipClaim: true
  };
}

export function createSpaceProvider(input = {}) {
  const name = text(input.name);
  if (!name) throw new Error('provider name required');
  const type = PROVIDER_TYPES.includes(input.type) ? input.type : 'space-data';
  return {
    id: 'AION-SPACE-PROVIDER-' + crypto.randomUUID(),
    name,
    type,
    apiBaseUrl: text(input.apiBaseUrl) || null,
    capabilities: Array.isArray(input.capabilities) ? input.capabilities.map(text).filter(Boolean) : [],
    authorization: 'required',
    status: input.apiBaseUrl ? 'adapter-configured' : 'adapter-ready',
    createdAt: new Date().toISOString()
  };
}

export async function registerSpaceProvider(input = {}) {
  const provider = createSpaceProvider(input);
  await setJson('space-provider:' + provider.id, provider);
  await addToIndex('space-providers', provider.id);
  return provider;
}

export async function listSpaceProviders() {
  return listIndexed('space-providers');
}

export function createSatelliteRecord(input = {}) {
  const name = text(input.name);
  if (!name) throw new Error('satellite name required');
  const orbit = ORBIT_CLASSES.includes(input.orbit) ? input.orbit : 'UNKNOWN';
  return {
    id: 'AION-SAT-' + crypto.randomUUID(),
    name,
    operator: text(input.operator) || null,
    orbit,
    noradId: Number.isInteger(input.noradId) ? input.noradId : null,
    providerId: text(input.providerId) || null,
    dataAccess: input.dataAccess === true,
    commandAccess: false,
    status: 'cataloged',
    createdAt: new Date().toISOString()
  };
}

export async function registerSatellite(input = {}) {
  const satellite = createSatelliteRecord(input);
  await setJson('satellite:' + satellite.id, satellite);
  await addToIndex('satellites', satellite.id);
  return satellite;
}

export async function listSatellites() {
  return listIndexed('satellites');
}

export async function getSpaceProvider(id) {
  return getJson('space-provider:' + text(id));
}

export function createSpaceService(input = {}) {
  const name = text(input.name);
  const description = text(input.description);
  const priceAion = Number(input.priceAion);
  if (!name) throw new Error('service name required');
  if (!description) throw new Error('service description required');
  if (!Number.isFinite(priceAion) || priceAion <= 0) throw new Error('priceAion must be positive');

  return {
    id: 'AION-SPACE-SVC-' + crypto.randomUUID(),
    name,
    description,
    priceAion,
    delivery: 'AI-orchestrated',
    intellectualProperty: 'AION-proprietary-or-licensed',
    copyResistance: ['server-side execution', 'metered access', 'signed job receipts', 'proprietary orchestration'],
    status: 'cataloged',
    createdAt: new Date().toISOString()
  };
}

export async function registerSpaceService(input = {}) {
  const service = createSpaceService(input);
  await setJson('space-service:' + service.id, service);
  await addToIndex('space-services', service.id);
  return service;
}

export async function listSpaceServices() {
  return listIndexed('space-services');
}
