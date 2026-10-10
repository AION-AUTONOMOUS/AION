import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from 'redis';

const redisUrl = process.env.AION_TEST_REDIS_URL;

test('real Redis atomically persists customer orders and payment revenue under retries and key-type faults', {
  skip: !redisUrl && 'AION_TEST_REDIS_URL is required; run through the Redis integration workflow'
}, async () => {
  process.env.NODE_ENV = 'test';
  process.env.REDIS_URL = redisUrl;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.AION_TEST_ALLOW_MEMORY_FINANCIAL_STORE;

  const store = await import('../config/aion-stack-store.js');
  const revenueApi = await import('../config/aion-customer-revenue.js');
  const client = createClient({ url: redisUrl });
  client.on('error', () => {});
  await client.connect();

  const suffix = crypto.randomUUID();
  const revenueIndex = 'aion:stack:customer-revenue:index';
  try {
    // This workflow uses a fresh Redis service; clean the two relevant indexes for repeatability.
    await client.del(revenueIndex);
    await client.del('aion:stack:customer-orders:index');

    const order = await revenueApi.createCustomerOrder({
      offerId: 'space-weather-brief',
      customerId: 'redis-integration-' + suffix
    });
    const persistedOrder = await store.getJson('customer-orders:' + order.id);
    assert.equal(persistedOrder.id, order.id);
    assert.equal(persistedOrder.paymentStatus, 'unpaid');
    assert.ok((await client.sMembers('aion:stack:customer-orders:index')).includes(order.id));

    // Preflight must detect a wrong-type revenue index before any payment/revenue key is written.
    await client.set(revenueIndex, 'wrong-type-sentinel');
    const payment = {
      paymentProvider: 'paypal',
      verificationStatus: 'SUCCESS',
      providerEventId: 'WH-' + suffix + '-A',
      paymentReference: 'CAP-' + suffix,
      amountUsd: '180.00',
      currency: 'USD'
    };
    await assert.rejects(
      () => revenueApi.confirmCustomerPayment(order.id, payment),
      /Durable financial storage unavailable.*unexpected Redis key type/
    );
    const afterFault = await store.getJson('customer-orders:' + order.id);
    assert.equal(afterFault.paymentStatus, 'unpaid', 'order must remain unpaid if Redis preflight fails');
    await client.del(revenueIndex);
    assert.equal((await revenueApi.listRevenue()).filter(x => x.orderId === order.id).length, 0,
      'no revenue record should exist after rejected preflight');

    // Race webhook/capture deliveries with the same actual capture but different event IDs.
    const secondDelivery = { ...payment, providerEventId: 'WH-' + suffix + '-B' };
    const results = await Promise.all([
      revenueApi.confirmCustomerPayment(order.id, payment),
      revenueApi.confirmCustomerPayment(order.id, secondDelivery)
    ]);
    assert.ok(results.every(x => x.paymentStatus === 'confirmed'));

    const finalOrder = await store.getJson('customer-orders:' + order.id);
    assert.equal(finalOrder.paymentStatus, 'confirmed');
    assert.equal(finalOrder.paymentReference, payment.paymentReference);
    const finalRevenue = (await revenueApi.listRevenue()).filter(x => x.orderId === order.id);
    assert.equal(finalRevenue.length, 1, 'concurrent duplicate captures must create one revenue record');
    assert.equal(finalRevenue[0].amountUsd, 180);
    assert.ok((await client.sMembers(revenueIndex)).includes(finalRevenue[0].id));

    await assert.rejects(
      () => revenueApi.confirmCustomerPayment(order.id, {
        ...payment,
        providerEventId: 'WH-' + suffix + '-DIFFERENT',
        paymentReference: 'CAP-DIFFERENT-' + suffix
      }),
      /already confirmed by a different provider payment/
    );
    assert.equal((await revenueApi.listRevenue()).filter(x => x.orderId === order.id).length, 1);
  } finally {
    await client.del(revenueIndex);
    await client.del('aion:stack:customer-orders:index');
    await client.quit();
    const storeClient = globalThis[Symbol.for('aion.railway.redis.client')];
    if (storeClient?.isOpen) await storeClient.quit();
  }
});
