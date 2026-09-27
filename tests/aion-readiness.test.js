import test from 'node:test';
import assert from 'node:assert/strict';

import { aionReadiness, READINESS_VERSION } from '../config/aion-readiness.js';

test('AION readiness contract reports the expected fleet and safety gates', () => {
  const readiness = aionReadiness();

  assert.equal(READINESS_VERSION, '1.0.0');
  assert.equal(readiness.checks.fleet_registry, true);
  assert.equal(readiness.checks.sensitive_money_guard, true);
  assert.equal(readiness.checks.sensitive_asset_guard, true);
  assert.equal(readiness.guarantees.no_fake_completion, true);
  assert.equal(readiness.guarantees.no_autonomous_external_money_movement, true);
  assert.equal(readiness.guarantees.frontier_intelligence_is_research_only, true);
});
