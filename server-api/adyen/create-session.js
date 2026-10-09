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
const environment = () => process.env.ADYEN_ENVIRONMENT === 'live' ? 'live' : 'test';
const apiBase = () => environment() === 'live'
  ? 'https://checkout-live.adyen.com'
  : 'https://checkout-test.adyen.com';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', origin());
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ADYEN_API_KEY;
  const merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;
  if (!apiKey || !merchantAccount) {
    return res.status(503).json({ error: 'Card and Apple Pay checkout is not configured yet', code: 'PAYMENT_NOT_CONFIGURED' });
  }

  const body = req.body || {};
  const item = CATALOG[String(body.serviceId || '')];
  if (!item) return res.status(400).json({ error: 'Invalid service' });

  const reference = 'AION-GC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const payload = {
    merchantAccount,
    reference,
    amount: { currency: 'USD', value: item.amount },
    countryCode: String(body.countryCode || 'US').slice(0, 2).toUpperCase(),
    channel: 'Web',
    returnUrl: origin() + '/global-counsel.html?payment=return',
    shopperInteraction: 'Ecommerce',
    lineItems: [{ id: body.serviceId, description: item.title, quantity: 1, amountIncludingTax: item.amount, taxPercentage: 0 }]
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
      console.error('Adyen session creation failed:', response.status, data.errorCode || data.message || 'unknown');
      return res.status(502).json({ error: 'Unable to start secure checkout' });
    }
    return res.status(200).json({
      session: { id: data.id, sessionData: data.sessionData },
      reference,
      amount: { currency: 'USD', value: item.amount },
      service: item.title,
      environment: environment(),
      clientKey: process.env.ADYEN_CLIENT_KEY || null
    });
  } catch (error) {
    console.error('Adyen session request failed:', error?.message || error);
    return res.status(502).json({ error: 'Payment provider unavailable' });
  }
}
