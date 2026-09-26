import crypto from 'node:crypto';

export function createVerificationToken(orderId, serviceId, amount) {
  const secret = process.env.AION_VERIFY_SECRET || process.env.PAYPAL_SECRET;
  if (!secret) throw new Error('Verification secret is not configured');
  return crypto
    .createHmac('sha256', secret)
    .update([orderId, serviceId, amount, 'AION-V1'].join('|'))
    .digest('hex');
}

export function verifyVerificationToken(token, orderId, serviceId, amount) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) return false;
  const expected = createVerificationToken(orderId, serviceId, amount);
  return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'));
}
