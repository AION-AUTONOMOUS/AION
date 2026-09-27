import test from 'node:test';
import assert from 'node:assert/strict';
import { workerRuntimeStatus, activateFleetCycle } from '../config/aion-worker-runtime.js';

test('worker runtime exposes production fleet activation', async () => {
  const status = await workerRuntimeStatus();
  assert.equal(status.version, '2.0.0');
  assert.equal(status.maxConcurrency >= 1, true);
  const activation = await activateFleetCycle('production worker smoke task', { limit: 1 });
  assert.equal(activation.requestedRoles, 1);
});
