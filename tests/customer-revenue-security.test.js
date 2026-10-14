import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../server-api/customer-revenue.js';

function responseRecorder() {
  return {
    statusCode: null,
    payload: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    end() { return this; }
  };
}

test('caller-supplied payment success cannot confirm an order', async () => {
  const req = { method: 'POST', url: '/api/customer-revenue?path=payment', headers: {}, body: {
    orderId: 'AION-ORDER-fake',
    paymentProvider: 'paypal',
    verificationStatus: 'SUCCESS',
    providerEventId: 'caller-asserted',
    paymentReference: 'caller-asserted'
  } };
  const res = responseRecorder();
  await handler(req, res);
  assert.equal(res.statusCode, 410);
  assert.equal(res.payload?.success, false);
});

test('revenue records require the configured admin bearer token', async () => {
  const req = { method: 'GET', url: '/api/customer-revenue?path=revenue', headers: {} };
  const res = responseRecorder();
  await handler(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.payload?.error, 'admin authorization required');
});
