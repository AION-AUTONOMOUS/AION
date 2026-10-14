import test from 'node:test';
import assert from 'node:assert/strict';
import { runAIONExecutiveAI, openAIGatewayHealth } from '../config/aion-openai-gateway.js';

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test('executive runtime selects existing Groq credentials when OpenAI is not configured', async () => {
  const oldOpenAI = process.env.OPENAI_API_KEY;
  const oldGroq = process.env.GROQ_API_KEY;
  const oldFetch = globalThis.fetch;
  const requests = [];
  delete process.env.OPENAI_API_KEY;
  process.env.GROQ_API_KEY = 'test-only-groq-key';

  globalThis.fetch = async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    if (requests.length === 1) {
      return {
        ok: true,
        json: async () => ({
          id: 'chatcmpl_tool',
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_prospect_1',
                type: 'function',
                function: {
                  name: 'aion.prospects.list',
                  arguments: '{"limit":1}'
                }
              }]
            }
          }]
        })
      };
    }
    return {
      ok: true,
      json: async () => ({
        id: 'chatcmpl_final',
        choices: [{ message: { role: 'assistant', content: 'Reviewed one public prospect.' } }],
        usage: { total_tokens: 22 }
      })
    };
  };

  try {
    const result = await runAIONExecutiveAI({
      prompt: 'Review one prospect and summarize the evidence.',
      enableTools: true,
      tools: [{
        name: 'aion.prospects.list',
        description: 'Read ranked public prospects.',
        access: 'read-only',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: { limit: { type: 'integer', minimum: 1, maximum: 100 } }
        }
      }],
      toolExecutor: async (name, args) => {
        assert.equal(name, 'aion.prospects.list');
        assert.deepEqual(args, { limit: 1 });
        return { prospects: [{ company: 'Example public company', fitScore: 95 }] };
      }
    });

    assert.equal(result.provider, 'Groq');
    assert.equal(result.text, 'Reviewed one public prospect.');
    assert.equal(result.toolExecution.callCount, 1);
    assert.equal(requests.length, 2);
    assert.match(requests[0].url, /api\.groq\.com\/openai\/v1\/chat\/completions$/);
    assert.ok(requests[0].body.tools.some(tool => tool.function.name === 'aion.prospects.list'));
    assert.ok(requests[1].body.messages.some(message => message.role === 'tool' && message.tool_call_id === 'call_prospect_1'));
  } finally {
    globalThis.fetch = oldFetch;
    restoreEnv('OPENAI_API_KEY', oldOpenAI);
    restoreEnv('GROQ_API_KEY', oldGroq);
  }
});

test('Groq executive fallback refuses tools outside the supplied registry', async () => {
  const oldOpenAI = process.env.OPENAI_API_KEY;
  const oldGroq = process.env.GROQ_API_KEY;
  const oldFetch = globalThis.fetch;
  let executorCalled = false;
  delete process.env.OPENAI_API_KEY;
  process.env.GROQ_API_KEY = 'test-only-groq-key';
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      id: 'chatcmpl_unapproved',
      choices: [{
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: 'call_bad',
            type: 'function',
            function: { name: 'aion.shell.exec', arguments: '{"command":"echo unsafe"}' }
          }]
        }
      }]
    })
  });

  try {
    await assert.rejects(() => runAIONExecutiveAI({
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
    restoreEnv('OPENAI_API_KEY', oldOpenAI);
    restoreEnv('GROQ_API_KEY', oldGroq);
  }
});

test('gateway health distinguishes OpenAI API status from executive fallback readiness', () => {
  const oldOpenAI = process.env.OPENAI_API_KEY;
  const oldGroq = process.env.GROQ_API_KEY;
  delete process.env.OPENAI_API_KEY;
  process.env.GROQ_API_KEY = 'test-only-groq-key';
  try {
    const health = openAIGatewayHealth();
    assert.equal(health.status, 'awaiting-secret');
    assert.equal(health.executiveRuntime.provider, 'Groq');
    assert.equal(health.executiveRuntime.status, 'configured-not-probed');
  } finally {
    restoreEnv('OPENAI_API_KEY', oldOpenAI);
    restoreEnv('GROQ_API_KEY', oldGroq);
  }
});
