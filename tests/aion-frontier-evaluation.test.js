import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createBenchmark,
  evaluateBenchmark,
  frontierEvaluationHealth
} from '../config/aion-frontier-evaluation.js';

test('frontier evaluation health is measurement-first', () => {
  const health = frontierEvaluationHealth();
  assert.equal(health.status, 'ready');
  assert.equal(health.measurementFirst, true);
  assert.equal(health.fabricatedScores, false);
});

test('benchmark definition is explicit and evidence-gated', () => {
  const benchmark = createBenchmark({
    name: 'AION reasoning baseline',
    objective: 'Measure reasoning reliability',
    metrics: ['reasoning', 'reliability'],
    cases: 20
  });

  assert.match(benchmark.id, /^AION-BENCH-/);
  assert.deepEqual(benchmark.metrics, ['reasoning', 'reliability']);
  assert.equal(benchmark.status, 'defined');
});

test('evaluation only reports supplied bounded measurements', () => {
  const benchmark = createBenchmark({
    name: 'bounded test',
    metrics: ['accuracy', 'reasoning']
  });

  const measured = evaluateBenchmark(benchmark, {
    accuracy: 0.8,
    reasoning: 0.6,
    unsupported: 999,
    invalid: 2
  });

  assert.deepEqual(measured.metrics, { accuracy: 0.8, reasoning: 0.6 });
  assert.equal(measured.overall, 0.7);
  assert.equal(measured.status, 'measured');
});

test('missing evidence never becomes a fabricated score', () => {
  const benchmark = createBenchmark({
    name: 'evidence gate',
    metrics: ['accuracy']
  });

  const result = evaluateBenchmark(benchmark, {});
  assert.deepEqual(result.metrics, {});
  assert.equal(result.overall, null);
  assert.equal(result.status, 'awaiting-evidence');
});
