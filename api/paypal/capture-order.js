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

function validOrderId(orderId) {
  return typeof orderId === 'string' && /^[A-Z0-9-]{5,64}$/.test(orderId);
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId } = req.body || {};
  if (!validOrderId(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

  try {
    const accessToken = await getAccessToken();
    const orderRes = await fetch(
      PAYPAL_BASE_URL + '/v2/checkout/orders/' + encodeURIComponent(orderId),
      { headers: { Authorization: 'Bearer ' + accessToken } }
    );
    const order = await orderRes.json();

    if (!orderRes.ok) return res.status(404).json({ error: 'Order not found' });

    if (order.status === 'COMPLETED') {
      return res.status(200).json({ status: 'COMPLETED', orderId, details: order });
    }

    if (order.status !== 'APPROVED') {
      return res.status(409).json({ error: 'Order is not approved', status: order.status });
    }

    const captureRes = await fetch(
      PAYPAL_BASE_URL + '/v2/checkout/orders/' + encodeURIComponent(orderId) + '/capture',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': orderId
        },
        body: '{}'
      }
    );
    const captureData = await captureRes.json();

    if (!captureRes.ok) {
      if (captureData.name === 'ORDER_ALREADY_CAPTURED') {
        return res.status(200).json({ status: 'COMPLETED', orderId, details: captureData });
      }
      return res.status(502).json({ error: captureData.message || 'Capture failed' });
    }

    if (captureData.status !== 'COMPLETED') {
      return res.status(409).json({ error: 'Payment was not completed', status: captureData.status || 'UNKNOWN' });
    }

    return res.status(200).json({ status: 'COMPLETED', orderId, details: captureData });
  } catch (err) {
    console.error('AION PayPal capture-order error:', err);
    return res.status(502).json({ error: 'Payment provider unavailable' });
  }
}
