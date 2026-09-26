import { dailyReport } from '../config/aion-daily-report.js';

const ALLOWED_ORIGIN =
  process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  return res.status(200).json({ success: true, ...dailyReport() });
}
