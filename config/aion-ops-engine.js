import { routeTask, controlPlaneHealth } from './aion-control-plane.js';
import { createTask, updateTask, listTasks, recentEvents, resetStore, opsStorageHealth } from './aion-ops-store.js';
import { hasRailwayRedis, railwayRedisCommand } from './aion-redis.js';

const WORKER_QUEUE = 'aion:worker:pending';

export async function enqueueDurableWorker(task) {
  if (!hasRailwayRedis() || !task || task.status !== 'ready') return null;
  const payload = JSON.stringify({ taskId: task.id, enqueuedAt: new Date().toISOString() });
  await railwayRedisCommand([
    'HSET',
    'aion:worker:job:' + task.id,
    'taskId', task.id,
    'payload', payload,
    'status', 'pending',
    'attempts', '0',
    'enqueuedAt', String(Date.now())
  ]);
  await railwayRedisCommand(['LPUSH', WORKER_QUEUE, task.id]);
  return task.id;
}

export async function enqueueTask(input) {
  const task = await createTask(input);
  const route = routeTask(task);
  const updated = await updateTask(task.id, {
    department: route.department,
    agentId: route.agent.id,
    commanderId: route.commander.id,
    requiresHumanApproval: route.policy.requiresHumanApproval,
    status: route.policy.requiresHumanApproval ? 'awaiting_approval' : 'ready'
  });
  if (updated?.status === 'ready') await enqueueDurableWorker(updated);
  return { task: updated, route };
}

export async function approveTask(id) {
  const task = (await listTasks()).find(x => x.id === id);
  if (!task || task.status !== 'awaiting_approval') return null;

  const approved = await updateTask(id, {
    status: 'ready',
    approvedAt: new Date().toISOString()
  });

  if (approved?.status === 'ready') await enqueueDurableWorker(approved);
  return approved;
}

export async function opsHealth() {
  const tasks = await listTasks();
  const fleet = controlPlaneHealth().fleet;
  return {
    total_agents: fleet.total_agents,
    version: '1.1.0',
    status: 'ready',
    storage: opsStorageHealth(),
    fleet,
    queued: tasks.filter(t => t.status === 'queued').length,
    awaitingApproval: tasks.filter(t => t.status === 'awaiting_approval').length,
    ready: tasks.filter(t => t.status === 'ready').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    recentEvents: recentEvents(20)
  };
}

export async function runNextTask() {
  const { processOne } = await import('./aion-worker-runtime.js');
  return processOne();
}

export { resetStore };
