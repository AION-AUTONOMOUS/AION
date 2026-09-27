import test from 'node:test';
import assert from 'node:assert/strict';
import { paypalBaseUrl, paypalEnvironment } from '../server-api/paypal/config.js';

test('PayPal defaults to sandbox', () => {
  const previous = process.env.PAYPAL_ENVIRONMENT;
  delete process.env.PAYPAL_ENVIRONMENT;
  assert.equal(paypalEnvironment(), 'sandbox');
  assert.equal(paypalBaseUrl(), 'https://api-m.sandbox.paypal.com');
  if (previous === undefined) delete process.env.PAYPAL_ENVIRONMENT;
  else process.env.PAYPAL_ENVIRONMENT = previous;
});

test('PayPal production requires an explicit production environment', () => {
  const previous = process.env.PAYPAL_ENVIRONMENT;
  process.env.PAYPAL_ENVIRONMENT = 'production';
  assert.equal(paypalEnvironment(), 'production');
  assert.equal(paypalBaseUrl(), 'https://api-m.paypal.com');
  if (previous === undefined) delete process.env.PAYPAL_ENVIRONMENT;
  else process.env.PAYPAL_ENVIRONMENT = previous;
});
