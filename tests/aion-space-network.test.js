import test from 'node:test';
import assert from 'node:assert/strict';
import {
  spaceNetworkHealth,
  createSpaceProvider,
  createSatelliteRecord,
  createSpaceService
} from '../config/aion-space-network.js';

test('space network is adapter-ready and refuses unauthorized satellite control', () => {
  const health = spaceNetworkHealth();
  assert.equal(health.status, 'provider-adapter-ready');
  assert.equal(health.noUnauthorizedSatelliteControl, true);
  assert.equal(health.noSpectrumInterference, true);
});

test('space provider requires a name and authorized adapter access', () => {
  assert.throws(() => createSpaceProvider({}), /provider name required/);
  const provider = createSpaceProvider({ name: 'Example Space Operator', type: 'satellite-operator' });
  assert.equal(provider.authorization, 'required');
});

test('satellite records cannot grant command access', () => {
  const satellite = createSatelliteRecord({ name: 'Example-1', orbit: 'LEO', commandAccess: true });
  assert.equal(satellite.commandAccess, false);
});

test('space services require positive AION pricing', () => {
  assert.throws(() => createSpaceService({ name: 'x', description: 'y', priceAion: 0 }), /priceAion must be positive/);
  const service = createSpaceService({ name: 'AION Orbital Intelligence', description: 'AI-orchestrated satellite data service', priceAion: 10 });
  assert.equal(service.delivery, 'AI-orchestrated');
  assert.equal(service.status, 'cataloged');
  assert.ok(service.copyResistance.length >= 3);
});
