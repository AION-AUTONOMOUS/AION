import test from 'node:test';
import assert from 'node:assert/strict';

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
