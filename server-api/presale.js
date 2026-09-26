import crypto from 'node:crypto';

const ALLOWED_ORIGIN =
  process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';
const ALLOWED_AMOUNTS = new Set(['1000', '5000', '10000', '50000', '100000']);

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function redisCommand(command) {
  // Support both current Upstash names and the legacy Vercel KV names.
  // This keeps the presale compatible with either Vercel/Upstash integration.
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Presale storage is not configured');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Redis returned a non-JSON response');
  }
  if (!response.ok || data.error) throw new Error(data.error || 'Redis request failed');
  return data.result;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const amount = String(body.amount || '');

  if (name.length < 2 || name.length > 100) return res.status(400).json({ success: false, error: 'الاسم غير صالح' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ success: false, error: 'البريد الإلكتروني غير صالح' });
  if (!ALLOWED_AMOUNTS.has(amount)) return res.status(400).json({ success: false, error: 'الكمية غير صالحة' });

  const id = 'AION-PRE-' + crypto.randomUUID();
  const record = { id, name, email, amount, createdAt: new Date().toISOString(), source: 'coin.html' };

  try {
    // The record is the source of truth. The index is only an auxiliary convenience.
    await redisCommand(['SET', 'aion:presale:' + id, JSON.stringify(record)]);
    try {
      await redisCommand(['RPUSH', 'aion:presale:index', id]);
    } catch (indexError) {
      console.error('AION presale index warning:', indexError.message);
    }
    return res.status(201).json({ success: true, id, message: 'تم تسجيل الطلب بنجاح' });
  } catch (err) {
    console.error('AION presale storage error:', err.message);
    return res.status(503).json({ success: false, error: 'الخدمة غير متاحة مؤقتًا. حاول مرة أخرى لاحقًا.' });
  }
}
