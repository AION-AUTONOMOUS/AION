import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateOutcome, intelligenceHealth, createIntelligencePlan, remember, recall } from '../config/aion-intelligence-engine.js';

test('intelligence health is measurement-first and does not fake execution', () => {
  const health = intelligenceHealth();
  assert.equal(health.status, 'ready'); assert.equal(health.fakeCompletion, false);
  assert.deepEqual(health.stages, ['understand', 'research', 'plan', 'execute', 'verify', 'learn']);
});
test('memory round-trip works through the stack store', async () => {
  const key = 'test-' + Date.now(); await remember({ key, value: { result: 'ok' }, tags: ['test'] });
  const value = await recall(key); assert.deepEqual(value.value, { result: 'ok' });
});
test('outcome evaluation reports measured metrics', async () => {
  const result = await evaluateOutcome({ metrics: ['latency', 'accuracy'], observations: { latency: 120, accuracy: 0.98 } });
  assert.equal(result.status, 'measured'); assert.equal(result.score, 1);
});
test('intelligence plans create worker tasks without claiming completion', async () => {
  const plan = await createIntelligencePlan({ goal: 'Improve AION test reliability', metrics: ['pass_rate'] });
  assert.equal(plan.status, 'planned'); assert.equal(plan.guarantees.noFakeCompletion, true);
  assert.equal(plan.stages.length, 6); assert.equal(plan.tasks.length, 6);
});