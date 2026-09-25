import { routeTask } from './aion-control-plane.js';
import { getTask } from './aion-ops-store.js';
import { enqueueTask, approveTask, runNextTask } from './aion-ops-engine.js';

export const WORKER_VERSION = '1.0.0';

const WORKER_CAPABILITIES = Object.freeze({
  engineering: ['code', 'bug', 'api', 'compile', 'test', 'deploy'],
  security: ['security', 'secret', 'vulnerability', 'audit'],
  marketing: ['seo', 'marketing', 'content', 'campaign'],
  sales: ['sales', 'customer', 'lead'],
  finance: ['finance', 'budget', 'invoice'],
  compliance: ['legal', 'contract', 'compliance']
});

export function workerCapabilities(department) {
  return WORKER_CAPABILITIES[department] || ['general'];
}

export function dispatchTask(input = {}) {
  const result = enqueueTask(input);
  const department = result.route.department;
  const task = result.task;

  if (task.status === 'awaiting_approval') {
    return {
      ...result,
      worker: null,
      action: 'await_human_approval'
    };
  }

  const worker = {
    id: result.route.agent.id,
    department,
    capabilities: workerCapabilities(department),
    version: WORKER_VERSION
  };

  return {
    ...result,
    worker,
    action: 'queued_for_worker'
  };
}

export function executeApprovedTask(id) {
  const task = getTask(id);
  if (!task) return null;
  if (task.status === 'awaiting_approval') approveTask(id);
  return runNextTask();
}
