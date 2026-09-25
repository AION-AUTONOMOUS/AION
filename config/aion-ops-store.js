import crypto from 'node:crypto';

const tasks = new Map();
const events = [];

export function createTask(input = {}) {
  const id = 'AION-TASK-' + crypto.randomUUID();
  const task = {
    id,
    type: String(input.type || 'general'),
    text: String(input.text || '').trim(),
    status: 'queued',
    priority: Number.isFinite(input.priority) ? input.priority : 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tasks.set(id, task);
  events.push({ type: 'task.created', taskId: id, at: task.createdAt });
  return task;
}

export function updateTask(id, patch = {}) {
  const task = tasks.get(id);
  if (!task) return null;
  Object.assign(task, patch, { updatedAt: new Date().toISOString() });
  events.push({ type: 'task.updated', taskId: id, at: task.updatedAt });
  return task;
}

export function getTask(id) {
  return tasks.get(id) || null;
}

export function listTasks() {
  return [...tasks.values()].sort((a, b) => b.priority - a.priority);
}

export function recentEvents(limit = 50) {
  return events.slice(-Math.max(1, Math.min(limit, 200)));
}

export function resetStore() {
  tasks.clear();
  events.length = 0;
}
