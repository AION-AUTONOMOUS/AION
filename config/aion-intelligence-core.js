import { routeTask } from './aion-control-plane.js';
import { runOpenAI, selectOpenAIModel } from './aion-openai-gateway.js';

export const INTELLIGENCE_CORE_VERSION = '1.0.0';

const MODE_BY_DEPARTMENT = Object.freeze({
  research: 'research',
  engineering: 'engineering',
  security: 'engineering',
  quality: 'engineering',
  devops: 'engineering',
  data: 'research',
  strategy: 'frontier',
  product: 'frontier',
  finance: 'frontier',
  legal: 'frontier',
  compliance: 'frontier',
  marketing: 'volume',
  growth: 'volume',
  sales: 'volume',
  partnerships: 'volume',
  support: 'volume',
  content: 'volume',
  operations: 'volume',
  people: 'volume',
  communications: 'volume'
});

export function intelligenceCoreHealth() {
  return {
    version: INTELLIGENCE_CORE_VERSION,
    status: 'operational-when-openai-configured',
    routing: 'control-plane',
    modelSelection: 'department-aware',
    execution: 'registered-workers-and-adapters',
    verification: 'required',
    learning: 'AION intelligence and evaluation loops',
    fakeCompletion: false
  };
}

export function selectDepartmentMode(department) {
  return MODE_BY_DEPARTMENT[department] || 'frontier';
}

export async function runIntelligenceTask(input = {}) {
  const routing = routeTask(input);
  if (routing.policy.blocked) {
    return {
      status: 'blocked_by_policy',
      routing,
      fakeCompletion: false
    };
  }

  const mode = selectDepartmentMode(routing.department);
  const result = await runOpenAI({
    prompt: input.prompt || input.text,
    mode,
    webSearch: input.webSearch,
    vectorStoreId: input.vectorStoreId,
    toolChoice: input.toolChoice
  });

  return {
    ...result,
    coreVersion: INTELLIGENCE_CORE_VERSION,
    department: routing.department,
    commander: routing.commander.id,
    selectedModel: selectOpenAIModel(mode),
    policy: routing.policy,
    nextStep: 'verify-through-AION-workers'
  };
}
