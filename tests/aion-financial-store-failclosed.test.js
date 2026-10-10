import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

function runIsolated(source, overrides = {}) {
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    AION_TEST_ALLOW_MEMORY_FINANCIAL_STORE: '',
    REDIS_URL: '',
    UPSTASH_REDIS_REST_URL: '',
    UPSTASH_REDIS_REST_TOKEN: '',
    KV_REST_API_URL: '',
    KV_REST_API_TOKEN: '',
    ...overrides
  };
  return execFileSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
    timeout: 12000
  });
}

test('financial writes fail closed when no durable Redis is configured', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { setJson, addToIndex } from './config/aion-stack-store.js';
    await assert.rejects(() => setJson('customer-orders:no-redis', { id: 'no-redis' }), /Durable financial storage unavailable/);
    await assert.rejects(() => addToIndex('customer-revenue', 'no-redis'), /Durable financial storage unavailable/);
  `;
  assert.doesNotThrow(() => runIsolated(script));
});

test('financial reads fail closed instead of reading a stale in-memory fallback', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { getJson, listIndexed } from './config/aion-stack-store.js';
    await assert.rejects(() => getJson('customer-orders:no-redis'), /Durable financial storage unavailable/);
    await assert.rejects(() => listIndexed('customer-revenue'), /Durable financial storage unavailable/);
  `;
  assert.doesNotThrow(() => runIsolated(script));
});

test('financial Redis write failures propagate and never report a successful write', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { setJson } from './config/aion-stack-store.js';
    await assert.rejects(() => setJson('customer-revenue:redis-down', { id: 'redis-down' }), /Durable financial storage unavailable/);
  `;
  assert.doesNotThrow(() => runIsolated(script, { REDIS_URL: 'redis://127.0.0.1:1' }));
});

test('atomic payment confirmation fails closed when Redis cannot commit', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { commitCustomerPayment } from './config/aion-stack-store.js';
    await assert.rejects(() => commitCustomerPayment({
      orderId: 'order-1',
      updatedOrder: { id: 'order-1', paymentStatus: 'confirmed', providerEventId: 'event-1', paymentReference: 'capture-1' },
      revenue: { id: 'revenue-1' },
      providerEventId: 'event-1',
      paymentReference: 'capture-1',
      amountUsd: 10,
      currency: 'USD'
    }), /Durable financial storage unavailable/);
  `;
  assert.doesNotThrow(() => runIsolated(script, { REDIS_URL: 'redis://127.0.0.1:1' }));
});
