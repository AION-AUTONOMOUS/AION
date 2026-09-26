import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchTask, workerCapabilities } from '../config/aion-workers.js';
import { processBatch, setActionExecutor, resetStore as resetRuntimeStore } from '../config/aion-worker-runtime.js';
import { opsHealth, resetStore, approveTask } from '../config/aion-ops-engine.js';

test.beforeEach(async () => { await resetStore(); await resetRuntimeStore(); setActionExecutor(async () => ({ type: 'test', output: 'verified execution' })); });

test('worker dispatch selects specialized agent', async () => {
  const result = await dispatchTask({ text: 'fix API bug and run tests' });
  assert.equal(result.worker.department, 'engineering');
  assert.ok(result.worker.capabilities.includes('bug'));
});

test('sensitive work requires explicit human approval before execution', async () => {
  const result = await dispatchTask({ text: 'send payment to vendor' });
  assert.equal(result.action, 'await_human_approval');
  assert.equal(result.worker, null);
  const approved = await approveTask(result.task.id);
  assert.equal(approved.status, 'ready');
  assert.ok(approved.approvedAt);

  const done = (await processBatch(1))[0];
  assert.equal(done.status, 'completed');
  assert.equal(done.result.output, 'verified execution');
});

test('health reports worker fleet', async () => {
  assert.equal(workerCapabilities('security').includes('audit'), true);
  assert.equal((await opsHealth()).total_agents, 10000);
});
