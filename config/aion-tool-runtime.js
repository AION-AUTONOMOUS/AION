import { runOpenAI } from './aion-openai-gateway.js';

export const TOOL_RUNTIME_VERSION = '1.0.0';

export async function runToolAwareTask(task = {}) {
  const result = await runOpenAI({
    prompt: task.text || task.goal || 'Execute the assigned AION task.',
    mode: task.mode || 'frontier'
  });
  return {
    status: 'evidence-ready',
    provider: 'OpenAI',
    responseId: result.responseId,
    model: result.model,
    text: result.text,
    toolsUsed: result.toolsUsed || []
  };
}
