import crypto from 'node:crypto';
import { evaluateBenchmark } from './aion-frontier-evaluation.js';

export const EVALUATION_LOOP_VERSION = '1.0.0';

function text(value) { return String(value ?? '').trim(); }

export function evaluationLoopHealth() {
  return {
    version: EVALUATION_LOOP_VERSION,
    status: 'ready',
    continuous: true,
    evidenceRequired: true,
    fabricatedResults: false
  };
}

export function createEvaluationRun(input = {}) {
  if (!input.benchmark?.id) throw new Error('benchmark required');

  const result = evaluateBenchmark(input.benchmark, input.results || {});
  return {
    id: 'AION-EVAL-' + crypto.randomUUID(),
    benchmarkId: input.benchmark.id,
    cycleId: text(input.cycleId) || null,
    result,
    status: result.status,
    nextAction: result.status === 'measured'
      ? 'compare-and-learn'
      : 'collect-evidence',
    createdAt: new Date().toISOString()
  };
}

export function compareEvaluationRuns(previous, current) {
  if (!previous?.result || !current?.result) throw new Error('evaluation runs required');

  const metrics = {};
  const names = new Set([
    ...Object.keys(previous.result.metrics || {}),
    ...Object.keys(current.result.metrics || {})
  ]);

  for (const name of names) {
    const before = previous.result.metrics?.[name];
    const after = current.result.metrics?.[name];
    if (Number.isFinite(before) && Number.isFinite(after)) {
      metrics[name] = { before, after, delta: after - before };
    }
  }

  return {
    previousRunId: previous.id,
    currentRunId: current.id,
    metrics,
    comparableMetrics: Object.keys(metrics).length,
    status: Object.keys(metrics).length ? 'compared' : 'insufficient-evidence',
    claimPolicy: 'comparison-only'
  };
}
