import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.AION_TEST_ALLOW_MEMORY_FINANCIAL_STORE = '1';

const { default: handler } = await import('../server-api/customer-revenue.js');

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; },
    end() { return this; }
  };
}

test('financial admin data and delivery mutations require an explicit server token', async () => {
  const original = {
    admin: process.env.AION_REVENUE_ADMIN_TOKEN,
    mesh: process.env.AION_MESH_TOKEN,
    contracts: process.env.AION_CONTRACTS_TOKEN
  };
  try {
    delete process.env.AION_REVENUE_ADMIN_TOKEN;
    process.env.AION_MESH_TOKEN = '';
    process.env.AION_CONTRACTS_TOKEN = '';

    let res = responseRecorder();
    await handler({ method: 'GET', url: '/api/customer-revenue?path=receipts', headers: {} }, res);
    assert.equal(res.statusCode, 503, 'sensitive endpoints fail closed when no admin token is configured');

    process.env.AION_REVENUE_ADMIN_TOKEN = 'unit-test-revenue-admin-token';
    res = responseRecorder();
    await handler({ method: 'GET', url: '/api/customer-revenue?path=receipts', headers: {} }, res);
    assert.equal(res.statusCode, 401, 'missing bearer token must not expose receipts');

    res = responseRecorder();
    await handler({
      method: 'GET',
      url: '/api/customer-revenue?path=receipts',
      headers: { authorization: 'Bearer unit-test-revenue-admin-token' }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(Array.isArray(res.payload?.receipts), true);

    res = responseRecorder();
    await handler({
      method: 'POST',
      url: '/api/customer-revenue?path=delivery',
      headers: {},
      body: { orderId: 'AION-ORDER-unauthorized', evidence: 'fake-delivery' }
    }, res);
    assert.equal(res.statusCode, 401, 'clients must not self-assert delivery evidence');
  } finally {
    if (original.admin === undefined) delete process.env.AION_REVENUE_ADMIN_TOKEN;
    else process.env.AION_REVENUE_ADMIN_TOKEN = original.admin;
    if (original.mesh === undefined) delete process.env.AION_MESH_TOKEN;
    else process.env.AION_MESH_TOKEN = original.mesh;
    if (original.contracts === undefined) delete process.env.AION_CONTRACTS_TOKEN;
    else process.env.AION_CONTRACTS_TOKEN = original.contracts;
  }
});

test('public payment endpoint rejects client-supplied PayPal SUCCESS claims', async () => {
  const req = {
    method: 'POST',
    url: '/api/customer-revenue?path=payment',
    body: {
      orderId: 'AION-ORDER-forged',
      paymentProvider: 'paypal',
      verificationStatus: 'SUCCESS',
      providerEventId: 'forged-event',
      paymentReference: 'forged-capture',
      amountUsd: '180.00',
      currency: 'USD'
    },
    headers: {}
  };
  const res = responseRecorder();
  await handler(req, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload?.success, false);
  assert.match(res.payload?.error || '', /server-side PayPal verification/);
});
