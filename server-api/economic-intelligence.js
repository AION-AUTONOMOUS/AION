import { economicIntelligenceHealth, getEconomicIntelligenceCycle, listEconomicIntelligenceProducts, listEconomicEvents, runEconomicIntelligenceCycle } from '../config/aion-economic-intelligence-engine.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.AION_PUBLIC_ORIGIN || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON body')); } });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const url = new URL(req.url || '/', 'http://aion.local');
  const path = url.searchParams.get('path') || 'health';
  try {
    if (req.method === 'GET' && path === 'health') return res.status(200).json({ success: true, ...economicIntelligenceHealth() });
    if (req.method === 'GET' && path === 'products') return res.status(200).json({ success: true, products: await listEconomicIntelligenceProducts() });
    if (req.method === 'GET' && path === 'events') return res.status(200).json({ success: true, events: await listEconomicEvents() });
    if (req.method === 'GET' && path === 'cycle') {
      const cycle = await getEconomicIntelligenceCycle(url.searchParams.get('id'));
      return cycle ? res.status(200).json({ success: true, cycle }) : res.status(404).json({ success: false, error: 'cycle not found' });
    }
    if (req.method === 'POST' && path === 'run') return res.status(201).json({ success: true, cycle: await runEconomicIntelligenceCycle(await readBody(req)) });
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: String(error?.message || error) });
  }
}
