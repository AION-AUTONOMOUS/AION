import {
  spaceNetworkHealth,
  registerSpaceProvider, listSpaceProviders,
  registerSatellite, listSatellites,
  registerSpaceService, listSpaceServices
} from '../config/aion-space-network.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

async function body(req) {
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
  const path = new URL(req.url || '/', 'http://aion.local').searchParams.get('path') || 'health';

  try {
    if (req.method === 'GET' && path === 'health') return res.status(200).json({ success: true, ...spaceNetworkHealth() });
    if (req.method === 'GET' && path === 'providers') return res.status(200).json({ success: true, providers: await listSpaceProviders() });
    if (req.method === 'GET' && path === 'satellites') return res.status(200).json({ success: true, satellites: await listSatellites() });
    if (req.method === 'GET' && path === 'services') return res.status(200).json({ success: true, services: await listSpaceServices() });
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const input = await body(req);
    if (path === 'providers/register') return res.status(201).json({ success: true, provider: await registerSpaceProvider(input) });
    if (path === 'satellites/register') return res.status(201).json({ success: true, satellite: await registerSatellite(input) });
    if (path === 'services/register') return res.status(201).json({ success: true, service: await registerSpaceService(input) });

    return res.status(404).json({ success: false, error: 'Unknown space route' });
  } catch (error) {
    return res.status(400).json({ success: false, error: String(error?.message || error) });
  }
}
