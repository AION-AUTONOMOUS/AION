import test from 'node:test';
import assert from 'node:assert/strict';

process.env.PAYPAL_CLIENT_ID = 'paypal-environment-test-client';
process.env.PAYPAL_CLIENT_SECRET = 'paypal-environment-test-secret';
delete process.env.PAYPAL_ENVIRONMENT;

const { createPayPalOrder, paypalHealth } = await import('../config/aion-paypal.js');

function response(url, payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() { return JSON.stringify(payload); },
    url
  };
}

test('defaults to sandbox and does not reuse OAuth tokens across environments', async () => {
  const originalFetch = globalThis.fetch;
  const previousEnvironment = process.env.PAYPAL_ENVIRONMENT;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    calls.push({ url: target, options });
    if (target.endsWith('/v1/oauth2/token')) {
      return response(target, {
        access_token: target.includes('sandbox') ? 'sandbox-token' : 'live-token',
        expires_in: 300
      });
    }
    if (target.endsWith('/v2/checkout/orders')) {
      const sandbox = target.includes('sandbox');
      return response(target, {
        id: sandbox ? 'PP-SANDBOX-1' : 'PP-LIVE-1',
        status: 'CREATED',
        links: [{ rel: 'approve', href: sandbox
          ? 'https://www.sandbox.paypal.com/checkoutnow?token=PP-SANDBOX-1'
          : 'https://www.paypal.com/checkoutnow?token=PP-LIVE-1' }]
      });
    }
    throw new Error('Unexpected mocked PayPal URL: ' + target);
  };

  try {
    delete process.env.PAYPAL_ENVIRONMENT;
    assert.equal(paypalHealth().environment, 'sandbox');
    const sandboxOrder = await createPayPalOrder({
      orderId: 'AION-ORDER-SANDBOX-1',
      offer: { id: 'article-500', name: 'Sandbox test service', priceUsd: 5 },
      returnUrl: 'https://example.test/return',
      cancelUrl: 'https://example.test/cancel'
    });
    assert.equal(sandboxOrder.environment, 'sandbox');

    process.env.PAYPAL_ENVIRONMENT = 'live';
    assert.equal(paypalHealth().environment, 'live');
    const liveOrder = await createPayPalOrder({
      orderId: 'AION-ORDER-LIVE-1',
      offer: { id: 'article-500', name: 'Live environment routing test', priceUsd: 5 },
      returnUrl: 'https://example.test/return',
      cancelUrl: 'https://example.test/cancel'
    });
    assert.equal(liveOrder.environment, 'live');

    const tokenCalls = calls.filter(call => call.url.endsWith('/v1/oauth2/token'));
    assert.equal(tokenCalls.length, 2, 'switching API environments must request a new OAuth token');
    assert.equal(tokenCalls[0].url, 'https://api-m.sandbox.paypal.com/v1/oauth2/token');
    assert.equal(tokenCalls[1].url, 'https://api-m.paypal.com/v1/oauth2/token');
    const orderCalls = calls.filter(call => call.url.endsWith('/v2/checkout/orders'));
    assert.equal(orderCalls.length, 2);
    assert.ok(orderCalls[0].url.startsWith('https://api-m.sandbox.paypal.com/'));
    assert.equal(orderCalls[0].options.headers.Authorization, 'Bearer sandbox-token');
    assert.ok(orderCalls[1].url.startsWith('https://api-m.paypal.com/'));
    assert.equal(orderCalls[1].options.headers.Authorization, 'Bearer live-token');
  } finally {
    globalThis.fetch = originalFetch;
    if (previousEnvironment === undefined) delete process.env.PAYPAL_ENVIRONMENT;
    else process.env.PAYPAL_ENVIRONMENT = previousEnvironment;
  }
});

test('rejects an invalid environment without making any provider request', async () => {
  const originalFetch = globalThis.fetch;
  const previousEnvironment = process.env.PAYPAL_ENVIRONMENT;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error('provider must not be called for invalid environment');
  };
  try {
    process.env.PAYPAL_ENVIRONMENT = 'sandbxo';
    assert.equal(paypalHealth().environment, 'invalid');
    assert.equal(paypalHealth().configurationValid, false);
    await assert.rejects(
      () => createPayPalOrder({
        orderId: 'AION-ORDER-INVALID-ENV',
        offer: { id: 'article-500', name: 'Invalid environment test', priceUsd: 5 },
        returnUrl: 'https://example.test/return',
        cancelUrl: 'https://example.test/cancel'
      }),
      error => error.statusCode === 503 && /PAYPAL_ENVIRONMENT must be sandbox or live/.test(error.message)
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousEnvironment === undefined) delete process.env.PAYPAL_ENVIRONMENT;
    else process.env.PAYPAL_ENVIRONMENT = previousEnvironment;
  }
});

test('missing PayPal credentials fail closed as a configuration error', async () => {
  const previousEnvironment = process.env.PAYPAL_ENVIRONMENT;
  const previousSecret = process.env.PAYPAL_CLIENT_SECRET;
  try {
    process.env.PAYPAL_ENVIRONMENT = 'sandbox';
    delete process.env.PAYPAL_CLIENT_SECRET;
    await assert.rejects(
      () => createPayPalOrder({
        orderId: 'AION-ORDER-NO-SECRET',
        offer: { id: 'article-500', name: 'Credential test', priceUsd: 5 },
        returnUrl: 'https://example.test/return',
        cancelUrl: 'https://example.test/cancel'
      }),
      error => error.statusCode === 503 && /credentials are not configured/.test(error.message)
    );
  } finally {
    if (previousSecret === undefined) delete process.env.PAYPAL_CLIENT_SECRET;
    else process.env.PAYPAL_CLIENT_SECRET = previousSecret;
    if (previousEnvironment === undefined) delete process.env.PAYPAL_ENVIRONMENT;
    else process.env.PAYPAL_ENVIRONMENT = previousEnvironment;
  }
});
