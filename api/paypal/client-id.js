
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  return res.status(200).json({ clientId });
}
