import { getService } from './services.js';

const PAYPAL_BASE_URL = 'https://api-m.paypal.com';
const ALLOWED_ORIGIN = process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  if (!clientId || !clientSecret) throw new Error('PayPal configuration is incomplete');

  const auth = Buffer.from(clientId + ':' + clientSecret).toString('base64');
  const tokenRes = await fetch(PAYPAL_BASE_URL + '/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) throw new Error('PayPal authentication failed');
  return tokenData.access_token;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const service = getService(body.serviceTitle);
  if (!service) return res.status(400).json({ error: 'Invalid service' });

  const details = typeof body.details === 'string' ? body.details.slice(0, 500) : '';

  try {
    const accessToken = await getAccessToken();
    const invoiceId = 'AION-' + Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8);

    const orderRes = await fetch(PAYPAL_BASE_URL + '/v2/checkout/orders', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': invoiceId
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        application_context: {
          brand_name: 'AION AUTONOMOUS',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: ALLOWED_ORIGIN + '/teacher.html?paypal=success',
          cancel_url: ALLOWED_ORIGIN + '/teacher.html?paypal=cancel'
        },
        purchase_units: [{
          reference_id: service.id,
          invoice_id: invoiceId,
          custom_id: service.id,
          description: service.description,
          amount: { currency_code: 'USD', value: service.price.toFixed(2) }
        }]
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.id) throw new Error(orderData.message || 'PayPal order creation failed');

    const approvalLink = Array.isArray(orderData.links)
      ? orderData.links.find(link => link.rel === 'approve')?.href
      : null;

    return res.status(200).json({
      id: orderData.id,
      serviceId: service.id,
      amount: service.price.toFixed(2),
      currency: 'USD',
      approvalUrl: approvalLink || ('https://www.paypal.com/checkoutnow?token=' + orderData.id)
    });
  } catch (err) {
    console.error('AION PayPal create-order error:', err);
    return res.status(502).json({ error: 'Payment provider unavailable' });
  }
}
