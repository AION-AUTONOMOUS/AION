import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTELLIGENCE_CORE_VERSION,
  intelligenceCoreHealth,
  selectDepartmentMode
} from '../config/aion-intelligence-core.js';

test('AION intelligence core is routed through company control plane', () => {
  assert.equal(INTELLIGENCE_CORE_VERSION, '1.0.0');
  assert.equal(intelligenceCoreHealth().routing, 'control-plane');
  assert.equal(intelligenceCoreHealth().fakeCompletion, false);
});

test('department routing selects operational model modes', () => {
  assert.equal(selectDepartmentMode('engineering'), 'engineering');
  assert.equal(selectDepartmentMode('research'), 'research');
  assert.equal(selectDepartmentMode('marketing'), 'volume');
  assert.equal(selectDepartmentMode('strategy'), 'frontier');
});
