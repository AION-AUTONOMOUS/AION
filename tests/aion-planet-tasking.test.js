import test from 'node:test';
import assert from 'node:assert/strict';
import { planetTaskingHealth } from '../config/aion-planet-tasking.js';

test('Planet adapter is authorization-gated when production credentials are absent', () => {
  const health = planetTaskingHealth();
  assert.equal(health.provider, 'planet');
  assert.equal(health.directSatelliteCommand, false);
  if (!process.env.PLANET_API_KEY) {
    assert.equal(health.configured, false);
    assert.equal(health.execution, 'authorization-gated');
  }
});
