export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'Order ID required' });

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  const baseUrl = 'https://api-m.paypal.com';

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

    const captureRes = await fetch(baseUrl + '/v2/checkout/orders/' + orderId + '/capture', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + tokenData.access_token,
        'Content-Type': 'application/json'
      }
    });

    const captureData = await captureRes.json();
    if (!captureRes.ok) throw new Error(captureData.message || 'Capture failed');

    return res.status(200).json({ status: 'COMPLETED', details: captureData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
