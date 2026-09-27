import crypto from 'node:crypto';

export const FRONTIER_EVALUATION_VERSION = '1.0.0';

const DEFAULT_METRICS = Object.freeze([
  'accuracy',
  'reasoning',
  'tool_use',
  'reliability'
]);

function text(value) {
  return String(value ?? '').trim();
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function frontierEvaluationHealth() {
  return {
    version: FRONTIER_EVALUATION_VERSION,
    status: 'ready',
    measurementFirst: true,
    evidenceRequired: true,
    fabricatedScores: false,
    defaultMetrics: [...DEFAULT_METRICS]
  };
}

export function createBenchmark(input = {}) {
  const name = text(input.name);
  if (!name) throw new Error('benchmark name required');

  const metrics = Array.isArray(input.metrics)
    ? input.metrics.map(text).filter(Boolean)
    : [...DEFAULT_METRICS];

  return {
    id: 'AION-BENCH-' + crypto.randomUUID(),
    name,
    objective: text(input.objective),
    metrics,
    cases: Number.isInteger(input.cases) && input.cases >= 0 ? input.cases : 0,
    status: 'defined',
    evidencePolicy: 'results-required',
    createdAt: new Date().toISOString()
  };
}

export function evaluateBenchmark(benchmark, results = {}) {
  if (!benchmark || !benchmark.id) throw new Error('benchmark required');

  const scores = {};
  for (const metric of benchmark.metrics ?? DEFAULT_METRICS) {
    const score = finiteNumber(results[metric]);
    if (score !== null && score >= 0 && score <= 1) scores[metric] = score;
  }

  const observed = Object.values(scores);
  const overall = observed.length
    ? observed.reduce((sum, score) => sum + score, 0) / observed.length
    : null;

  return {
    benchmarkId: benchmark.id,
    metrics: scores,
    overall,
    evaluatedMetrics: observed.length,
    status: observed.length ? 'measured' : 'awaiting-evidence',
    evidenceRequired: true,
    claimPolicy: 'do-not-infer-unmeasured-capabilities',
    evaluatedAt: new Date().toISOString()
  };
}

export { DEFAULT_METRICS };
