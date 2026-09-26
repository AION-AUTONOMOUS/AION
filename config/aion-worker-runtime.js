import { dispatchTask } from './aion-workers.js';
import { resetStore } from './aion-ops-engine.js';
import { listTasks, updateTask } from './aion-ops-store.js';

export const RUNTIME_VERSION = '1.1.0';
export const MAX_CONCURRENCY = 20;
const running = new Set();
let actionExecutor = defaultActionExecutor;

async function defaultActionExecutor(task) {
  if (!process.env.GROQ_API_KEY) throw new Error('AI provider is not configured');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: 'You are an AION worker. Analyze the registered task and return a concise actionable result. Never claim external side effects unless an execution adapter performed them.' },
        { role: 'user', content: task.text }
      ],
      temperature: 0.2
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'AI provider error');
  const output = data.choices?.[0]?.message?.content;
  if (typeof output !== 'string' || !output.trim()) throw new Error('AI provider returned no worker result');
  return { type: 'ai_analysis', output: output.trim(), model: 'openai/gpt-oss-120b' };
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
    ready: tasks.filter(t => t.status === 'ready').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    awaitingApproval: tasks.filter(t => t.status === 'awaiting_approval').length
  };
}

export async function processOne() {
  const task = (await listTasks()).find(item =>
    item.status === 'ready' && (!item.requiresHumanApproval || item.approvedAt)
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
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - started
    });
  } catch (error) {
    return await updateTask(task.id, {
      status: 'failed',
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
