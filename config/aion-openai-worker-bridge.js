import { setActionExecutor } from './aion-worker-runtime.js';
import { runToolAwareTask } from './aion-tool-runtime.js';

export const OPENAI_WORKER_BRIDGE_VERSION = '1.0.0';

export function activateOpenAIWorkerBridge() {
  setActionExecutor(async task => runToolAwareTask(task));
  return { active: true, provider: 'OpenAI', runtime: OPENAI_WORKER_BRIDGE_VERSION };
}
