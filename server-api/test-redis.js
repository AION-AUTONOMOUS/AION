const ALLOWED_ORIGIN =
  process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return res.status(503).json({ success: false, message: 'Redis غير مهيأ' });
  }

  try {
    const response = await fetch(url + '/ping', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(502).json({ success: false, message: 'Redis غير متاح' });
    }

    return res.status(200).json({ success: true, message: 'Redis يعمل بنجاح' });
  } catch (error) {
    console.error('AION Redis health error:', error);
    return res.status(502).json({ success: false, message: 'فشل الاتصال بـ Redis' });
  }
}
