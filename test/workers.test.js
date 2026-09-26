import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchTask, workerCapabilities, executeApprovedTask } from '../config/aion-workers.js';
import { opsHealth, resetStore, approveTask } from '../config/aion-ops-engine.js';

test.beforeEach(async () => resetStore());

test('worker dispatch selects specialized agent', async () => {
  const result = await dispatchTask({ text: 'fix API bug and run tests' });
  assert.equal(result.worker.department, 'engineering');
  assert.ok(result.worker.capabilities.includes('bug'));
});

test('sensitive work requires explicit human approval before execution', async () => {
  const result = await dispatchTask({ text: 'send payment to vendor' });
  assert.equal(result.action, 'await_human_approval');
  assert.equal(result.worker, null);
  assert.equal(await executeApprovedTask(result.task.id), null);

  const approved = await approveTask(result.task.id);
  assert.equal(approved.status, 'ready');
  assert.ok(approved.approvedAt);

  const done = await executeApprovedTask(result.task.id);
  assert.equal(done.status, 'completed');
});

test('health reports worker fleet', async () => {
  assert.equal(workerCapabilities('security').includes('audit'), true);
  assert.equal((await opsHealth()).total_agents, 10000);
});
