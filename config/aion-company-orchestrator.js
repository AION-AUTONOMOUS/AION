import crypto from 'node:crypto';
import { AGENTS, DEPARTMENTS, TOTAL_AGENTS } from './aion-fleet.js';
import { routeTask } from './aion-control-plane.js';
import { runOpenAI, openAIConfigured, selectOpenAIModel } from './aion-openai-gateway.js';

export const COMPANY_ORCHESTRATOR_VERSION = '2.0.0';

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
    execution: 'real OpenAI calls + registered worker adapters',
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
    const route = routeTask(task);
    const mode = MODE_BY_DEPARTMENT[route.department] || 'frontier';
    return {
      id: 'AION-WORK-' + crypto.randomUUID(),
      sequence: index + 1,
      department: route.department,
      agentRole: route.agent,
      commander: route.commander,
      mode,
      model: selectOpenAIModel(mode),
      policy: route.policy,
      status: route.policy.blocked ? 'blocked-by-policy' :
        route.policy.requiresHumanApproval ? 'awaiting-owner-approval' : 'planned'
    };
  });
}

export async function executeCompanyTask(input = {}) {
  const route = routeTask(input);
  if (route.policy.blocked) {
    return { status:'blocked-by-policy', route, fakeCompletion:false };
  }
  if (route.policy.requiresHumanApproval && !input.ownerApproval) {
    return { status:'awaiting-owner-approval', route, fakeCompletion:false };
  }
  const mode = MODE_BY_DEPARTMENT[route.department] || 'frontier';
  const result = await runOpenAI({ ...input, mode });
  return {
    status:'completed',
    workId:'AION-WORK-' + crypto.randomUUID(),
    route,
    mode,
    result,
    evidence:{ openAIResponseId: result.responseId, measured: true },
    fakeCompletion:false
  };
}
