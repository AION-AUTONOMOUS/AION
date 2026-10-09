import crypto from 'node:crypto';

/**
 * Verify Adyen Standard payment webhook HMAC signatures.
 * ADYEN_HMAC_KEY must be the hexadecimal key configured for this webhook.
 * This helper verifies authenticity only; callers must still validate and
 * persist the order, amount, currency, merchant, event type, and idempotency.
 */
export function verifyAdyenStandardNotification(item, hmacKey = process.env.ADYEN_HMAC_KEY) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  if (typeof hmacKey !== 'string' || !/^[0-9a-fA-F]{64,}$/.test(hmacKey) || hmacKey.length % 2 !== 0) return false;

  const signature = item.additionalData?.hmacSignature;
  if (typeof signature !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(signature) || signature.length % 4 !== 0) return false;

  const fields = [
    item.pspReference,
    item.originalReference,
    item.merchantAccountCode,
    item.merchantReference,
    item.amount?.value,
    item.amount?.currency,
    item.eventCode,
    item.success
  ];
  if (fields.some(value => value === undefined || value === null)) return false;

  const payload = fields.map(value => String(value)).join(':');
  const expected = crypto
    .createHmac('sha256', Buffer.from(hmacKey, 'hex'))
    .update(payload, 'utf8')
    .digest();
  const supplied = Buffer.from(signature, 'base64');
  if (supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(supplied, expected);
}

export function extractAdyenStandardNotificationItems(body) {
  if (!body || !Array.isArray(body.notificationItems)) return [];
  return body.notificationItems
    .map(entry => entry?.NotificationRequestItem)
    .filter(item => item && typeof item === 'object' && !Array.isArray(item));
}
