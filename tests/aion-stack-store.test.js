import test from 'node:test';
import assert from 'node:assert/strict';

import { addToIndex, listIndexed, setJson } from '../config/aion-stack-store.js';

test('stack store supports the intelligence cycle index', async () => {
  const id = 'cycle-test-' + Date.now();
  const value = { id, status: 'planned' };

  await setJson('cycles:' + id, value);
  await addToIndex('cycles', id);

  const cycles = await listIndexed('cycles');
  assert.ok(cycles.some(cycle => cycle?.id === id));
});

test('stack store rejects unknown indexes instead of writing to an invalid key', async () => {
  await assert.rejects(
    () => addToIndex('not-a-real-index', 'x'),
    /Unknown stack index/
  );
  await assert.rejects(
    () => listIndexed('not-a-real-index'),
    /Unknown stack index/
  );
});
