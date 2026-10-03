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
