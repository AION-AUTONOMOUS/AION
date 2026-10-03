import test from 'node:test';
import assert from 'node:assert/strict';
import { satelliteProviderHealth } from '../config/aion-satellite-providers.js';

test('Sentinel Hub adapter is authorization-gated without credentials', () => {
  const h = satelliteProviderHealth();
  assert.equal(h.provider, 'sentinel-hub');
  assert.equal(h.mock, false);
  assert.deepEqual(h.collections, ['sentinel-2-l2a', 'sentinel-1-grd']);
  if (!process.env.SENTINEL_HUB_CLIENT_ID || !process.env.SENTINEL_HUB_CLIENT_SECRET) {
    assert.equal(h.configured, false);
    assert.equal(h.execution, 'authorization-gated');
  }
});

test('Sentinel adapter health never exposes credentials', () => {
  const h = satelliteProviderHealth();
  assert.equal(Object.hasOwn(h, 'clientSecret'), false);
  assert.equal(Object.hasOwn(h, 'clientId'), false);
});
