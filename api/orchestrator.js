import { routeTask, controlPlaneHealth } from '../config/aion-control-plane.js';

const ALLOWED_ORIGIN =
  process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const task = req.body || {};
  if (typeof task.text !== 'string' || !task.text.trim()) {
    return res.status(400).json({ success: false, error: 'task.text required' });
  }
  if (task.text.length > 4000) {
    return res.status(413).json({ success: false, error: 'task too long' });
  }

  return res.status(200).json({
    success: true,
    ...routeTask(task),
    controlPlane: controlPlaneHealth()
  });
}
