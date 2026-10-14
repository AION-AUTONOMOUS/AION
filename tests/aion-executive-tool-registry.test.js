import test from 'node:test';
import assert from 'node:assert/strict';
import { executeRegisteredTool, listRegisteredTools } from '../config/aion-executive-tool-registry.js';

test('executive tool registry exposes only bounded read-only tools', () => {
  const tools = listRegisteredTools();
  assert.deepEqual(tools.map(tool => tool.name).sort(), [
    'aion.runtime.status',
    'aion.tasks.get',
    'aion.tasks.list'
  ]);
  assert.ok(tools.every(tool => tool.access === 'read-only'));
});

test('task list tool returns evidence with a stable output digest', async () => {
  const result = await executeRegisteredTool('aion.tasks.list', { limit: 5 });
  assert.equal(result.status, 'completed');
  assert.equal(result.access, 'read-only');
  assert.ok(Array.isArray(result.output));
  assert.equal(result.evidence.verified, true);
  assert.match(result.evidence.outputDigest, /^[a-f0-9]{64}$/);
});

test('tool rejects unknown names and unexpected input fields', async () => {
  await assert.rejects(() => executeRegisteredTool('aion.shell.exec', {}), /not registered/);
  await assert.rejects(() => executeRegisteredTool('aion.tasks.list', { limit: 5, command: 'delete' }), /unsupported input field/);
  await assert.rejects(() => executeRegisteredTool('aion.runtime.status', { anything: true }), /accepts no input fields/);
});

test('task lookup requires a bounded exact task identifier', async () => {
  await assert.rejects(() => executeRegisteredTool('aion.tasks.get', {}), /taskId is required/);
  const result = await executeRegisteredTool('aion.tasks.get', { taskId: 'AION-TASK-does-not-exist' });
  assert.equal(result.output.found, false);
  assert.equal(result.evidence.verified, true);
});
