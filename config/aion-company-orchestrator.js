import crypto from 'node:crypto';
import { AGENTS, DEPARTMENTS, TOTAL_AGENTS } from './aion-fleet.js';
import { dispatchTask } from './aion-workers.js';
import { openAIConfigured, selectOpenAIModel } from './aion-openai-gateway.js';

export const COMPANY_ORCHESTRATOR_VERSION = '2.1.0';

const MODE_BY_DEPARTMENT = Object.freeze({
  research:'research', data:'research',
  engineering:'engineering', security:'engineering', quality:'engineering', devops:'engineering',
  strategy:'frontier', product:'frontier', finance:'frontier', legal:'frontier', compliance:'frontier',
  marketing:'volume', growth:'volume', sales:'volume', partnerships:'volume',
  support:'volume', content:'volume', operations:'volume', people:'volume', communications:'volume'
});

export function companyOrchestratorHealth() {
  return {
    version: COMPANY_ORCHESTRATOR_VERSION,
    status: openAIConfigured() ? 'operational' : 'awaiting-openai-secret',
    provider: 'OpenAI',
    departments: Object.keys(DEPARTMENTS).length,
    registeredAgentRoles: TOTAL_AGENTS,
    roleRegistryIntegrity: AGENTS.length === TOTAL_AGENTS,
    modelRouting: MODE_BY_DEPARTMENT,
    execution: 'dispatchTask -> durable queue -> Worker Runtime -> OpenAI',
    completionPolicy: 'evidence-required',
    fakeCompletion: false
  };
}

export function planCompanyWork(input = {}) {
  const goal = String(input.goal || '').trim();
  if (!goal) throw new Error('goal required');
  const tasks = Array.isArray(input.tasks) && input.tasks.length
    ? input.tasks
    : Object.keys(DEPARTMENTS).map(department => ({ department, text: goal }));

  return tasks.map((task, index) => {
    const department = String(task.department || '').trim() || undefined;
    const mode = MODE_BY_DEPARTMENT[department] || 'frontier';
    return {
      id: 'AION-WORK-' + crypto.randomUUID(),
      sequence: index + 1,
      department: department || null,
      mode,
      model: selectOpenAIModel(mode),
      status: 'ready-for-dispatch'
    };
  });
}

export async function executeCompanyTask(input = {}) {
  const goal = String(input.text || input.prompt || '').trim();
  if (!goal) throw new Error('task text required');

  const mode = MODE_BY_DEPARTMENT[String(input.department || '').trim()] || 'frontier';
  const dispatched = await dispatchTask({
    ...input,
    text: goal,
    mode,
    model: input.model || selectOpenAIModel(mode),
    source: 'company-orchestrator-v2'
  });

  return {
    ...dispatched,
    workId: dispatched.task?.id || 'AION-WORK-' + crypto.randomUUID(),
    status: dispatched.action === 'queued_for_worker'
      ? 'queued'
      : dispatched.action === 'await_human_approval'
        ? 'awaiting-owner-approval'
        : dispatched.action === 'blocked_by_policy'
          ? 'blocked-by-policy'
          : dispatched.task?.status || 'queued',
    fakeCompletion: false
  };
}
