import { createHash } from 'node:crypto';
import { getFinancialLedgerRedisClient } from '../config/aion-redis.js';
import { appendJournalRedis } from './redis-journal-store.js';

const JOURNAL_KEY = 'aion:financial:journal';
const PAYPAL_CLEARING_ACCOUNT = 'assets:paypal-clearing';
const CUSTOMER_PREPAYMENTS_ACCOUNT = 'liabilities:customer-prepayments';

function toMinorUnits(amountUsd) {
  const amount = Number(amountUsd);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new TypeError('confirmed payment amount must be positive');
  }
  const minor = Math.round(amount * 100);
  if (!Number.isSafeInteger(minor) || minor <= 0 || Math.abs(amount * 100 - minor) > 1e-7) {
    throw new TypeError('confirmed payment amount must have at most two decimal places');
  }
  return minor;
}

/**
 * Record a verified customer payment as a double-entry receipt.
 *
 * This books funds to PayPal clearing against customer prepayments (a liability).
 * It intentionally does not recognize service income: delivery and accounting
 * policy must be evaluated separately. The capture-derived idempotency key lets
 * webhook and browser-return flows retry this safely.
 */
export async function postConfirmedPaymentReceipt(order, { client, now } = {}) {
  if (!order || order.paymentStatus !== 'confirmed' || order.revenueRecognized !== true) {
    throw new Error('a durably confirmed customer payment is required before journal posting');
  }
  if (String(order.paymentProvider || '').toLowerCase() !== 'paypal') {
    throw new Error('only a verified PayPal customer payment is supported by this journal adapter');
  }
  const captureId = String(order.paymentReference || '').trim();
  if (!captureId || captureId.length > 200) throw new TypeError('PayPal capture reference is required');

  const minor = toMinorUnits(order.amountUsd);
  const idempotencyDigest = createHash('sha256').update(captureId).digest('hex');
  const journalCommand = {
    idempotencyKey: 'paypal:capture:' + idempotencyDigest,
    currency: String(order.currency || '').toUpperCase(),
    reference: captureId,
    postings: [
      { accountId: PAYPAL_CLEARING_ACCOUNT, debitMinor: minor, creditMinor: 0 },
      { accountId: CUSTOMER_PREPAYMENTS_ACCOUNT, debitMinor: 0, creditMinor: minor }
    ]
  };

  const redisClient = client || await getFinancialLedgerRedisClient();
  return appendJournalRedis(redisClient, JOURNAL_KEY, journalCommand, {
    ...(now ? { now } : order.verifiedAt ? { now: order.verifiedAt } : {})
  });
}

export const customerPaymentLedgerConfig = Object.freeze({
  journalKey: JOURNAL_KEY,
  receiptDebitAccount: PAYPAL_CLEARING_ACCOUNT,
  receiptCreditAccount: CUSTOMER_PREPAYMENTS_ACCOUNT,
  incomeRecognition: 'deferred-until-delivery-review'
});
