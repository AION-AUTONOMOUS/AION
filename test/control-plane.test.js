import test from 'node:test';
import assert from 'node:assert/strict';
import { DEPARTMENTS, TOTAL_AGENTS } from '../config/aion-fleet.js';
import { AUTONOMOUS_POLICIES, routeTask, controlPlaneHealth } from '../config/aion-control-plane.js';

test('control plane sees the full 10,000-agent fleet', () => {
  const health = controlPlaneHealth();
  assert.equal(health.fleet.total_agents, 10000);
  assert.equal(TOTAL_AGENTS, 10000);
  assert.equal(Object.keys(DEPARTMENTS).length, 20);
});

test('all 20 departments have deterministic routing and canonical agents', () => {
  for (const department of Object.keys(DEPARTMENTS)) {
    const result = routeTask({ type: department, text: '' });
    assert.equal(result.department, department);
    assert.equal(result.agent.department, department);
    assert.ok(result.commander.id);
  }
});

test('text routing covers specialist departments', () => {
  assert.equal(routeTask({ text: 'fix API bug and run tests' }).department, 'engineering');
  assert.equal(routeTask({ text: 'review a contract' }).department, 'legal');
  assert.equal(routeTask({ text: 'analyze sales leads in CRM' }).department, 'sales');
  assert.equal(routeTask({ text: 'investigate security vulnerability' }).department, 'security');
  assert.equal(routeTask({ text: 'prepare press outreach' }).department, 'communications');
});

test('financial and sensitive actions remain approval-gated', () => {
  assert.equal(routeTask({ text: 'send payment to vendor' }).policy.requiresHumanApproval, true);
  assert.equal(routeTask({ text: 'deploy token to mainnet' }).policy.requiresHumanApproval, true);
  assert.equal(routeTask({ text: 'run paid ads' }).policy.requiresHumanApproval, true);
  assert.equal(routeTask({ text: 'review a contract' }).policy.requiresHumanApproval, true);
  assert.equal(AUTONOMOUS_POLICIES.autoMoveMoney, false);
  assert.equal(AUTONOMOUS_POLICIES.autoDeployMainnetToken, false);
});
