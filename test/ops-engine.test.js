import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueTask, approveTask, runNextTask, opsHealth } from '../config/aion-ops-engine.js';
import { resetStore } from '../config/aion-ops-store.js';

test.beforeEach(() => resetStore());

test('ordinary tasks are routed and executed through the operations engine', () => {
  const result = enqueueTask({ type: 'engineering', text: 'fix API bug and run tests' });
  assert.equal(result.task.status, 'ready');
  const done = runNextTask();
  assert.equal(done.status, 'completed');
  assert.equal(opsHealth().completed, 1);
});

test('sensitive tasks stop for human approval', () => {
  const result = enqueueTask({ type: 'finance', text: 'send payment to vendor' });
  assert.equal(result.task.status, 'awaiting_approval');
  assert.equal(runNextTask(), null);
  assert.equal(approveTask(result.task.id).status, 'ready');
  assert.equal(runNextTask().status, 'completed');
});

test('operations health reports task lifecycle', () => {
  enqueueTask({ text: 'update documentation' });
  const health = opsHealth();
  assert.equal(health.total_agents, 10000);
  assert.equal(health.ready, 1);
  assert.ok(health.recentEvents.length >= 2);
});
