import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../server-api/adyen/handle-notification.js';

function response() {
  return {
    statusCode: 200, headers: {}, body: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    send(value) { this.body = value; return this; },
    json(value) { this.body = value; return this; },
    end() { this.ended = true; return this; }
  };
}
const keys = ['REDIS_URL', 'ADYEN_HMAC_KEY', 'ADYEN_MERCHANT_ACCOUNT'];
function save() { return Object.fromEntries(keys.map(k => [k, process.env[k]])); }
function restore(saved) {
  for (const k of keys) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
}

test('Adyen notification endpoint rejects methods other than POST', async () => {
  const res = response();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('Adyen notification endpoint fails closed when durable storage or HMAC configuration is absent', async () => {
  const saved = save();
  try {
    delete process.env.REDIS_URL;
    delete process.env.ADYEN_HMAC_KEY;
    delete process.env.ADYEN_MERCHANT_ACCOUNT;
    const res = response();
    await handler({ method: 'POST', body: { notificationItems: [] } }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body, 'Notification processing is not configured');
  } finally { restore(saved); }
});

test('Adyen notification endpoint rejects an invalid HMAC before any Redis access', async () => {
  const saved = save();
  try {
    process.env.REDIS_URL = 'redis://127.0.0.1:1';
    process.env.ADYEN_HMAC_KEY = 'a'.repeat(64);
    process.env.ADYEN_MERCHANT_ACCOUNT = 'test-merchant';
    const res = response();
    await handler({ method: 'POST', body: { notificationItems: [{ NotificationRequestItem: {
      pspReference: 'psp-1', originalReference: '', merchantAccountCode: 'test-merchant',
      merchantReference: 'AION-GC-test', amount: { value: 400, currency: 'USD' },
      eventCode: 'AUTHORISATION', success: 'true', additionalData: { hmacSignature: 'invalid' }
    } }] } }, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body, 'Invalid notification signature');
  } finally { restore(saved); }
});
