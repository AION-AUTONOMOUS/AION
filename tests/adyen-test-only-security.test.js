import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../server-api/adyen/create-session.js';

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    end() { this.ended = true; return this; }
  };
}

const envKeys = ['ADYEN_API_KEY', 'ADYEN_MERCHANT_ACCOUNT', 'ADYEN_CLIENT_KEY', 'ADYEN_ENVIRONMENT'];
function saveEnv() {
  return Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
}
function restoreEnv(saved) {
  for (const key of envKeys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

test('checkout refuses to start if any required Adyen test credential is missing', async () => {
  const saved = saveEnv();
  const oldFetch = globalThis.fetch;
  try {
    process.env.ADYEN_API_KEY = 'test-key';
    process.env.ADYEN_MERCHANT_ACCOUNT = 'test-merchant';
    delete process.env.ADYEN_CLIENT_KEY;
    globalThis.fetch = async () => { throw new Error('provider must not be called'); };
    const res = mockResponse();
    await handler({ method: 'POST', body: { serviceId: 'simple_letter' } }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, 'PAYMENT_NOT_CONFIGURED');
    assert.equal(res.headers['cache-control'], 'no-store');
  } finally {
    globalThis.fetch = oldFetch;
    restoreEnv(saved);
  }
});

test('checkout stays on Adyen test host even when ADYEN_ENVIRONMENT=live', async () => {
  const saved = saveEnv();
  const oldFetch = globalThis.fetch;
  let requestedUrl;
  let requestedPayload;
  try {
    process.env.ADYEN_API_KEY = 'test-key';
    process.env.ADYEN_MERCHANT_ACCOUNT = 'test-merchant';
    process.env.ADYEN_CLIENT_KEY = 'test-client-key';
    process.env.ADYEN_ENVIRONMENT = 'live';
    globalThis.fetch = async (url, options) => {
      requestedUrl = String(url);
      requestedPayload = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'session-id', sessionData: 'session-data' })
      };
    };
    const res = mockResponse();
    await handler({ method: 'POST', body: { serviceId: 'simple_letter', countryCode: 'US' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(requestedUrl, 'https://checkout-test.adyen.com/v72/sessions');
    assert.equal(res.body.environment, 'test');
    assert.equal(requestedPayload.amount.currency, 'USD');
    assert.equal(requestedPayload.amount.value, 400);
    assert.equal(res.headers['cache-control'], 'no-store');
  } finally {
    globalThis.fetch = oldFetch;
    restoreEnv(saved);
  }
});

test('client-supplied price is ignored and unknown service is rejected', async () => {
  const saved = saveEnv();
  const oldFetch = globalThis.fetch;
  try {
    process.env.ADYEN_API_KEY = 'test-key';
    process.env.ADYEN_MERCHANT_ACCOUNT = 'test-merchant';
    process.env.ADYEN_CLIENT_KEY = 'test-client-key';
    globalThis.fetch = async () => { throw new Error('provider must not be called'); };
    const res = mockResponse();
    await handler({ method: 'POST', body: { serviceId: 'unknown', amount: 1 } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, 'INVALID_SERVICE');
  } finally {
    globalThis.fetch = oldFetch;
    restoreEnv(saved);
  }
});

test('unsupported methods are rejected', async () => {
  const res = mockResponse();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 405);
});
