import assert from 'node:assert/strict';
import test from 'node:test';
import { intelligenceLoopHealth, startIntelligenceCycle, getIntelligenceCycle, recordLearning, LOOP_STAGES } from '../config/aion-intelligence-loop.js';

test('intelligence loop exposes all operating stages', () => {
  const health = intelligenceLoopHealth();
  assert.equal(health.status, 'ready');
  assert.deepEqual(health.stages, LOOP_STAGES);
  assert.equal(health.fakeCompletion, false);
});

test('cycle is persisted as planned and backed by workers', async () => {
  const cycle = await startIntelligenceCycle({ goal: 'Validate continuous improvement', metrics: ['pass_rate'] });
  assert.equal(cycle.status, 'planned');
  assert.equal(cycle.tasks.length, 6);
  assert.equal(cycle.guarantees.noFakeCompletion, true);
  assert.deepEqual((await getIntelligenceCycle(cycle.id)).id, cycle.id);
});

test('learning closes a measurable cycle without inventing evidence', async () => {
  const cycle = await startIntelligenceCycle({ goal: 'Learn from verified results' });
  const learned = await recordLearning(cycle.id, { observation: 'verified', evidence: ['test-result-1'], metrics: { pass_rate: 1 } });
  assert.equal(learned.status, 'learned');
  assert.deepEqual(learned.learning.metrics, { pass_rate: 1 });
});