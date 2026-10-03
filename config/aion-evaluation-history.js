import crypto from 'node:crypto';
import { getJson, setJson } from './aion-stack-store.js';

export const EVALUATION_HISTORY_VERSION = '1.0.1';

function text(value) {
  return String(value ?? '').trim();
}

export function evaluationHistoryHealth() {
  return {
    version: EVALUATION_HISTORY_VERSION,
    status: 'ready',
    durableWhenConfigured: true,
    auditTrail: true,
    fabricatedResults: false
  };
}

export async function recordEvaluation(benchmarkId, evaluation = {}) {
  const id = text(benchmarkId);
  if (!id) throw new Error('benchmarkId required');

  const record = {
    id: 'AION-EVAL-' + crypto.randomUUID(),
    benchmarkId: id,
    evaluation: {
      metrics: evaluation.metrics ?? {},
      overall: evaluation.overall ?? null,
      status: text(evaluation.status) || 'awaiting-evidence'
    },
    recordedAt: new Date().toISOString()
  };

  await setJson('evaluation:' + record.id, record);
  const indexKey = 'index:evaluations:' + id;
  const ids = await getJson(indexKey);
  await setJson(indexKey, [...(Array.isArray(ids) ? ids : []), record.id]);
  return record;
}

export async function getEvaluation(id) {
  return getJson('evaluation:' + text(id));
}

export async function listEvaluationHistory(benchmarkId, limit = 20) {
  const ids = await getJson('index:evaluations:' + text(benchmarkId));
  if (!Array.isArray(ids)) return [];

  const boundedLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const records = [];
  for (const id of ids.slice(-boundedLimit).reverse()) {
    const record = await getEvaluation(id);
    if (record) records.push(record);
  }
  return records;
}
