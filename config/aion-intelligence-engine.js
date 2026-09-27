import crypto from 'node:crypto';
import { addToIndex, getJson, setJson } from './aion-stack-store.js';
import { dispatchTask } from './aion-workers.js';

export const INTELLIGENCE_VERSION = '1.0.0';
const STAGES = Object.freeze([
  { id: 'understand', department: 'strategy', label: 'Understand goal and define success criteria' },
  { id: 'research', department: 'research', label: 'Gather evidence and relevant context' },
  { id: 'plan', department: 'product', label: 'Build an executable multi-step plan' },
  { id: 'execute', department: 'engineering', label: 'Execute through registered workers and adapters' },
  { id: 'verify', department: 'quality', label: 'Verify outputs against measurable criteria' },
  { id: 'learn', department: 'data', label: 'Record outcomes and improve the next cycle' }
]);
function clean(value, fallback = '') { const text = String(value ?? '').trim(); return text || fallback; }
export function intelligenceHealth() { return { version: INTELLIGENCE_VERSION, status: 'ready', stages: STAGES.map(stage => stage.id), memory: 'durable-when-configured', execution: 'worker-runtime', evaluation: 'measurement-first', fakeCompletion: false }; }
export async function remember(input = {}) {
  const key = clean(input.key); if (!key) throw new Error('memory key required');
  const record = { id: 'AION-MEM-' + crypto.randomUUID(), key, value: input.value ?? null, tags: Array.isArray(input.tags) ? input.tags.map(String) : [], createdAt: new Date().toISOString() };
  await setJson('memory:' + key, record); return record;
}
export async function recall(key) { return getJson('memory:' + clean(key)); }
export async function evaluateOutcome(input = {}) {
  const expected = Array.isArray(input.metrics) ? input.metrics : [];
  const observations = input.observations && typeof input.observations === 'object' ? input.observations : {};
  const results = expected.map(metric => ({ metric: String(metric), observed: observations[String(metric)] ?? null, measured: observations[String(metric)] !== undefined }));
  const measured = results.filter(item => item.measured).length;
  return { status: expected.length === 0 ? 'insufficient_metrics' : measured === expected.length ? 'measured' : 'partial', score: expected.length === 0 ? null : measured / expected.length, results, evaluatedAt: new Date().toISOString() };
}
export async function createIntelligencePlan(input = {}) {
  const goal = clean(input.goal); if (!goal) throw new Error('goal required');
  const metrics = Array.isArray(input.metrics) ? input.metrics.map(String).filter(Boolean) : [];
  const id = 'AION-INT-' + crypto.randomUUID();
  const stages = STAGES.map((stage, index) => ({ ...stage, sequence: index + 1, status: index === 0 ? 'ready' : 'pending' }));
  const tasks = [];
  for (const stage of stages) {
    const result = await dispatchTask({ text: 'AION intelligence plan ' + id + '. Stage: ' + stage.label + '. Goal: ' + goal, department: stage.department, sensitive: Boolean(input.sensitive), metrics });
    tasks.push({ stage: stage.id, taskId: result.task?.id ?? null, action: result.action });
  }
  const plan = { id, goal, metrics, stages, tasks, status: 'planned', createdAt: new Date().toISOString(), guarantees: { noFakeCompletion: true, executionViaWorkers: true, measurementFirst: true } };
  await setJson('intelligence:' + id, plan); await addToIndex('plans', id); return plan;
}
export async function getIntelligencePlan(id) { return getJson('intelligence:' + clean(id)); }
