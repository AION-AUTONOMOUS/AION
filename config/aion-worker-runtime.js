import { dispatchTask } from './aion-workers.js';
import { resetStore } from './aion-ops-engine.js';
import { listTasks, updateTask } from './aion-ops-store.js';
import { runOpenAI } from './aion-openai-gateway.js';

export const RUNTIME_VERSION = '1.3.0';
export const MAX_CONCURRENCY = 20;
const running = new Set();
let actionExecutor = defaultActionExecutor;

async function defaultActionExecutor(task) {
  const result = await runOpenAI({
    prompt: task.text,
    mode: task.mode || 'frontier',
    model: task.model,
    instructions: 'You are an AION Worker. Return an evidence-oriented, actionable result. Distinguish verified facts from assumptions. Never claim an external side effect occurred unless a registered executor confirms it.'
  });

  const evidence = {
    type: 'openai-response',
    provider: 'OpenAI',
    responseId: result.responseId,
    requestId: result.requestId,
    model: result.model,
    measured: true
  };
  const verification = {
    status: result.responseId && result.text ? 'verified-output' : 'verification-failed',
    checks: {
      providerResponseId: Boolean(result.responseId),
      nonEmptyOutput: Boolean(result.text)
    }
  };
  if (verification.status !== 'verified-output') {
    throw new Error('worker result failed evidence verification');
  }

  return { ...result, evidence, verification };
}

export function setActionExecutor(executor) {
  if (typeof executor !== 'function') throw new TypeError('executor must be a function');
  actionExecutor = executor;
}

export async function submitTask(input = {}) {
  return dispatchTask(input);
}

export async function workerRuntimeStatus() {
  const tasks = await listTasks();
  return {
    version: RUNTIME_VERSION,
    maxConcurrency: MAX_CONCURRENCY,
    activeWorkers: running.size,
    ready: tasks.filter(t => t.status === 'ready' || t.status === 'queued').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    awaitingApproval: tasks.filter(t => t.status === 'awaiting_approval').length
  };
}

export async function processOne() {
  const task = (await listTasks()).find(item =>
    (item.status === 'ready' || item.status === 'queued') &&
    (!item.requiresHumanApproval || item.approvedAt)
  );
  if (!task || running.size >= MAX_CONCURRENCY) return null;

  running.add(task.id);
  const started = Date.now();
  try {
    await updateTask(task.id, { status: 'running', startedAt: new Date().toISOString() });
    const result = await actionExecutor(task);
    return await updateTask(task.id, {
      status: 'completed',
      result,
      evidence: result?.evidence || null,
      verification: result?.verification || null,
      outcome: {
        status: 'completed',
        recordedAt: new Date().toISOString(),
        evidenceBacked: Boolean(result?.evidence && result?.verification?.status === 'verified-output')
      },
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - started
    });
  } catch (error) {
    return await updateTask(task.id, {
      status: 'failed',
      verification: { status: 'failed', reason: String(error?.message || error) },
      outcome: { status: 'failed', recordedAt: new Date().toISOString() },
      error: String(error?.message || error),
      failedAt: new Date().toISOString(),
      durationMs: Date.now() - started
    });
  } finally {
    running.delete(task.id);
  }
}

export async function processBatch(limit = MAX_CONCURRENCY) {
  const count = Math.max(1, Math.min(Number(limit) || MAX_CONCURRENCY, MAX_CONCURRENCY));
  const jobs = [];
  for (let i = 0; i < count; i += 1) jobs.push(processOne());
  return (await Promise.all(jobs)).filter(Boolean);
}

export { resetStore };
