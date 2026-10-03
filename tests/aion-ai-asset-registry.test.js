import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registrySummary, ASSET_CLASSES, TOTAL_REGISTERED_ROLES, ROOT_IDS,
  roleId, describeRole, validateAssetClassAllocation
} from '../config/aion-ai-asset-registry.js';

test('registry has exactly ten million registered AI roles', () => {
  assert.equal(TOTAL_REGISTERED_ROLES, 10_000_000);
  assert.equal(ASSET_CLASSES.length, 10);
  assert.equal(validateAssetClassAllocation().valid, true);
});

test('root identifiers are fixed registry identifiers, not assets or money', () => {
  assert.equal(ROOT_IDS.vault, '000000000001');
  assert.equal(ROOT_IDS.primeIntelligence, '999999999999');
  assert.equal(registrySummary().concurrentProcessCount, 0);
});

test('role IDs are deterministic and scoped to an asset class', () => {
  const id = roleId('bonds-fixed-income', 1);
  assert.equal(id, 'AION-AI-BONDS_FIXED_INCOME-0000001');
  const role = describeRole('bonds-fixed-income', 1, 'verifier');
  assert.equal(role.roleType, 'verifier');
  assert.equal(role.financialAuthority, 'none');
  assert.equal(role.evidenceRequired, true);
  assert.equal(role.verificationRequired, true);
});

test('invalid role numbers fail closed', () => {
  assert.throws(() => roleId('bonds-fixed-income', 1_000_001));
  assert.throws(() => roleId('unknown', 1));
});
