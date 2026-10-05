import crypto from 'node:crypto';
import { addToIndex, setJson } from '../config/aion-stack-store.js';

function clean(v, max = 500) {
  return String(v ?? '').trim().slice(0, max);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.AION_PUBLIC_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body && typeof req.body === 'object'
      ? req.body
      : {};

    const name = clean(body.name, 160);
    const email = clean(body.email, 320).toLowerCase();
    const amount = clean(body.amount, 32);

    if (!name) return res.status(400).json({ success: false, error: 'name required' });
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'valid email required' });
    }

    const allowedAmounts = new Set(['1000', '5000', '10000', '50000', '100000']);
    if (!allowedAmounts.has(amount)) {
      return res.status(400).json({ success: false, error: 'invalid AION amount' });
    }

    const id = 'AION-PRE-' + crypto.randomUUID();
    const record = {
      id,
      name,
      email,
      amountAion: Number(amount),
      status: 'interest_registered',
      paymentRequired: false,
      source: 'coin-presale',
      createdAt: new Date().toISOString(),
      nextAction: 'Notify registrant before official launch'
    };

    await setJson('presale-interest:' + id, record);
    await addToIndex('presale-interest', id);

    return res.status(201).json({
      success: true,
      reservation: {
        id,
        status: record.status,
        amountAion: record.amountAion,
        paymentRequired: false
      }
    });
  } catch (error) {
    console.error('AION presale error:', error);
    return res.status(500).json({
      success: false,
      error: 'تعذر تسجيل الحجز الآن. حاول مرة أخرى.'
    });
  }
}
