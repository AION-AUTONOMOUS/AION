import { dispatchTask } from './aion-workers.js';
import { resetStore } from './aion-ops-engine.js';
import { getTask, listTasks, updateTask } from './aion-ops-store.js';
import { hasRailwayRedis, railwayRedisCommand } from './aion-redis.js';
import { runOpenAI, selectOpenAIModel } from './aion-openai-gateway.js';
import { AGENTS, TOTAL_AGENTS } from './aion-fleet.js';

export const RUNTIME_VERSION = '2.0.0';
export const MAX_CONCURRENCY = Math.max(1, Math.min(Number(process.env.AION_MAX_ACTIVE_WORKERS) || 20, 1000));
const running = new Set();

const MODE_BY_DEPARTMENT = Object.freeze({
  research:'research', data:'research',
  engineering:'engineering', security:'engineering', quality:'engineering', devops:'engineering',
  strategy:'frontier', product:'frontier', finance:'frontier', legal:'frontier', compliance:'frontier',
  marketing:'volume', growth:'volume', sales:'volume', partnerships:'volume',
  support:'volume', content:'volume', operations:'volume', people:'volume', communications:'volume'
});

const PENDING = 'aion:worker:pending';
const PROCESSING = 'aion:worker:processing';
const JOB = id => 'aion:worker:job:' + id;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function modeFor(task) {
  return MODE_BY_DEPARTMENT[task?.department] || 'frontier';
}

async function executeTask(task) {
  const mode = modeFor(task);
  const result = await runOpenAI({
    prompt: task.text,
    mode,
    model: selectOpenAIModel(mode),
    instructions:
      'You are an AION production worker. Execute the assigned analytical/software task using the information available to you. Distinguish evidence from assumptions. Never claim an external action occurred unless an AION execution adapter confirms it. Return a concise result with findings, actions proposed or performed, evidence, and next step.'
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
  return {
    type: 'openai_worker_result',
    output: result.text,
    model: result.model,
    mode,
    openAIResponseId: result.responseId,
    usage: result.usage,
    evidence,
    verification,
    measured: true
  };
}

async function claimDurableJob() {
  if (!hasRailwayRedis()) return null;
  const id = await railwayRedisCommand(['BLMOVE', PENDING, PROCESSING, 'LEFT', 'RIGHT', '1']);
  if (!id) return null;
  const raw = await railwayRedisCommand(['HGETALL', JOB(id)]);
  const meta = raw && !Array.isArray(raw) ? raw : {};
  const attempts = Number(meta.attempts || 0) + 1;
  await railwayRedisCommand([
    'HSET', JOB(id),
    'status', 'processing',
    'attempts', String(attempts),
    'claimedAt', String(Date.now())
  ]);
  return { id, attempts, taskId: meta.taskId || id };
}

async function finishDurableJob(job, result) {
  await railwayRedisCommand(['LREM', PROCESSING, '1', job.id]);
  await railwayRedisCommand([
    'HSET', JOB(job.id),
    'status', 'completed',
    'result', JSON.stringify(result),
    'completedAt', String(Date.now())
  ]);
}

async function failDurableJob(job, error) {
  const message = String(error?.message || error);
  await railwayRedisCommand(['LREM', PROCESSING, '1', job.id]);
  if (job.attempts < 4) {
    await railwayRedisCommand(['HSET', JOB(job.id), 'status', 'pending', 'lastError', message]);
    await railwayRedisCommand(['LPUSH', PENDING, job.id]);
    return;
  }
  await railwayRedisCommand(['HSET', JOB(job.id), 'status', 'failed', 'lastError', message, 'failedAt', String(Date.now())]);
}

export function setActionExecutor() {
  throw new Error('Action executor override is disabled: production runtime uses the OpenAI Intelligence Core.');
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
    durableQueue: hasRailwayRedis(),
    ready: tasks.filter(t => t.status === 'ready').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    awaitingApproval: tasks.filter(t => t.status === 'awaiting_approval').length
  };
}


export async function activateFleetCycle(goal, options = {}) {
  const text = String(goal || '').trim();
  if (!text) throw new Error('goal required');
  const limit = Math.max(1, Math.min(Number(options.limit) || TOTAL_AGENTS, TOTAL_AGENTS));
  const chunkSize = Math.max(1, Math.min(Number(options.chunkSize) || 100, 250));
  let queued = 0;
  let awaitingApproval = 0;
  let blocked = 0;
  for (let start = 0; start < limit; start += chunkSize) {
    const batch = AGENTS.slice(start, Math.min(start + chunkSize, limit));
    const results = await Promise.all(batch.map(agent => dispatchTask({
      type: agent.department,
      department: agent.department,
      agentId: agent.id,
      role: agent.id,
      text: text + '\nAssigned role: ' + agent.id + '. Specialty: ' + agent.specialty
    })));
    queued += results.filter(item => item.action === 'queued_for_worker').length;
    awaitingApproval += results.filter(item => item.action === 'await_human_approval').length;
    blocked += results.filter(item => item.action === 'blocked_by_policy').length;
  }
  return {
    status: 'activated',
    requestedRoles: limit,
    totalRegisteredRoles: TOTAL_AGENTS,
    queuedForWorkers: queued,
    awaitingOwnerApproval: awaitingApproval,
    blockedByPolicy: blocked,
    durableQueue: hasRailwayRedis(),
    workerConcurrency: MAX_CONCURRENCY
  };
}

export async function processOne() {
  if (running.size >= MAX_CONCURRENCY) return null;

  let durableJob = await claimDurableJob();
  let task = null;

  if (durableJob) {
    task = await getTask(durableJob.taskId);
    if (!task || task.status !== 'ready') {
      await finishDurableJob(durableJob, { skipped: true, reason: 'task-not-ready-or-already-completed' });
      return null;
    }
  } else {
    task = (await listTasks()).find(item =>
      item.status === 'ready' && (!item.requiresHumanApproval || item.approvedAt)
    );
    if (!task) return null;
  }

  running.add(task.id);
  const started = Date.now();
  try {
    await updateTask(task.id, { status: 'running', startedAt: new Date().toISOString(), workerRuntimeVersion: RUNTIME_VERSION });
    const result = await executeTask(task);
    const completed = await updateTask(task.id, {
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
    if (durableJob) await finishDurableJob(durableJob, result);
    return completed;
  } catch (error) {
    const failed = await updateTask(task.id, {
      status: 'failed',
      verification: { status: 'failed', reason: String(error?.message || error) },
      outcome: { status: 'failed', recordedAt: new Date().toISOString() },
      error: String(error?.message || error),
      failedAt: new Date().toISOString(),
      durationMs: Date.now() - started
    });
    if (durableJob) await failDurableJob(durableJob, error);
    return failed;
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

export async function runWorkerLoop(options = {}) {
  const intervalMs = Math.max(250, Number(options.intervalMs) || 1000);
  const batchSize = Math.max(1, Math.min(Number(options.batchSize) || MAX_CONCURRENCY, MAX_CONCURRENCY));
  let cycles = 0;
  while (options.signal?.aborted !== true) {
    await processBatch(batchSize);
    cycles += 1;
    if (options.once === true || cycles >= Number(options.maxCycles || 0) && Number(options.maxCycles || 0) > 0) break;
    await sleep(intervalMs);
  }
  return workerRuntimeStatus();
}

export { resetStore };
