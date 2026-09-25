import test from 'node:test';
import assert from 'node:assert/strict';
import { distributeTasks, buildDepartmentWorkload, schedulerHealth } from '../config/aion-task-scheduler.js';

test('distributes work across departments and registered agents', async () => {
  const result = await distributeTasks(Array.from({length:40}, (_, i) => ({text:'task '+i})));
  assert.equal(result.length, 40);
  assert.equal(new Set(result.map(x => x.assignment.department)).size, 20);
  assert.equal(result.every(x => x.assignment.poolSize === 500), true);
});
