import test from 'node:test';
import assert from 'node:assert/strict';

import handler from '../server-api/chat.js';

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };
}

async function invoke(body, method = 'POST') {
  const req = { method, body };
  const res = createResponse();
  await handler(req, res);
  return res;
}

test('chat endpoint rejects methods other than POST', async () => {
  const res = await invoke({}, 'GET');
  assert.equal(res.statusCode, 405);
  assert.equal(res.body.success, false);
  assert.equal(res.headers['access-control-allow-origin'], 'https://aion-theta-eight.vercel.app');
});

test('chat endpoint handles CORS preflight without calling the provider', async () => {
  const res = await invoke({}, 'OPTIONS');
  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
});

test('chat endpoint rejects an empty message', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'test-key';
  try {
    const res = await invoke({ message: '   ', role: 'teacher' });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'message required');
  } finally {
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});

test('chat endpoint rejects messages above the documented size limit', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'test-key';
  try {
    const res = await invoke({ message: 'x'.repeat(12001), role: 'teacher' });
    assert.equal(res.statusCode, 413);
    assert.equal(res.body.error, 'message too long');
  } finally {
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});

test('chat endpoint reports missing AI-provider configuration', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  const previousFetch = globalThis.fetch;
  delete process.env.GROQ_API_KEY;
  globalThis.fetch = async () => {
    throw new Error('fetch must not run without provider configuration');
  };
  try {
    const res = await invoke({ message: 'اشرح الكسور', role: 'teacher' });
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.error, 'AI provider is not configured');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});

test('Teacher requests use the teaching identity and return the provider answer', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GROQ_API_KEY = 'test-key';
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        choices: [{ message: { content: 'نحل المسألة خطوة بخطوة.' } }]
      })
    };
  };

  try {
    const res = await invoke({ message: 'اشرح الكسور', role: 'teacher' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.reply, 'نحل المسألة خطوة بخطوة.');
    assert.equal(res.body.agent.id, 'TEACHER-AI');
    assert.equal(res.body.agent.department, 'education');
    assert.equal(capturedRequest.url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.match(capturedRequest.options.headers.Authorization, /^Bearer test-key$/);
    const payload = JSON.parse(capturedRequest.options.body);
    assert.equal(payload.messages[1].content, 'اشرح الكسور');
    assert.equal(payload.temperature, 0.2);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});

test('chat endpoint maps provider failures to a safe error response', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GROQ_API_KEY = 'test-key';
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    text: async () => JSON.stringify({ error: { message: 'provider details should not be returned' } })
  });

  try {
    const res = await invoke({ message: 'اشرح الكسور', role: 'teacher' });
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'AI provider error');
    assert.equal(JSON.stringify(res.body).includes('provider details'), false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});
