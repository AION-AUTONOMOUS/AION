import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateMicrogridInterval } from '../server-api/energy-simulator.js';

test('energy simulation charges storage from synthetic surplus', () => {
  const result = simulateMicrogridInterval({
    generationKw: 8, demandKw: 5, storageKwh: 1, storageCapacityKwh: 4,
  });
  assert.equal(result.nextStorageKwh, 4);
  assert.equal(result.curtailedGenerationKw, 0);
  assert.equal(result.unservedDemandKw, 0);
  assert.equal(result.simulationOnly, true);
});

test('energy simulation discharges storage to cover a synthetic deficit', () => {
  const result = simulateMicrogridInterval({
    generationKw: 2, demandKw: 5, storageKwh: 2, storageCapacityKwh: 4,
  });
  assert.equal(result.nextStorageKwh, 0);
  assert.equal(result.unservedDemandKw, 1);
  assert.equal(result.status, 'shortfall');
});

test('energy simulation rejects invalid values and impossible initial storage', () => {
  assert.throws(() => simulateMicrogridInterval({ generationKw: -1, demandKw: 2 }));
  assert.throws(() => simulateMicrogridInterval({
    generationKw: 1, demandKw: 2, storageKwh: 3, storageCapacityKwh: 2,
  }), /cannot exceed/);
});
