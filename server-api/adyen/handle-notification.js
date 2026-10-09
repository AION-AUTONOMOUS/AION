import crypto from 'node:crypto';
import { railwayRedisCommand, hasRailwayRedis } from '../../config/aion-redis.js';
import { verifyAdyenStandardNotification, extractAdyenStandardNotificationItems } from './verify-notification.js';

const PREFIX = 'aion:stack:';
const json = value => JSON.stringify(value);
const text = value => String(value ?? '').trim();

function cors(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  if (!hasRailwayRedis() || !process.env.ADYEN_HMAC_KEY || !process.env.ADYEN_MERCHANT_ACCOUNT) {
    return res.status(503).send('Notification processing is not configured');
  }

  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      body = JSON.parse(raw || '{}');
    } catch { return res.status(400).send('Invalid JSON'); }
  }
  const items = extractAdyenStandardNotificationItems(body);
  if (!items.length) return res.status(400).send('No notification items');

  try {
    // Validate every actionable item before acknowledging the batch.
    for (const item of items) {
      if (!verifyAdyenStandardNotification(item)) return res.status(401).send('Invalid notification signature');
      if (text(item.merchantAccountCode) !== text(process.env.ADYEN_MERCHANT_ACCOUNT)) {
        return res.status(400).send('Merchant account mismatch');
      }
      if (item.eventCode !== 'AUTHORISATION') continue;
      if (String(item.success).toLowerCase() !== 'true') continue;

      const reference = text(item.merchantReference);
      const rawOrder = await railwayRedisCommand(['GET', PREFIX + 'customer-orders:' + reference]);
      if (!rawOrder) return res.status(404).send('Matching durable order not found');
      const order = JSON.parse(rawOrder);
      if (order.paymentProvider !== 'adyen' || order.status !== 'awaiting-payment') {
        if (order.paymentStatus === 'confirmed' && order.providerEventId === text(item.pspReference)) continue;
        return res.status(409).send('Order is not eligible for Adyen confirmation');
      }
      const expectedMinor = Math.round(Number(order.amountUsd) * 100);
      if (!Number.isSafeInteger(expectedMinor) || Number(item.amount?.value) !== expectedMinor ||
          text(item.amount?.currency).toUpperCase() !== text(order.currency).toUpperCase()) {
        return res.status(400).send('Amount or currency mismatch');
      }

      // Deterministic event ledger key makes retries safe after partial failures.
      // Write the immutable ledger entry with SET NX, then repair the order on retry.
      const eventHash = crypto.createHash('sha256').update(text(item.pspReference)).digest('hex');
      const revenueId = 'ADYEN-REV-' + eventHash;
      const now = new Date().toISOString();
      const updated = {
        ...order, status: 'paid', paymentStatus: 'confirmed', paymentProvider: 'adyen',
        providerEventId: text(item.pspReference), paymentReference: text(item.pspReference),
        revenueRecognized: true, paidAt: now, verifiedAt: now
      };
      const revenue = {
        id: revenueId, orderId: reference, customerId: order.customerId || 'global-counsel-customer',
        amountUsd: Number(order.amountUsd), currency: order.currency,
        paymentReference: text(item.pspReference), recognizedAt: now, source: 'adyen-hmac-verified'
      };
      const ledgerKey = PREFIX + 'customer-revenue:' + revenueId;
      const inserted = await railwayRedisCommand(['SET', ledgerKey, json(revenue), 'NX']);
      if (inserted === 'OK') {
        await railwayRedisCommand(['SADD', PREFIX + 'customer-revenue:index', revenueId]);
      } else {
        const priorRaw = await railwayRedisCommand(['GET', ledgerKey]);
        const prior = priorRaw ? JSON.parse(priorRaw) : null;
        if (!prior || prior.orderId !== reference || prior.paymentReference !== text(item.pspReference) ||
            Number(prior.amountUsd) !== Number(order.amountUsd) ||
            text(prior.currency).toUpperCase() !== text(order.currency).toUpperCase()) {
          return res.status(409).send('Existing revenue entry does not match this payment');
        }
      }
      // If this write fails after the ledger write, Adyen retry repairs the order
      // without duplicating revenue because the ledger key is deterministic.
      await railwayRedisCommand(['SET', PREFIX + 'customer-orders:' + reference, json(updated)]);
    }

    return res.status(200).send('[accepted]');
  } catch (error) {
    // Do not acknowledge failures; provider retries can be reconciled manually.
    console.error('Adyen notification processing failed:', String(error?.message || error));
    return res.status(500).send('Notification processing failed');
  }
}
