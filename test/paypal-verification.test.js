import test from 'node:test';
import assert from 'node:assert/strict';
import { createVerificationToken, verifyVerificationToken } from '../server-api/paypal/verification.js';

process.env.AION_VERIFY_SECRET = 'test-secret';

test('PayPal verification token binds order, service and amount', () => {
  const token = createVerificationToken('ORDER-12345', 'lesson-plan', '1.33');
  assert.equal(verifyVerificationToken(token, 'ORDER-12345', 'lesson-plan', '1.33'), true);
  assert.equal(verifyVerificationToken(token, 'ORDER-12345', 'other-service', '1.33'), false);
  assert.equal(verifyVerificationToken(token, 'ORDER-12345', 'lesson-plan', '9.99'), false);
  assert.equal(verifyVerificationToken(token, 'ORDER-99999', 'lesson-plan', '1.33'), false);
});

test('invalid verification tokens are rejected', () => {
  assert.equal(verifyVerificationToken('bad', 'ORDER-12345', 'lesson-plan', '1.33'), false);
});
