import test from 'node:test';
import assert from 'node:assert/strict';

// In-memory storage is allowed only for this isolated Node test process.
process.env.NODE_ENV = 'test';
process.env.AION_TEST_ALLOW_MEMORY_FINANCIAL_STORE = '1';

const source = await import('../config/aion-customer-revenue.js');

test('customer revenue requires provider verification evidence', async () => {
  const order = await source.createCustomerOrder({offerId:'space-weather-brief',customerId:'autonomous-test'});
  await assert.rejects(
    () => source.confirmCustomerPayment(order.id,{paymentProvider:'paypal',verificationStatus:'SUCCESS',providerEventId:'client-forged'}),
    /payment provider verification required|providerEventId/
  );
});

test('customer revenue rejects a verified provider amount that differs from the order', async () => {
  const order = await source.createCustomerOrder({offerId:'space-weather-brief',customerId:'amount-mismatch-test'});
  await assert.rejects(
    () => source.confirmCustomerPayment(order.id,{
      paymentProvider:'paypal',verificationStatus:'SUCCESS',
      providerEventId:'verified-event-amount-mismatch',paymentReference:'capture-amount-mismatch',
      amountUsd:'1.00',currency:'USD'
    }),
    /amount does not match/
  );
});

test('customer revenue rejects a verified provider currency that differs from the order', async () => {
  const order = await source.createCustomerOrder({offerId:'space-weather-brief',customerId:'currency-mismatch-test'});
  await assert.rejects(
    () => source.confirmCustomerPayment(order.id,{
      paymentProvider:'paypal',verificationStatus:'SUCCESS',
      providerEventId:'verified-event-currency-mismatch',paymentReference:'capture-currency-mismatch',
      amountUsd:'180.00',currency:'EUR'
    }),
    /currency does not match/
  );
});

test('customer revenue accepts matching verified amount and currency evidence', async () => {
  const order = await source.createCustomerOrder({offerId:'space-weather-brief',customerId:'matching-payment-test'});
  const paid = await source.confirmCustomerPayment(order.id,{
    paymentProvider:'paypal',verificationStatus:'SUCCESS',
    providerEventId:'verified-event-matching-payment',paymentReference:'capture-matching-payment',
    amountUsd:'180.00',currency:'USD'
  });
  assert.equal(paid.paymentStatus,'confirmed');
  assert.equal(paid.revenueRecognized,true);
});

test('customer revenue rejects missing amount or currency evidence', async () => {
  const order = await source.createCustomerOrder({offerId:'space-weather-brief',customerId:'missing-evidence-test'});
  const base = {
    paymentProvider:'paypal',verificationStatus:'SUCCESS',
    providerEventId:'verified-event-missing-evidence',paymentReference:'capture-missing-evidence'
  };
  await assert.rejects(
    () => source.confirmCustomerPayment(order.id,{...base,currency:'USD'}),
    /amount evidence required/
  );
  await assert.rejects(
    () => source.confirmCustomerPayment(order.id,{...base,amountUsd:'180.00'}),
    /currency does not match/
  );
});

test('customer revenue is idempotent for the same payment but rejects a different payment for an already-paid order', async () => {
  const order = await source.createCustomerOrder({offerId:'space-weather-brief',customerId:'idempotency-test'});
  const payment = {
    paymentProvider:'paypal',verificationStatus:'SUCCESS',
    providerEventId:'verified-event-idempotency',paymentReference:'capture-idempotency',
    amountUsd:'180.00',currency:'USD'
  };
  const first = await source.confirmCustomerPayment(order.id,payment);
  const duplicate = await source.confirmCustomerPayment(order.id,payment);
  assert.equal(duplicate.providerEventId,first.providerEventId);
  const recognized = (await source.listRevenue()).filter(record => record.orderId === order.id);
  assert.equal(recognized.length,1,'a duplicate webhook must not create a second revenue record');
  await assert.rejects(
    () => source.confirmCustomerPayment(order.id,{...payment,providerEventId:'different-event',paymentReference:'different-capture'}),
    /already confirmed by a different provider payment/
  );
});
