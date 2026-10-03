import test from 'node:test';
import assert from 'node:assert/strict';

import { spaceCommerceHealth, listSpaceCatalog } from '../config/aion-space-commerce.js';
import { spaceIntelligenceHealth, createSpaceMission } from '../config/aion-space-intelligence.js';

test('AION Space commerce remains ledger-only and does not perform external money transfer', () => {
  const health = spaceCommerceHealth();
  assert.equal(health.status, 'catalog-ready');
  assert.equal(health.externalMoney, false);
  assert.equal(health.mainnet, false);
  assert.equal(health.settlement, 'internal-ledger-only');
});

test('AION Space catalog contains satellite intelligence products', () => {
  const catalog = listSpaceCatalog();
  assert.ok(catalog.some((item) => item.id === 'satellite-insight'));
  assert.ok(catalog.some((item) => item.id === 'orbit-intelligence'));
});

test('AION Space mission planning forbids direct spacecraft control', () => {
  const health = spaceIntelligenceHealth();
  assert.equal(health.satelliteCommand, false);
  assert.equal(health.providerExecution, 'authorized-adapter-only');

  const mission = createSpaceMission({
    name: 'AION Partner Pilot',
    type: 'earth-observation',
    objective: 'Commercial satellite intelligence pilot',
    providerId: 'pending-authorized-provider'
  });

  assert.equal(mission.executionPolicy, 'authorized-provider-adapter');
  assert.equal(mission.status, 'planned');
  assert.equal(mission.providerId, 'pending-authorized-provider');
});
