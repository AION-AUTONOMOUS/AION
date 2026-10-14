import { dispatchTask } from './aion-workers.js';
import { listTasks } from './aion-ops-store.js';
import { hasRailwayRedis, railwayRedisCommand } from './aion-redis.js';

const COOLDOWN_KEY = 'aion:executive:supervisor:last-enqueued';
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const ACTIVE = new Set(['queued', 'ready', 'running', 'awaiting_approval', 'queued_for_worker']);

export async function runExecutiveSupervisorCycle({ force = false } = {}) {
  const tasks = await listTasks();
  const existing = tasks.find(task =>
    task?.role === 'executive-supervisor' &&
    ACTIVE.has(task.status)
  );
  if (existing) return { status: 'skipped', reason: 'supervisor_task_already_active', taskId: existing.id };

  const now = Date.now();
  if (hasRailwayRedis() && !force) {
    const previous = Number(await railwayRedisCommand(['GET', COOLDOWN_KEY]) || 0);
    if (Number.isFinite(previous) && previous > 0 && now - previous < COOLDOWN_MS) {
      return { status: 'skipped', reason: 'daily_cooldown', nextEligibleAt: new Date(previous + COOLDOWN_MS).toISOString() };
    }
  }

  const result = await dispatchTask({
    role: 'executive-supervisor',
    department: 'strategy',
    title: 'AION daily executive operating cycle',
    text: [
      'Act as AION Autonomous Global Network executive supervisor. Perform one bounded internal operating cycle.',
      'Use approved read-only tools to inspect runtime/task health, offer catalog, payment-confirmed revenue/orders, prospects, and leads.',
      'Identify the single highest-value next internal action based on evidence. Do not claim revenue, customer contact, contracts, or partnerships without recorded proof.',
      'If a concrete internal software or analysis task is justified, create at most one follow-up internal task. Do not send external messages, make purchases, initiate/capture payments, move funds, alter credentials, or make legal/financial commitments.',
      'Report source evidence, uncertainty, chosen action, and measurable completion criteria. If no evidence-backed action exists, report that explicitly.'
    ].join('\n'),
    priority: 'high',
    requiresHumanApproval: false,
    metadata: { supervisorCycle: true, evidenceRequired: true, maxFollowUpTasks: 1 }
  });

  if (result?.task?.id && hasRailwayRedis()) {
    await railwayRedisCommand(['SET', COOLDOWN_KEY, String(now)]);
  }
  return {
    status: result?.task?.id ? 'enqueued' : 'not_enqueued',
    taskId: result?.task?.id || null,
    taskStatus: result?.task?.status || null,
    action: result?.action || null
  };
}

export default runExecutiveSupervisorCycle;
