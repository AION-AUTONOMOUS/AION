import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchTask, workerCapabilities, executeApprovedTask } from '../config/aion-workers.js';
import { opsHealth, resetStore } from '../config/aion-ops-engine.js';

test.beforeEach(() => resetStore());

test('worker dispatch selects a specialized agent for engineering', () => {
  const result = dispatchTask({ text: 'fix API bug and run tests' });
  assert.equal(result.worker.department, 'engineering');
  assert.ok(result.worker.capabilities.includes('bug'));
});

test('sensitive work is approval-gated before worker execution', () => {
  const result = dispatchTask({ text: 'send payment to vendor' });
  assert.equal(result.action, 'await_human_approval');
  assert.equal(result.worker, null);
  const done = executeApprovedTask(result.task.id);
  assert.equal(done.status, 'completed');
});

test('health reports worker fleet and task metrics', () => {
  assert.equal(workerCapabilities('security').includes('audit'), true);
  assert.equal(opsHealth().total_agents, 4000);
});
