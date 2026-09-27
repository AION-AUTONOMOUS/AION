import crypto from 'node:crypto';
import { addToIndex, getJson, setJson } from './aion-stack-store.js';
import { dispatchTask } from './aion-workers.js';

export const INTELLIGENCE_LOOP_VERSION = '1.0.0';
const LOOP_STAGES = Object.freeze(['understand','research','plan','execute','verify','learn']);

function text(value) { return String(value ?? '').trim(); }

export function intelligenceLoopHealth() {
  return { version: INTELLIGENCE_LOOP_VERSION, status: 'ready', stages: [...LOOP_STAGES], continuousImprovement: true, fakeCompletion: false, externalSideEffects: 'adapter-and-policy-guarded' };
}

export async function startIntelligenceCycle(input = {}) {
  const goal = text(input.goal);
  if (!goal) throw new Error('goal required');
  const id = 'AION-CYCLE-' + crypto.randomUUID();
  const metrics = Array.isArray(input.metrics) ? input.metrics.map(text).filter(Boolean) : [];
  const tasks = [];
  for (const stage of LOOP_STAGES) {
    const result = await dispatchTask({
      text: 'AION cycle ' + id + ' / ' + stage + ' / goal: ' + goal,
      department: stage === 'research' ? 'research' : stage === 'verify' ? 'quality' : stage === 'learn' ? 'data' : 'strategy',
      sensitive: Boolean(input.sensitive),
      metrics
    });
    tasks.push({ stage, taskId: result.task?.id ?? null, action: result.action });
  }
  const cycle = { id, goal, metrics, tasks, status: 'planned', createdAt: new Date().toISOString(), nextAction: 'execute-ready-tasks', guarantees: { noFakeCompletion: true, workerBacked: true, measuredLearning: true } };
  await setJson('cycle:' + id, cycle);
  await addToIndex('cycles', id);
  return cycle;
}

export async function getIntelligenceCycle(id) { return getJson('cycle:' + text(id)); }

export async function recordLearning(id, learning = {}) {
  const cycle = await getIntelligenceCycle(id);
  if (!cycle) return null;
  const updated = { ...cycle, learning: { observation: learning.observation ?? null, evidence: Array.isArray(learning.evidence) ? learning.evidence.map(text) : [], metrics: learning.metrics ?? {}, recordedAt: new Date().toISOString() }, status: 'learned' };
  await setJson('cycle:' + id, updated);
  return updated;
}

export { LOOP_STAGES };