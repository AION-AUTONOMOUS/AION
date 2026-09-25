import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENTS_PER_DEPARTMENT, TOTAL_AGENTS } from '../config/aion-fleet.js';
import { AUTONOMOUS_POLICIES, routeTask, controlPlaneHealth } from '../config/aion-control-plane.js';

test('control plane sees the full 4,000-agent fleet', () => {
  const health = controlPlaneHealth();
  assert.equal(health.fleet.total_agents, 4000);
  assert.equal(TOTAL_AGENTS, 4000);
  assert.equal(AGENTS_PER_DEPARTMENT, 200);
});

test('ordinary engineering tasks can be routed autonomously', () => {
  const result = routeTask({ id: 'T-1', text: 'fix API bug and run tests' });
  assert.equal(result.department, 'engineering');
  assert.equal(result.policy.requiresHumanApproval, false);
});

test('financial and sensitive actions remain approval-gated', () => {
  assert.equal(routeTask({ text: 'send payment to vendor' }).policy.requiresHumanApproval, true);
  assert.equal(routeTask({ text: 'deploy token to mainnet' }).policy.requiresHumanApproval, true);
  assert.equal(routeTask({ text: 'run paid ads' }).policy.requiresHumanApproval, true);
  assert.equal(AUTONOMOUS_POLICIES.autoMoveMoney, false);
  assert.equal(AUTONOMOUS_POLICIES.autoDeployMainnetToken, false);
});
