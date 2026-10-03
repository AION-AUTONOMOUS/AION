import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../server-api/worker-runtime-health.js';

function response() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.payload = value;
      return this;
    }
  };
}

test('worker runtime health returns awaited runtime state', async () => {
  const req = { method: 'GET' };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(typeof res.payload.version, 'string');
  assert.equal(typeof res.payload.maxConcurrency, 'number');
  assert.equal(typeof res.payload.durableQueue, 'boolean');
});

test('worker runtime health rejects non-GET requests', async () => {
  const req = { method: 'POST' };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.payload, { success: false, error: 'Method not allowed' });
});
