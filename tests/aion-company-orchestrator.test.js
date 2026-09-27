import test from 'node:test';
import assert from 'node:assert/strict';
import { planCompanyWork, companyOrchestratorHealth } from '../config/aion-company-orchestrator.js';

test('company orchestrator routes all 20 departments', () => {
  const plan = planCompanyWork({ goal:'improve measurable operating performance' });
  assert.equal(plan.length, 20);
  assert.equal(new Set(plan.map(x => x.department)).size, 20);
  assert.ok(plan.every(x => x.model));
});

test('fleet integrity is 10,000 roles', () => {
  const health = companyOrchestratorHealth();
  assert.equal(health.registeredAgentRoles, 10000);
  assert.equal(health.roleRegistryIntegrity, true);
});
