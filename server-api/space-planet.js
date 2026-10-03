import {
  planetTaskingHealth,
  listPlanetOrders,
  getPlanetOrder,
  previewPlanetPricing,
  createPlanetTaskingOrder,
  cancelPlanetTaskingOrder
} from '../config/aion-planet-tasking.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const path = new URL(req.url || '/', 'http://aion.local').searchParams.get('path') || 'health';

  try {
    if (req.method === 'GET' && path === 'health') {
      return res.status(200).json({ success: true, ...planetTaskingHealth() });
    }
    if (req.method === 'GET' && path === 'orders') {
      return res.status(200).json({ success: true, orders: await listPlanetOrders() });
    }
    if (req.method === 'GET' && path === 'order') {
      const orderId = new URL(req.url || '/', 'http://aion.local').searchParams.get('orderId');
      return res.status(200).json({ success: true, order: await getPlanetOrder(orderId) });
    }
    if (req.method === 'POST' && path === 'pricing') {
      return res.status(200).json({ success: true, pricing: await previewPlanetPricing(await readBody(req)) });
    }
    if (req.method === 'POST' && path === 'orders') {
      return res.status(201).json({ success: true, order: await createPlanetTaskingOrder(await readBody(req)) });
    }
    if (req.method === 'DELETE' && path === 'order') {
      const url = new URL(req.url || '/', 'http://aion.local');
      return res.status(204).end(await cancelPlanetTaskingOrder(url.searchParams.get('orderId'), url.searchParams.get('acceptCancellationCharge') === 'true'));
    }
    return res.status(404).json({ success: false, error: 'Unknown Planet Space route' });
  } catch (error) {
    return res.status(400).json({ success: false, error: String(error?.message || error) });
  }
}
