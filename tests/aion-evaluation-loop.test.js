import test from 'node:test';
import assert from 'node:assert/strict';
import { createBenchmark } from '../config/aion-frontier-evaluation.js';
import { compareEvaluationRuns, createEvaluationRun, evaluationLoopHealth } from '../config/aion-evaluation-loop.js';

test('evaluation loop is continuous and evidence gated', () => {
  const health = evaluationLoopHealth();
  assert.equal(health.status, 'ready');
  assert.equal(health.continuous, true);
  assert.equal(health.fabricatedResults, false);
});

test('evaluation run records measured evidence and next action', () => {
  const benchmark = createBenchmark({ name: 'loop', metrics: ['reasoning'] });
  const run = createEvaluationRun({ benchmark, cycleId: 'AION-CYCLE-test', results: { reasoning: 0.7 } });
  assert.match(run.id, /^AION-EVAL-/);
  assert.equal(run.status, 'measured');
  assert.equal(run.nextAction, 'compare-and-learn');
});

test('comparison reports deltas only for measured common metrics', () => {
  const benchmark = createBenchmark({ name: 'compare', metrics: ['reasoning'] });
  const a = createEvaluationRun({ benchmark, results: { reasoning: 0.6 } });
  const b = createEvaluationRun({ benchmark, results: { reasoning: 0.8 } });
  const result = compareEvaluationRuns(a, b);
  assert.ok(Math.abs(result.metrics.reasoning.delta - 0.2) < 1e-12);
  assert.equal(result.status, 'compared');
});
