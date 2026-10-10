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
