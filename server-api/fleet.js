import { fleetHealth, DEPARTMENTS } from '../config/aion-fleet.js';

const ALLOWED_ORIGIN =
  process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  return res.status(200).json({
    success: true,
    fleet: {\n      ...fleetHealth(),\n      department_details: Object.values(DEPARTMENTS).map(({ id, name, count, mission, specialties }) => ({ id, name, count, mission, specialties }))\n    },
    runtime: {
      model: 'shared-worker-runtime',
      serverless_entrypoints: 1,
      note: '10,000 registered roles are application data, not 10,000 Vercel Functions.'
    }
  });
}
