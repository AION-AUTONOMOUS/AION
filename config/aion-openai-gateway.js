import crypto from 'node:crypto';

export const OPENAI_GATEWAY_VERSION = '2.0.0';
export const OPENAI_DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6';

const MODEL_BY_MODE = Object.freeze({
  frontier: process.env.OPENAI_FRONTIER_MODEL || OPENAI_DEFAULT_MODEL,
  engineering: process.env.OPENAI_ENGINEERING_MODEL || OPENAI_DEFAULT_MODEL,
  research: process.env.OPENAI_RESEARCH_MODEL || OPENAI_DEFAULT_MODEL,
  volume: process.env.OPENAI_VOLUME_MODEL || 'gpt-5.6-luna'
});

const MODES = Object.freeze(['frontier', 'engineering', 'research', 'volume']);

function clean(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

export function openAIConfigured() {
  return Boolean(clean(process.env.OPENAI_API_KEY));
}

export function selectOpenAIModel(mode = 'frontier') {
  const key = MODES.includes(mode) ? mode : 'frontier';
  return MODEL_BY_MODE[key];
}

export function availableOpenAITools() {
  const tools = [];
  if (process.env.OPENAI_ENABLE_WEB_SEARCH !== 'false') tools.push('web_search');
  if (clean(process.env.OPENAI_VECTOR_STORE_ID)) tools.push('file_search');
  if (process.env.OPENAI_ENABLE_FUNCTIONS !== 'false') tools.push('function_calling');
  if (process.env.OPENAI_ENABLE_COMPUTER_USE === 'true') tools.push('computer_use');
  return tools;
}

export function openAIGatewayHealth() {
  return {
    version: OPENAI_GATEWAY_VERSION,
    status: openAIConfigured() ? 'configured' : 'awaiting-secret',
    provider: 'OpenAI',
    api: 'Responses API',
    defaultModel: OPENAI_DEFAULT_MODEL,
    modes: MODES,
    tools: availableOpenAITools(),
    multimodal: true,
    durableMemory: 'AION stack store',
    evaluation: 'AION Frontier Intelligence Lab',
    fakeCompletion: false,
    externalMoney: 'owner-approved only',
    politicalTargeting: false
  };
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

function buildTools(input) {
  const tools = [];
  if (input.webSearch !== false && process.env.OPENAI_ENABLE_WEB_SEARCH !== 'false') {
    tools.push({ type: 'web_search' });
  }
  const vectorStoreId = clean(input.vectorStoreId, process.env.OPENAI_VECTOR_STORE_ID);
  if (vectorStoreId) {
    tools.push({ type: 'file_search', vector_store_ids: [vectorStoreId] });
  }
  return tools;
}

export async function runOpenAI(input = {}) {
  const apiKey = clean(process.env.OPENAI_API_KEY);
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  const prompt = clean(input.prompt);
  if (!prompt) throw new Error('prompt required');

  const mode = MODES.includes(input.mode) ? input.mode : 'frontier';
  const model = clean(input.model, selectOpenAIModel(mode));
  const requestId = 'AION-OAI-' + crypto.randomUUID();

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + apiKey,
      'content-type': 'application/json',
      'x-aion-request-id': requestId
    },
    body: JSON.stringify({
      model,
      input: prompt,
      instructions: clean(input.instructions,
        'You are the AION Intelligence Core. Distinguish evidence from assumptions, prefer current evidence when available, and never claim an external action occurred unless an AION worker or adapter confirms it.'
      ),
      tools: buildTools(input),
      tool_choice: input.toolChoice || 'auto',
      max_output_tokens: Number.isInteger(input.maxOutputTokens) ? input.maxOutputTokens : 4096
    })
  });

  const body = await response.json();
  if (!response.ok) {
    const message = body?.error?.message || ('OpenAI request failed with HTTP ' + response.status);
    throw new Error(message);
  }

  return {
    requestId,
    model,
    mode,
    status: 'completed',
    text: extractText(body),
    responseId: body.id || null,
    usage: body.usage || null,
    tools: buildTools(input).map(tool => tool.type),
    measured: true
  };
}
