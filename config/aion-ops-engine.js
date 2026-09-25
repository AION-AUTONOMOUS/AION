import { routeTask, controlPlaneHealth } from './aion-control-plane.js';
import { createTask, updateTask, listTasks, recentEvents } from './aion-ops-store.js';

export function enqueueTask(input) {
  const task = createTask(input);
  const route = routeTask(task);
  updateTask(task.id, {
    department: route.department,
    agentId: route.agent.id,
    commanderId: route.commander.id,
    requiresHumanApproval: route.policy.requiresHumanApproval,
    status: route.policy.requiresHumanApproval ? 'awaiting_approval' : 'ready'
  });
  return { task: listTasks().find(item => item.id === task.id), route };
}

export function runNextTask() {
  const task = listTasks().find(item => item.status === 'ready');
  if (!task) return null;
  updateTask(task.id, { status: 'running', startedAt: new Date().toISOString() });

  // Execution is intentionally represented as a controlled state transition.
  // Real side-effecting workers plug into this boundary later.
  return updateTask(task.id, {
    status: 'completed',
    completedAt: new Date().toISOString()
  });
}

export function approveTask(id) {
  const task = listTasks().find(item => item.id === id);
  if (!task || task.status !== 'awaiting_approval') return null;
  return updateTask(id, { status: 'ready', approvedAt: new Date().toISOString() });
}

export function opsHealth() {
  const tasks = listTasks();
  return {
    ...controlPlaneHealth(),
    queued: tasks.filter(t => t.status === 'queued').length,
    awaitingApproval: tasks.filter(t => t.status === 'awaiting_approval').length,
    ready: tasks.filter(t => t.status === 'ready').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    recentEvents: recentEvents(20)
  };
}
