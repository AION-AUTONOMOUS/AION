import test from 'node:test';
import assert from 'node:assert/strict';

import { AGENTS, DEPARTMENTS, TOTAL_AGENTS, fleetHealth } from '../config/aion-fleet.js';
import { AUTONOMOUS_POLICIES, routeTask } from '../config/aion-control-plane.js';
import { dispatchTask } from '../config/aion-workers.js';
import { processOne, setActionExecutor, resetStore } from '../config/aion-worker-runtime.js';

test('fleet is exactly 20 departments and 10,000 roles', () => {
  assert.equal(Object.keys(DEPARTMENTS).length, 20);
  assert.equal(TOTAL_AGENTS, 10000);
  assert.equal(AGENTS.length, 10000);
  assert.equal(fleetHealth().total_agents, 10000);
});

test('control plane keeps sensitive money/assets gated and political targeting blocked', () => {
  assert.equal(AUTONOMOUS_POLICIES.autoMoveMoney, false);
  assert.equal(AUTONOMOUS_POLICIES.autoDeployMainnetToken, false);
  assert.equal(AUTONOMOUS_POLICIES.autoExecutePoliticalTargeting, false);

  const finance = routeTask({ text: 'prepare a treasury payment proposal', department: 'finance' });
  assert.equal(finance.policy.requiresHumanApproval, true);
  assert.equal(finance.policy.blocked, false);

  const political = routeTask({ text: 'target voters with political advertising', department: 'marketing' });
  assert.equal(political.policy.blocked, true);
});

test('worker never reports completion without a real executor result', async () => {
  await resetStore();
  setActionExecutor(async () => ({ type: 'test', output: 'real result' }));

  const routed = await dispatchTask({
    department: 'research',
    type: 'research',
    text: 'perform a test research task'
  });

  assert.equal(routed.action, 'queued_for_worker');
  const result = await processOne();
  assert.equal(result.status, 'completed');
  assert.equal(result.result.output, 'real result');

  await resetStore();
});

test('worker records executor failures as failed, never fake success', async () => {
  await resetStore();
  setActionExecutor(async () => { throw new Error('provider unavailable'); });

  await dispatchTask({
    department: 'engineering',
    type: 'engineering',
    text: 'perform a test engineering task'
  });

  const result = await processOne();
  assert.equal(result.status, 'failed');
  assert.match(result.error, /provider unavailable/);

  setActionExecutor(async () => { throw new Error('test executor not configured'); });
  await resetStore();
});
