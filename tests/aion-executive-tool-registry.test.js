import test from 'node:test';
import assert from 'node:assert/strict';
import { executeRegisteredTool, listRegisteredTools } from '../config/aion-executive-tool-registry.js';
import { dispatchTask } from '../config/aion-workers.js';
import { getTask, updateTask } from '../config/aion-ops-store.js';

test('executive registry exposes bounded read-only operational and business tools', () => {
  const tools = listRegisteredTools();
  assert.deepEqual(tools.map(tool => tool.name).sort(), [
    'aion.leads.list',
    'aion.prospects.list',
    'aion.revenue.dashboard',
    'aion.revenue.orders.list',
    'aion.revenue.records.list',
    'aion.runtime.status',
    'aion.tasks.create_followup',
    'aion.tasks.get',
    'aion.tasks.list'
  ]);
  assert.ok(tools.every(tool => ['read-only', 'internal-write'].includes(tool.access)));
  assert.equal(tools.filter(tool => tool.access === 'internal-write').map(tool => tool.name).join(','), 'aion.tasks.create_followup');
  assert.ok(tools.every(tool => tool.inputSchema.additionalProperties === false));
});

test('task list tool returns evidence with a stable output digest', async () => {
  const result = await executeRegisteredTool('aion.tasks.list', { limit: 5 });
  assert.equal(result.status, 'completed');
  assert.equal(result.access, 'read-only');
  assert.ok(Array.isArray(result.output));
  assert.equal(result.evidence.verified, true);
  assert.match(result.evidence.outputDigest, /^[a-f0-9]{64}$/);
});

test('revenue dashboard exposes offer and confirmed-revenue metrics', async () => {
  const result = await executeRegisteredTool('aion.revenue.dashboard', {});
  assert.equal(result.status, 'completed');
  assert.ok(Array.isArray(result.output.offers));
  assert.equal(typeof result.output.metrics.totalOrders, 'number');
  assert.equal(typeof result.output.metrics.paidOrders, 'number');
  assert.equal(typeof result.output.metrics.recognizedRevenue, 'number');
  assert.equal(result.output.health.realRevenueOnly, true);
  assert.equal(result.output.health.paymentConfirmationRequired, true);
  assert.equal(result.evidence.verified, true);
});

test('prospect list is ranked, bounded, and includes evidence URLs', async () => {
  const result = await executeRegisteredTool('aion.prospects.list', { minScore: 90, limit: 3 });
  assert.ok(result.output.prospects.length <= 3);
  assert.ok(result.output.prospects.every(item => item.fitScore >= 90 && /^https:\/\//.test(item.source)));
  assert.ok(result.output.health.evidenceBackedTargets >= result.output.prospects.length);
});

test('lead list does not expose direct personal contact fields', async () => {
  const result = await executeRegisteredTool('aion.leads.list', { limit: 10 });
  assert.ok(Array.isArray(result.output));
  for (const lead of result.output) {
    assert.equal(Object.hasOwn(lead, 'email'), false);
    assert.equal(Object.hasOwn(lead, 'name'), false);
    assert.equal(Object.hasOwn(lead, 'request'), false);
  }
});


test('executive can create one bounded internal follow-up but cannot fan out recursively', async () => {
  const created = await dispatchTask({
    type: 'research',
    department: 'research',
    text: 'Research public market fit for an AION digital intelligence offer.'
  });
  assert.equal(created.action, 'queued_for_worker');
  const parentTask = await updateTask(created.task.id, { status: 'running' });

  const result = await executeRegisteredTool('aion.tasks.create_followup', {
    department: 'research',
    title: 'Verify the highest-fit prospect',
    text: 'Compare the top public prospect with the existing AION offer and list evidence gaps.',
    priority: 'normal'
  }, { parentTask });

  assert.equal(result.access, 'internal-write');
  assert.equal(result.output.parentTaskId, parentTask.id);
  assert.equal(result.output.action, 'queued_for_worker');
  assert.ok(result.output.taskId);
  assert.equal(result.evidence.verified, true);

  await assert.rejects(() => executeRegisteredTool('aion.tasks.create_followup', {
    department: 'research',
    title: 'Second follow-up',
    text: 'Create a second follow-up task for the same parent task.',
    priority: 'low'
  }, { parentTask }), /already created its one allowed follow-up/);

  const childTask = await getTask(result.output.taskId);
  await assert.rejects(() => executeRegisteredTool('aion.tasks.create_followup', {
    department: 'research',
    title: 'Recursive follow-up',
    text: 'Try to create a recursive child task.',
    priority: 'low'
  }, { parentTask: childTask }), /depth limit reached/);
});

test('tool rejects unknown names and unexpected input fields', async () => {
  await assert.rejects(() => executeRegisteredTool('aion.shell.exec', {}), /not registered/);
  await assert.rejects(() => executeRegisteredTool('aion.tasks.list', { limit: 5, command: 'delete' }), /unsupported input field/);
  await assert.rejects(() => executeRegisteredTool('aion.runtime.status', { anything: true }), /accepts no input fields/);
  await assert.rejects(() => executeRegisteredTool('aion.prospects.list', { minScore: 500 }), /minScore must be an integer/);
});

test('task lookup requires a bounded exact task identifier', async () => {
  await assert.rejects(() => executeRegisteredTool('aion.tasks.get', {}), /taskId is required/);
  const result = await executeRegisteredTool('aion.tasks.get', { taskId: 'AION-TASK-does-not-exist' });
  assert.equal(result.output.found, false);
  assert.equal(result.evidence.verified, true);
});
