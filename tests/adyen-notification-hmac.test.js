import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  verifyAdyenStandardNotification,
  extractAdyenStandardNotificationItems
} from '../server-api/adyen/verify-notification.js';

const key = '44782DEF547AAA06C910C43932B1EB0C71FC68D9D0C057550C48EC2ACF6BA056';
const item = {
  pspReference: '7914073381342284',
  originalReference: '',
  merchantAccountCode: 'TestMerchant',
  merchantReference: 'TestPayment-1407325143704',
  amount: { value: 1130, currency: 'EUR' },
  eventCode: 'AUTHORISATION',
  success: 'true',
  additionalData: { hmacSignature: 'coqCmt/IZ4E3CzPvMY8zTjQVL5hYJUiBRg8UU+iCWo0=' }
};

test('validates Adyen Standard webhook signature using the documented sample', () => {
  assert.equal(verifyAdyenStandardNotification(item, key), true);
});

test('rejects a changed amount, signature, or missing signature', () => {
  assert.equal(verifyAdyenStandardNotification({ ...item, amount: { value: 1, currency: 'EUR' } }, key), false);
  assert.equal(verifyAdyenStandardNotification({ ...item, additionalData: { hmacSignature: 'bad' } }, key), false);
  assert.equal(verifyAdyenStandardNotification({ ...item, additionalData: {} }, key), false);
});

test('rejects malformed keys and malformed notification objects', () => {
  assert.equal(verifyAdyenStandardNotification(item, 'not-a-key'), false);
  assert.equal(verifyAdyenStandardNotification(null, key), false);
  assert.equal(verifyAdyenStandardNotification(item, ''), false);
});

test('extracts only Standard notification request items', () => {
  const items = extractAdyenStandardNotificationItems({
    notificationItems: [
      { NotificationRequestItem: item },
      { other: true },
      null
    ]
  });
  assert.equal(items.length, 1);
  assert.equal(items[0], item);
  assert.deepEqual(extractAdyenStandardNotificationItems({}), []);
});
