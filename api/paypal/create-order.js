
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, currency = 'USD', description, details } = req.body || {};
  if (!amount) return res.status(400).json({ error: 'Amount required' });

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  const baseUrl = process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  try {
    const auth = Buffer.from(clientId + ':' + clientSecret).toString('base64');
    const tokenRes = await fetch(baseUrl + '/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token failed');

    const orderRes = await fetch(baseUrl + '/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + tokenData.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: currency, value: amount.toString() },
          description: (description || 'AION Service') + (details ? ' - ' + details.slice(0, 100) : '')
        }]
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData.message || 'Order failed');

    return res.status(200).json({ id: orderData.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
