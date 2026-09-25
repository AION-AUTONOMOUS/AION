import { dispatchTask } from './aion-workers.js';
import { resetStore } from './aion-ops-engine.js';
import { listTasks } from './aion-ops-store.js';

export const RUNTIME_VERSION = '1.0.0';
export const MAX_CONCURRENCY = 20;

const running = new Set();

export function submitTask(input = {}) {
  return dispatchTask(input);
}

export async function workerRuntimeStatus() {
  const tasks = await listTasks();
  return {
    version: RUNTIME_VERSION,
    maxConcurrency: MAX_CONCURRENCY,
    activeWorkers: running.size,
    ready: tasks.filter(t => t.status === 'ready').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    awaitingApproval: tasks.filter(t => t.status === 'awaiting_approval').length
  };
}

export async function processOne() {
  const task = (await listTasks()).find(item => item.status === 'ready');
  if (!task || running.size >= MAX_CONCURRENCY) return null;

  running.add(task.id);
  const started = Date.now();
  try {
    // Execution boundary: workers perform only approved, registered actions.
    // Side-effect adapters can be attached here without granting arbitrary access.
    const { updateTask } = await import('./aion-ops-store.js');
    await updateTask(task.id, { status: 'running', startedAt: new Date().toISOString() });
    return await updateTask(task.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - started
    });
  } catch (error) {
    const { updateTask } = await import('./aion-ops-store.js');
    return await updateTask(task.id, {
      status: 'failed',
      error: String(error?.message || error),
      failedAt: new Date().toISOString()
    });
  } finally {
    running.delete(task.id);
  }
}

export async function processBatch(limit = MAX_CONCURRENCY) {
  const count = Math.max(1, Math.min(Number(limit) || MAX_CONCURRENCY, MAX_CONCURRENCY));
  const jobs = [];
  for (let i = 0; i < count; i += 1) jobs.push(processOne());
  const results = await Promise.all(jobs);
  return results.filter(Boolean);
}

export { resetStore };
