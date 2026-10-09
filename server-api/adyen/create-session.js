import { hasRailwayRedis, railwayRedisCommand } from '../../config/aion-redis.js';

const CATALOG = {
  simple_letter: { title: 'Simple legal letter', amount: 400 },
  evidence_timeline: { title: 'Evidence and timeline organizer', amount: 500 },
  family_matter: { title: 'Family matter preparation', amount: 700 },
  defence_draft: { title: 'Defence or response draft', amount: 900 },
  company_summary: { title: 'Business legal issue summary', amount: 4900 },
  contract_review: { title: 'Contract or policy checklist', amount: 9900 },
  commercial_dispute: { title: 'Commercial dispute preparation', amount: 24900 }
};

const origin = () => (process.env.AION_PUBLIC_ORIGIN || 'https://aion-qosyss6vp-aiongenesisss-8801.vercel.app').replace(/\/$/, '');

/*
 * SECURITY GATE: this endpoint is intentionally test-only.
 * Do not add a live switch here. Production payments require a separately
 * reviewed endpoint, verified provider webhooks, idempotency, and order ledger.
 */
const environment = () => 'test';
const apiBase = () => 'https://checkout-test.adyen.com';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', origin());
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ADYEN_API_KEY;
  const merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;
  const clientKey = process.env.ADYEN_CLIENT_KEY;

  if (!apiKey || !merchantAccount || !clientKey) {
    return res.status(503).json({
      error: 'Test checkout is not configured. No payment was started.',
      code: 'PAYMENT_NOT_CONFIGURED'
    });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const serviceId = String(body.serviceId || '');
  const item = CATALOG[serviceId];
  if (!item) return res.status(400).json({ error: 'Invalid service', code: 'INVALID_SERVICE' });

  const countryCode = String(body.countryCode || 'US').toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return res.status(400).json({ error: 'Invalid country code', code: 'INVALID_COUNTRY' });
  }

  const reference = 'AION-GC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  // The order must exist in durable Redis before the provider can authorise it.
  // This checkout remains test-only and fails closed when durable storage is unavailable.
  if (!hasRailwayRedis()) {
    return res.status(503).json({ error: 'Durable payment storage is required; checkout was not started.', code: 'DURABLE_STORAGE_REQUIRED' });
  }
  const order = {
    id: reference, offerId: serviceId, customerId: 'global-counsel-customer',
    serviceTitle: item.title, amountUsd: item.amount / 100, currency: 'USD',
    paymentProvider: 'adyen', status: 'awaiting-payment', paymentStatus: 'unpaid',
    deliveryStatus: 'not-started', revenueRecognized: false, createdAt: new Date().toISOString()
  };
  try {
    await railwayRedisCommand(['SET', 'aion:stack:customer-orders:' + reference, JSON.stringify(order)]);
    await railwayRedisCommand(['SADD', 'aion:stack:customer-orders:index', reference]);
  } catch (error) {
    console.error('Unable to persist Adyen order:', String(error?.message || error));
    return res.status(503).json({ error: 'Order storage unavailable; checkout was not started.', code: 'ORDER_PERSISTENCE_FAILED' });
  }

  const payload = {
    merchantAccount,
    reference,
    amount: { currency: 'USD', value: item.amount },
    countryCode,
    channel: 'Web',
    returnUrl: origin() + '/global-counsel.html?payment=return',
    shopperInteraction: 'Ecommerce',
    lineItems: [{ id: serviceId, description: item.title, quantity: 1, amountIncludingTax: item.amount, taxPercentage: 0 }]
  };

  try {
    const response = await fetch(apiBase() + '/v72/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id || !data.sessionData) {
      console.error('Adyen test session creation failed:', response.status, data.errorCode || data.message || 'unknown');
      return res.status(502).json({ error: 'Unable to start test checkout', code: 'PROVIDER_SESSION_FAILED' });
    }

    return res.status(200).json({
      session: { id: data.id, sessionData: data.sessionData },
      reference,
      amount: { currency: 'USD', value: item.amount },
      service: item.title,
      environment: 'test',
      clientKey
    });
  } catch (error) {
    console.error('Adyen test session request failed:', error?.message || error);
    return res.status(502).json({ error: 'Test payment provider unavailable', code: 'PROVIDER_UNAVAILABLE' });
  }
}
