import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.AION_TEST_ALLOW_MEMORY_FINANCIAL_STORE = '1';
process.env.PAYPAL_CLIENT_ID = 'test-client-id';
process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
process.env.PAYPAL_WEBHOOK_ID = 'test-webhook-id';
process.env.PAYPAL_ENVIRONMENT = 'sandbox';
delete process.env.N8N_WEBHOOK_URL;

const { createCustomerOrder, listCustomerPayments, listRevenue } = await import('../config/aion-customer-revenue.js');
const { default: webhookHandler } = await import('../server-api/webhook.js');

function response(status, payload) {
  return { ok: status >= 200 && status < 300, status, async json() { return payload; } };
}
function responseRecorder() {
  return {
    statusCode: 200, payload: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test('PayPal capture webhook resolves related order ID and verifies capture against server-side order details', async () => {
  const order = await createCustomerOrder({
    offerId: 'space-weather-brief',
    customerId: 'paypal-webhook-integration-test'
  });
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    calls.push({ url: target, headers: options.headers || {}, body: options.body });
    if (target.endsWith('/v1/oauth2/token')) {
      assert.match(options.headers?.Authorization || '', /^Basic /);
      return response(200, { access_token: 'verified-test-access-token', expires_in: 300 });
    }
    if (target.endsWith('/v1/notifications/verify-webhook-signature')) {
      assert.equal(options.headers?.Authorization, 'Bearer verified-test-access-token');
      const submitted = JSON.parse(options.body);
      assert.equal(submitted.webhook_id, 'test-webhook-id');
      assert.equal(submitted.webhook_event.id, 'WH-TEST-1');
      return response(200, { verification_status: 'SUCCESS' });
    }
    if (target.endsWith('/v2/checkout/orders/PP-ORDER-TEST-1')) {
      assert.equal(options.headers?.Authorization, 'Bearer verified-test-access-token');
      return response(200, {
        id: 'PP-ORDER-TEST-1',
        status: 'COMPLETED',
        purchase_units: [{
          custom_id: order.id,
          invoice_id: order.id,
          amount: { currency_code: 'USD', value: '180.00' },
          payments: { captures: [{
            id: 'CAPTURE-TEST-1',
            status: 'COMPLETED',
            amount: { currency_code: 'USD', value: '180.00' }
          }] }
        }]
      });
    }
    throw new Error('Unexpected PayPal URL in test: ' + target);
  };

  try {
    const req = {
      method: 'POST',
      url: '/api/webhook',
      headers: {
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-cert-url': 'https://api.sandbox.paypal.com/cert',
        'paypal-transmission-id': 'transmission-test',
        'paypal-transmission-sig': 'signature-test',
        'paypal-transmission-time': '2026-10-10T18:00:00Z'
      },
      body: {
        id: 'WH-TEST-1',
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'CAPTURE-TEST-1',
          status: 'COMPLETED',
          amount: { value: '180.00', currency_code: 'USD' },
          supplementary_data: { related_ids: { order_id: 'PP-ORDER-TEST-1' } }
        }
      }
    };
    const res = responseRecorder();
    await webhookHandler(req, res);

    assert.equal(res.statusCode, 200, JSON.stringify(res.payload));
    assert.equal(res.payload?.success, true);
    assert.ok(calls.some(call => call.url.endsWith('/v1/oauth2/token')));
    assert.ok(calls.some(call => call.url.endsWith('/v1/notifications/verify-webhook-signature')));
    assert.ok(calls.some(call => call.url.endsWith('/v2/checkout/orders/PP-ORDER-TEST-1')));

    const receipts = (await listCustomerPayments()).filter(item => item.orderId === order.id);
    assert.equal(receipts.length, 1);
    assert.equal(receipts[0].paymentReference, 'CAPTURE-TEST-1');
    assert.equal(receipts[0].amountUsd, 180);
    assert.equal((await listRevenue()).filter(item => item.orderId === order.id).length, 0,
      'a confirmed payment must not be treated as recognized service revenue before delivery');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
