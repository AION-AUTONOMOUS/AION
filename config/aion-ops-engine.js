import { routeTask, controlPlaneHealth } from './aion-control-plane.js';
import { createTask, updateTask, listTasks, recentEvents, resetStore } from './aion-ops-store.js';

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
  const fleet = controlPlaneHealth().fleet;
  return {
    total_agents: fleet.total_agents,
    version: '1.0.0',
    status: 'ready',
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

export { resetStore };
