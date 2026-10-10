import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.AION_TEST_ALLOW_MEMORY_FINANCIAL_STORE = '1';
process.env.PAYPAL_ENVIRONMENT = 'sandbox';
process.env.PAYPAL_CLIENT_ID = 'test-client-id';
process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
process.env.PAYPAL_WEBHOOK_ID = 'test-webhook-id';

const revenueApi = await import('../config/aion-customer-revenue.js');
const { setJson } = await import('../config/aion-stack-store.js');
const { default: handler } = await import('../server-api/customer-revenue.js');

function paypalResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() { return JSON.stringify(payload); }
  };
}

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

async function postCapture(orderId) {
  const req = {
    method: 'POST',
    url: '/api/customer-revenue?path=capture',
    body: { orderId },
    headers: {}
  };
  const res = responseRecorder();
  await handler(req, res);
  return res;
}

test('server-side PayPal capture validates amount before capture and records one revenue row', async () => {
  const mismatchOrder = await revenueApi.createCustomerOrder({
    offerId: 'space-weather-brief',
    customerId: 'paypal-capture-mismatch-test'
  });
  await setJson('customer-orders:' + mismatchOrder.id, { ...mismatchOrder, paypalOrderId: 'PP-MISMATCH-1' });

  const validOrder = await revenueApi.createCustomerOrder({
    offerId: 'space-weather-brief',
    customerId: 'paypal-capture-valid-test'
  });
  await setJson('customer-orders:' + validOrder.id, { ...validOrder, paypalOrderId: 'PP-VALID-1' });

  const originalFetch = globalThis.fetch;
  let mismatchCaptureCalls = 0;
  let validCaptureCalls = 0;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    const method = String(options.method || 'GET').toUpperCase();
    calls.push({ url: target, method });
    if (target.endsWith('/v1/oauth2/token')) {
      return paypalResponse(200, { access_token: 'capture-test-token', expires_in: 300 });
    }
    if (target.endsWith('/v2/checkout/orders/PP-MISMATCH-1') && method === 'GET') {
      return paypalResponse(200, {
        id: 'PP-MISMATCH-1',
        status: 'APPROVED',
        purchase_units: [{
          custom_id: mismatchOrder.id,
          invoice_id: mismatchOrder.id,
          amount: { currency_code: 'USD', value: '179.00' }
        }]
      });
    }
    if (target.endsWith('/v2/checkout/orders/PP-VALID-1') && method === 'GET') {
      return paypalResponse(200, {
        id: 'PP-VALID-1',
        status: 'APPROVED',
        purchase_units: [{
          custom_id: validOrder.id,
          invoice_id: validOrder.id,
          amount: { currency_code: 'USD', value: '180.00' }
        }]
      });
    }
    if (target.endsWith('/v2/checkout/orders/PP-MISMATCH-1/capture') && method === 'POST') {
      mismatchCaptureCalls++;
      return paypalResponse(200, { status: 'COMPLETED' });
    }
    if (target.endsWith('/v2/checkout/orders/PP-VALID-1/capture') && method === 'POST') {
      validCaptureCalls++;
      return paypalResponse(201, {
        id: 'PP-VALID-1',
        status: 'COMPLETED',
        purchase_units: [{
          custom_id: validOrder.id,
          invoice_id: validOrder.id,
          payments: { captures: [{
            id: 'CAP-VALID-1',
            status: 'COMPLETED',
            amount: { currency_code: 'USD', value: '180.00' }
          }] }
        }]
      });
    }
    throw new Error('Unexpected mocked PayPal request: ' + method + ' ' + target);
  };

  try {
    const mismatchRes = await postCapture(mismatchOrder.id);
    assert.equal(mismatchRes.statusCode, 400);
    assert.match(mismatchRes.payload?.error || '', /amount or currency does not match/);
    assert.equal(mismatchCaptureCalls, 0, 'PayPal capture must not run when the pre-capture amount check fails');
    assert.equal((await revenueApi.listRevenue()).filter(row => row.orderId === mismatchOrder.id).length, 0);

    const validRes = await postCapture(validOrder.id);
    assert.equal(validRes.statusCode, 200, JSON.stringify(validRes.payload));
    assert.equal(validRes.payload?.success, true);
    assert.equal(validRes.payload?.order?.paymentStatus, 'confirmed');
    assert.equal(validCaptureCalls, 1);

    const duplicateRes = await postCapture(validOrder.id);
    assert.equal(duplicateRes.statusCode, 200);
    assert.equal(duplicateRes.payload?.order?.paymentReference, 'CAP-VALID-1');
    assert.equal(validCaptureCalls, 1, 'duplicate return visits must not capture again');

    const validReceipts = (await revenueApi.listCustomerPayments()).filter(row => row.orderId === validOrder.id);
    assert.equal(validReceipts.length, 1);
    assert.equal(validReceipts[0].amountUsd, 180);
    assert.equal((await revenueApi.listRevenue()).filter(row => row.orderId === validOrder.id).length, 0,
      'capture is a receipt; service revenue recognition awaits delivery evidence');
    assert.ok(calls.some(call => call.url.endsWith('/v1/oauth2/token')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test('PayPal network outages return retryable 503 and do not mark an order paid', async () => {
  const order = await revenueApi.createCustomerOrder({
    offerId: 'space-weather-brief',
    customerId: 'paypal-network-outage-test'
  });
  await setJson('customer-orders:' + order.id, { ...order, paypalOrderId: 'PP-NETWORK-OUTAGE' });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('mock socket failure');
  };
  try {
    const res = await postCapture(order.id);
    assert.equal(res.statusCode, 503);
    assert.match(res.payload?.error || '', /PayPal network request failed/);
    const persisted = await revenueApi.listCustomerOrders();
    assert.equal(persisted.find(row => row.id === order.id)?.paymentStatus, 'unpaid');
    assert.equal((await revenueApi.listRevenue()).some(row => row.orderId === order.id), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('PayPal upstream 429/5xx failures are returned as retryable 503 responses', async () => {
  const order = await revenueApi.createCustomerOrder({
    offerId: 'space-weather-brief',
    customerId: 'paypal-upstream-error-test'
  });
  await setJson('customer-orders:' + order.id, { ...order, paypalOrderId: 'PP-UPSTREAM-ERROR' });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => paypalResponse(503, { message: 'PayPal temporarily unavailable' });
  try {
    const res = await postCapture(order.id);
    assert.equal(res.statusCode, 503);
    assert.match(res.payload?.error || '', /temporarily unavailable/);
    const persisted = (await revenueApi.listCustomerOrders()).find(row => row.id === order.id);
    assert.equal(persisted?.paymentStatus, 'unpaid');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
