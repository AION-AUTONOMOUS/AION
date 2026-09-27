import test from 'node:test';
import assert from 'node:assert/strict';
import {
  economyHealth,
  createEconomicModel,
  simulateFee
} from '../config/aion-economy.js';
import {
  spaceIntelligenceHealth,
  createSpaceMission,
  createSpaceDataJob
} from '../config/aion-space-intelligence.js';

test('economy is simulation-ready and blocks external settlement', () => {
  const health = economyHealth();
  assert.equal(health.status, 'simulation-ready');
  assert.equal(health.externalTransfers, 'disabled');
  const model = createEconomicModel({
    initialSupply: 1000000,
    feeBps: 25,
    allocation: { research: 100000, treasury: 50000 }
  });
  assert.equal(model.circulatingSupply, 850000);
  const fee = simulateFee(model, 1000);
  assert.equal(fee.fee, 2.5);
  assert.equal(fee.net, 997.5);
});

test('economic model rejects invalid allocation and fee', () => {
  assert.throws(() => createEconomicModel({ initialSupply: 10, allocation: { research: 11 } }));
  assert.throws(() => createEconomicModel({ initialSupply: 10, feeBps: 1001 }));
});

test('space intelligence creates governed missions', () => {
  const health = spaceIntelligenceHealth();
  assert.equal(health.status, 'mission-planning-ready');
  assert.equal(health.satelliteCommand, false);
  const mission = createSpaceMission({
    name: 'Arabian Sea observation',
    type: 'earth-observation',
    priority: 80
  });
  assert.equal(mission.executionPolicy, 'authorized-provider-adapter');
  assert.equal(mission.status, 'planned');
  return createSpaceDataJob({ missionId: mission.id, priceAion: 25 }).then(
    () => assert.fail('job should require persisted mission')
  ).catch(error => assert.equal(error.message, 'mission not found'));
});
