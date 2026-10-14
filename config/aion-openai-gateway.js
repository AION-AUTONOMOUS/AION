import crypto from 'node:crypto';

export const OPENAI_GATEWAY_VERSION = '1.1.0';
export const OPENAI_DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-sol';
export const OPENAI_REQUEST_TIMEOUT_MS = (() => {
  const configured = Number.parseInt(process.env.OPENAI_REQUEST_TIMEOUT_MS || '', 10);
  return Number.isInteger(configured) && configured >= 1000 && configured <= 120000
    ? configured
    : 30000;
})();

const MODEL_BY_MODE = Object.freeze({
  frontier: process.env.OPENAI_FRONTIER_MODEL || OPENAI_DEFAULT_MODEL,
  engineering: process.env.OPENAI_ENGINEERING_MODEL || OPENAI_DEFAULT_MODEL,
  research: process.env.OPENAI_RESEARCH_MODEL || OPENAI_DEFAULT_MODEL,
  volume: process.env.OPENAI_VOLUME_MODEL || 'gpt-5.6-luna'
});

const MODES = Object.freeze(['frontier', 'engineering', 'research', 'volume']);
const MAX_TOOL_CALLS = 5;
const MAX_TOOL_OUTPUT_CHARS = 12000;

function clean(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function boundedTimeout(value) {
  return Number.isInteger(value) && value >= 1000 && value <= 120000
    ? value
    : OPENAI_REQUEST_TIMEOUT_MS;
}

function extractText(response) {
  if (typeof response?.output_text === 'string') return response.output_text;
  const parts = [];
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

function functionCalls(response) {
  return (response?.output || []).filter(item => item?.type === 'function_call');
}

async function fetchResponse({ apiKey, requestId, model, instructions, input, tools, timeoutMs }) {
  const body = {
    model,
    input,
    instructions,
    max_output_tokens: 4096
  };
  if (tools?.length) {
    body.tools = tools.map(tool => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
      strict: false
    }));
    body.tool_choice = 'auto';
  }

  let response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + apiKey,
        'content-type': 'application/json',
        'x-aion-request-id': requestId
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new Error('OpenAI request timed out after ' + timeoutMs + 'ms', { cause: error });
    }
    throw error;
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error?.message || ('OpenAI request failed with HTTP ' + response.status));
  }
  return result;
}

async function executeWithTimeout(executor, name, args, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => executor(name, args)),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Tool timed out: ' + name)), timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function openAIConfigured() {
  return Boolean(clean(process.env.OPENAI_API_KEY));
}

export function selectOpenAIModel(mode = 'frontier') {
  const key = MODES.includes(mode) ? mode : 'frontier';
  return MODEL_BY_MODE[key];
}

export function openAIGatewayHealth() {
  const configured = openAIConfigured();
  return {
    version: OPENAI_GATEWAY_VERSION,
    status: configured ? 'configured-not-probed' : 'awaiting-secret',
    provider: 'OpenAI',
    api: 'Responses API',
    defaultModel: OPENAI_DEFAULT_MODEL,
    requestTimeoutMs: OPENAI_REQUEST_TIMEOUT_MS,
    modes: MODES,
    multimodal: true,
    toolExecution: {
      status: 'worker-opt-in',
      registeredTools: null,
      registeredToolsSource: 'worker-supplied-approved-registry',
      maxToolCallsPerTask: MAX_TOOL_CALLS,
      note: 'Tool calling is enabled only when a worker supplies the approved read-only registry and executor; the current registry is reported by the worker at runtime, not hard-coded here.'
    },
    durableMemory: 'AION stack store',
    evaluation: 'AION Frontier Intelligence Lab',
    fakeCompletion: false,
    externalMoney: 'owner-approved only',
    politicalTargeting: false
  };
}

export async function runOpenAI(input = {}) {
  const apiKey = clean(process.env.OPENAI_API_KEY);
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  const prompt = clean(input.prompt);
  if (!prompt) throw new Error('prompt required');

  const mode = MODES.includes(input.mode) ? input.mode : 'frontier';
  const model = clean(input.model, selectOpenAIModel(mode));
  const requestId = 'AION-OAI-' + crypto.randomUUID();
  const timeoutMs = boundedTimeout(input.timeoutMs);
  const instructions = clean(input.instructions,
    'You are the AION Intelligence Core. Reason carefully, distinguish evidence from assumptions, use measurable criteria, and never claim an action happened unless a registered AION worker or adapter confirms it.'
  );

  const toolCallingEnabled = input.enableTools === true &&
    Array.isArray(input.tools) &&
    input.tools.length > 0 &&
    typeof input.toolExecutor === 'function';
  const tools = toolCallingEnabled
    ? input.tools.filter(tool => tool?.access === 'read-only' && typeof tool.name === 'string').slice(0, 20)
    : [];
  const inputItems = [{ role: 'user', content: prompt }];
  const toolEvidence = [];
  let response = await fetchResponse({
    apiKey, requestId, model, instructions, input: prompt, tools, timeoutMs
  });

  let toolCallsUsed = 0;
  while (tools.length) {
    const calls = functionCalls(response);
    if (!calls.length) break;
    if (toolCallsUsed + calls.length > MAX_TOOL_CALLS) {
      throw new Error('OpenAI tool-call limit exceeded (' + MAX_TOOL_CALLS + ')');
    }

    inputItems.push(...(response.output || []));
    const outputs = [];
    for (const call of calls) {
      const name = clean(call.name);
      if (!tools.some(tool => tool.name === name)) {
        throw new Error('OpenAI requested a tool outside the approved registry: ' + name);
      }

      let args;
      try {
        args = JSON.parse(call.arguments || '{}');
      } catch {
        throw new Error('OpenAI returned invalid JSON arguments for tool: ' + name);
      }

      const startedAt = new Date().toISOString();
      const started = Date.now();
      const result = await executeWithTimeout(input.toolExecutor, name, args, timeoutMs);
      const serialized = JSON.stringify(result);
      const boundedOutput = serialized.length > MAX_TOOL_OUTPUT_CHARS
        ? serialized.slice(0, MAX_TOOL_OUTPUT_CHARS) + '…[truncated]'
        : serialized;
      const outputDigest = crypto.createHash('sha256').update(boundedOutput).digest('hex');
      toolEvidence.push({
        tool: name,
        callId: call.call_id || null,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        outputDigest,
        outputTruncated: serialized.length > MAX_TOOL_OUTPUT_CHARS,
        status: 'completed'
      });
      outputs.push({
        type: 'function_call_output',
        call_id: call.call_id,
        output: boundedOutput
      });
      toolCallsUsed += 1;
    }

    inputItems.push(...outputs);
    response = await fetchResponse({
      apiKey,
      requestId,
      model,
      instructions,
      input: inputItems,
      tools,
      timeoutMs
    });
  }

  return {
    requestId,
    model,
    mode,
    status: 'completed',
    text: extractText(response),
    responseId: response.id || null,
    usage: response.usage || null,
    measured: true,
    toolExecution: {
      enabled: toolCallingEnabled,
      calls: toolEvidence,
      callCount: toolEvidence.length,
      maxCalls: MAX_TOOL_CALLS
    }
  };
}
