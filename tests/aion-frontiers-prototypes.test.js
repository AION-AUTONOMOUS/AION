import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRecoveryCodes, hashRecoveryCode, recoveryCodeMatches } from '../server-api/identity-core.js';
import { simulateMicrogrid } from '../server-api/energy-simulator.js';
import { createSyntheticHealthDemo } from '../server-api/health-research-demo.js';

test('identity recovery codes are unique, hash-only storage can verify a code', () => {
  const result = generateRecoveryCodes(8);
  assert.equal(result.codes.length, 8);
  assert.equal(new Set(result.codes).size, 8);
  assert.equal(result.hashes.length, 8);
  assert.ok(result.hashes.every((hash) => /^[a-f0-9]{64}$/.test(hash)));
  assert.equal(recoveryCodeMatches(result.codes[0], result.hashes[0]), true);
  assert.equal(recoveryCodeMatches('wrong-code', result.hashes[0]), false);
  assert.equal(recoveryCodeMatches(result.codes[0], 'bad-hash'), false);
});

test('identity code normalization ignores spaces and hyphens', () => {
  assert.equal(hashRecoveryCode(' ab-cd '), hashRecoveryCode('ABCD'));
});

test('energy simulation serves demand from solar then battery', () => {
  const result = simulateMicrogrid({ solarKwh: 3, batteryKwh: 2, demandKwh: 4, batteryCapacityKwh: 5 });
  assert.equal(result.directSolarKwh, 3);
  assert.equal(result.batteryDischargeKwh, 1);
  assert.equal(result.unmetDemandKwh, 0);
  assert.equal(result.fullyServed, true);
});

test('energy simulation charges battery with solar surplus and reports curtailment', () => {
  const result = simulateMicrogrid({ solarKwh: 8, batteryKwh: 1, demandKwh: 2, batteryCapacityKwh: 3 });
  assert.equal(result.batteryChargeKwh, 2);
  assert.equal(result.curtailedSolarKwh, 4);
});

test('energy simulation rejects impossible input', () => {
  assert.throws(() => simulateMicrogrid({ solarKwh: -1, batteryKwh: 0, demandKwh: 1 }), /solarKwh/);
  assert.throws(() => simulateMicrogrid({ solarKwh: 1, batteryKwh: 4, batteryCapacityKwh: 3, demandKwh: 1 }), /cannot exceed/);
});

test('health demo is marked synthetic and never presents an index as probability', () => {
  const result = createSyntheticHealthDemo({ ageBand: 3, activityBand: 1, sleepBand: 2 });
  assert.equal(result.dataType, 'synthetic');
  assert.match(result.scale, /not a probability/);
  assert.match(result.disclaimer, /Not clinically validated/);
  assert.ok(result.illustrativeIndex >= 0 && result.illustrativeIndex <= 100);
});

test('health demo rejects values outside the synthetic scale', () => {
  assert.throws(() => createSyntheticHealthDemo({ ageBand: 8 }), /ageBand/);
});
