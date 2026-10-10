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
  const journalKey = 'aion:financial:journal';
  try {
    // This workflow uses a fresh Redis service; clean the relevant keys for repeatability.
    await client.del(revenueIndex);
    await client.del('aion:stack:customer-orders:index');
    await client.del(journalKey);

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

    // Simulate a stale/partial revenue record; reports must hide it while the order is unpaid.
    const partialRevenue = {
      id: 'AION-REV-PARTIAL-' + suffix,
      orderId: order.id,
      customerId: order.customerId,
      amountUsd: order.amountUsd,
      currency: order.currency,
      paymentReference: 'CAP-PARTIAL-' + suffix,
      recognizedAt: new Date().toISOString(),
      source: 'confirmed-payment'
    };
    await store.setJson('customer-revenue:' + partialRevenue.id, partialRevenue);
    await store.addToIndex('customer-revenue', partialRevenue.id);
    assert.equal((await revenueApi.listRevenue()).filter(x => x.orderId === order.id).length, 0,
      'a revenue index/key must not expose income before the matching order is confirmed');
    await client.del('aion:stack:customer-revenue:' + partialRevenue.id);
    await client.sRem(revenueIndex, partialRevenue.id);

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
    const finalPayments = (await revenueApi.listCustomerPayments()).filter(x => x.orderId === order.id);
    assert.equal(finalPayments.length, 1, 'concurrent duplicate captures must create one payment receipt');
    assert.equal(finalPayments[0].amountUsd, 180);
    assert.equal(finalOrder.revenueRecognized, false, 'payment alone must not recognize service revenue');
    assert.equal((await revenueApi.listRevenue()).filter(x => x.orderId === order.id).length, 0);
    assert.ok((await client.sMembers(revenueIndex)).includes(finalPayments[0].id));

    // Payment capture must also be represented in the durable double-entry journal.
    const { postConfirmedPaymentReceipt } = await import('../financial-core/customer-payment-ledger.js');
    const { verifyJournalChain } = await import('../financial-core/journal.js');
    const journalResults = await Promise.all([
      postConfirmedPaymentReceipt(finalOrder),
      postConfirmedPaymentReceipt(finalOrder)
    ]);
    assert.ok(journalResults.some(result => result.duplicate === true),
      'concurrent journal retries should deduplicate the same PayPal capture');
    let journalState = JSON.parse(await client.get(journalKey));
    let journalCheck = verifyJournalChain(journalState);
    assert.equal(journalCheck.valid, true);
    let captureEntries = journalState.entries.filter(entry => entry.reference === payment.paymentReference);
    assert.equal(captureEntries.length, 1, 'one PayPal capture must create one journal entry');
    assert.equal(captureEntries[0].currency, 'USD');
    assert.equal(captureEntries[0].totalMinor, '18000');
    assert.deepEqual(captureEntries[0].postings, [
      { accountId: 'assets:paypal-clearing', debitMinor: 18000, creditMinor: 0 },
      { accountId: 'liabilities:customer-prepayments', debitMinor: 0, creditMinor: 18000 }
    ]);

    // Revenue is recognized only after delivery evidence, with a second double-entry posting.
    const deliveredOrder = await revenueApi.recordDelivery(order.id, { evidence: 'DELIVERY-EVIDENCE-' + suffix });
    assert.equal(deliveredOrder.deliveryStatus, 'delivered');
    assert.equal(deliveredOrder.revenueRecognized, true);
    const finalRevenue = (await revenueApi.listRevenue()).filter(x => x.orderId === order.id);
    assert.equal(finalRevenue.length, 1);
    assert.equal(finalRevenue[0].amountUsd, 180);
    assert.equal(finalRevenue[0].source, 'delivered-service');
    assert.ok(finalRevenue[0].recognizedAt);

    journalState = JSON.parse(await client.get(journalKey));
    journalCheck = verifyJournalChain(journalState);
    assert.equal(journalCheck.valid, true);
    captureEntries = journalState.entries.filter(entry => entry.reference === payment.paymentReference);
    const serviceRevenueEntries = journalState.entries.filter(entry => entry.reference === order.id);
    assert.equal(captureEntries.length, 1);
    assert.equal(serviceRevenueEntries.length, 1, 'delivery revenue recognition must be idempotent');
    assert.deepEqual(serviceRevenueEntries[0].postings, [
      { accountId: 'liabilities:customer-prepayments', debitMinor: 18000, creditMinor: 0 },
      { accountId: 'revenue:services', debitMinor: 0, creditMinor: 18000 }
    ]);

    // If journal storage is temporarily unreadable after delivery evidence is saved,
    // income must remain unrecognized; retry should finish without duplicate journal entries.
    const recoveryOrder = await revenueApi.createCustomerOrder({
      offerId: 'space-weather-brief',
      customerId: 'redis-recovery-' + suffix
    });
    const recoveryPayment = {
      ...payment,
      providerEventId: 'WH-RECOVERY-' + suffix,
      paymentReference: 'CAP-RECOVERY-' + suffix
    };
    await revenueApi.confirmCustomerPayment(recoveryOrder.id, recoveryPayment);
    const recoveryPaidOrder = await store.getJson('customer-orders:' + recoveryOrder.id);
    const { postConfirmedPaymentReceipt: postReceipt } = await import('../financial-core/customer-payment-ledger.js');
    await postReceipt(recoveryPaidOrder);
    const journalSnapshot = await client.get(journalKey);

    await client.set(journalKey, 'corrupt-journal-state');
    const recoveryEvidence = 'DELIVERY-RECOVERY-' + suffix;
    await assert.rejects(
      () => revenueApi.recordDelivery(recoveryOrder.id, { evidence: recoveryEvidence }),
      /Durable financial journal unavailable/
    );
    const pendingDelivery = await store.getJson('customer-orders:' + recoveryOrder.id);
    assert.equal(pendingDelivery.deliveryStatus, 'delivered-pending-journal');
    assert.equal(pendingDelivery.revenueRecognized, false);
    assert.equal((await revenueApi.listRevenue()).filter(x => x.orderId === recoveryOrder.id).length, 0,
      'revenue must stay hidden while its journal entry is missing');

    await client.set(journalKey, journalSnapshot);
    const recoveredOrder = await revenueApi.recordDelivery(recoveryOrder.id, { evidence: recoveryEvidence });
    assert.equal(recoveredOrder.deliveryStatus, 'delivered');
    assert.equal(recoveredOrder.revenueRecognized, true);
    const repeatedDelivery = await revenueApi.recordDelivery(recoveryOrder.id, { evidence: recoveryEvidence });
    assert.equal(repeatedDelivery.revenueRecognized, true);

    const recoveredRevenue = (await revenueApi.listRevenue()).filter(x => x.orderId === recoveryOrder.id);
    assert.equal(recoveredRevenue.length, 1);
    const recoveredJournal = JSON.parse(await client.get(journalKey));
    assert.equal(verifyJournalChain(recoveredJournal).valid, true);
    assert.equal(recoveredJournal.entries.filter(entry => entry.reference === recoveryOrder.id).length, 1,
      'journal recovery plus delivery retry must only recognize revenue once');

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
    await client.del(journalKey);
    await client.quit();
    const storeClient = globalThis[Symbol.for('aion.railway.redis.client')];
    if (storeClient?.isOpen) await storeClient.quit();
    const ledgerClient = globalThis[Symbol.for('aion.financial.ledger.redis.client')];
    if (ledgerClient?.isOpen) await ledgerClient.quit();
  }
});
