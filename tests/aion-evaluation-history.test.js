import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluationHistoryHealth,
  recordEvaluation,
  getEvaluation,
  listEvaluationHistory
} from '../config/aion-evaluation-history.js';

test('evaluation history is audit-oriented and durable when configured', () => {
  const health = evaluationHistoryHealth();
  assert.equal(health.status, 'ready');
  assert.equal(health.auditTrail, true);
  assert.equal(health.fabricatedResults, false);
});

test('evaluation records persist and can be retrieved', async () => {
  const record = await recordEvaluation('AION-BENCH-test', {
    metrics: { reasoning: 0.8 },
    overall: 0.8,
    status: 'measured'
  });

  assert.match(record.id, /^AION-EVAL-/);
  assert.equal((await getEvaluation(record.id)).benchmarkId, 'AION-BENCH-test');

  const history = await listEvaluationHistory('AION-BENCH-test');
  assert.equal(history.length, 1);
  assert.equal(history[0].evaluation.overall, 0.8);
});
