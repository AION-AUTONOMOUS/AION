import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OPENAI_GATEWAY_VERSION,
  OPENAI_REQUEST_TIMEOUT_MS,
  openAIGatewayHealth,
  runOpenAI,
  selectOpenAIModel
} from '../config/aion-openai-gateway.js';

test('OpenAI gateway exposes bounded worker tool execution honestly', () => {
  assert.equal(OPENAI_GATEWAY_VERSION, '1.1.0');
  const health = openAIGatewayHealth();
  assert.equal(health.provider, 'OpenAI');
  assert.equal(health.fakeCompletion, false);
  assert.equal(health.politicalTargeting, false);
  assert.equal(health.externalMoney, 'owner-approved only');
  assert.equal(health.toolExecution.status, 'worker-opt-in');
  assert.equal(health.toolExecution.registeredTools, 3);
  assert.equal(health.toolExecution.maxToolCallsPerTask, 5);
  assert.match(health.toolExecution.note, /approved read-only registry/);
  assert.equal(health.requestTimeoutMs, OPENAI_REQUEST_TIMEOUT_MS);
  assert.ok(Number.isInteger(health.requestTimeoutMs));
  assert.ok(health.requestTimeoutMs >= 1000 && health.requestTimeoutMs <= 120000);
  assert.equal(health.status, process.env.OPENAI_API_KEY ? 'configured-not-probed' : 'awaiting-secret');
});

test('OpenAI gateway routes intelligence modes to configured models', () => {
  assert.equal(selectOpenAIModel('frontier'), process.env.OPENAI_FRONTIER_MODEL || 'gpt-5.6-sol');
  assert.equal(selectOpenAIModel('engineering'), process.env.OPENAI_ENGINEERING_MODEL || 'gpt-5.6-sol');
  assert.equal(selectOpenAIModel('research'), process.env.OPENAI_RESEARCH_MODEL || 'gpt-5.6-sol');
  assert.equal(selectOpenAIModel('volume'), process.env.OPENAI_VOLUME_MODEL || 'gpt-5.6-luna');
  assert.equal(selectOpenAIModel('unknown'), process.env.OPENAI_MODEL || 'gpt-5.6-sol');
});

test('worker tool-call loop executes only approved tools and returns to the model', async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldFetch = globalThis.fetch;
  const requests = [];
  process.env.OPENAI_API_KEY = 'test-only-key';
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push(body);
    if (requests.length === 1) {
      return {
        ok: true,
        json: async () => ({
          id: 'resp_tool_call',
          output: [{
            type: 'function_call',
            name: 'aion.tasks.list',
            call_id: 'call_123',
            arguments: '{"limit":1}'
          }]
        })
      };
    }
    return {
      ok: true,
      json: async () => ({ id: 'resp_final', output_text: 'I checked one task.' })
    };
  };

  try {
    const result = await runOpenAI({
      prompt: 'Check the task queue and summarize it.',
      enableTools: true,
      tools: [{
        name: 'aion.tasks.list',
        description: 'List task summaries.',
        access: 'read-only',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: { limit: { type: 'integer', minimum: 1, maximum: 100 } }
        }
      }],
      toolExecutor: async (name, args) => {
        assert.equal(name, 'aion.tasks.list');
        assert.deepEqual(args, { limit: 1 });
        return { output: [{ id: 'task-1', status: 'ready' }], evidence: { verified: true } };
      }
    });

    assert.equal(result.text, 'I checked one task.');
    assert.equal(result.toolExecution.callCount, 1);
    assert.equal(result.toolExecution.calls[0].tool, 'aion.tasks.list');
    assert.match(result.toolExecution.calls[0].outputDigest, /^[a-f0-9]{64}$/);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].tool_choice, 'auto');
    assert.ok(requests[1].input.some(item => item.type === 'function_call_output' && item.call_id === 'call_123'));
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});

test('worker tool-call loop refuses a model request outside the approved registry', async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldFetch = globalThis.fetch;
  let executorCalled = false;
  process.env.OPENAI_API_KEY = 'test-only-key';
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      id: 'resp_unapproved_tool',
      output: [{
        type: 'function_call',
        name: 'aion.shell.exec',
        call_id: 'call_bad',
        arguments: '{"command":"echo unsafe"}'
      }]
    })
  });

  try {
    await assert.rejects(() => runOpenAI({
      prompt: 'Do the task.',
      enableTools: true,
      tools: [{
        name: 'aion.tasks.list',
        description: 'List tasks.',
        access: 'read-only',
        inputSchema: { type: 'object', additionalProperties: false, properties: {} }
      }],
      toolExecutor: async () => { executorCalled = true; return {}; }
    }), /outside the approved registry/);
    assert.equal(executorCalled, false);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});
