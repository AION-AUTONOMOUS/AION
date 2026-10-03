import { sentinelHubHealth, searchSentinelCatalog, processSentinelImage } from './space-sentinel.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.AION_PUBLIC_ORIGIN || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const url = new URL(req.url || '/', 'http://aion.local');
  const path = url.searchParams.get('path') || 'health';

  try {
    if (req.method === 'GET' && path === 'health') {
      return res.status(200).json({ success: true, ...sentinelHubHealth() });
    }
    if (req.method === 'POST' && path === 'catalog') {
      return res.status(200).json({ success: true, catalog: await searchSentinelCatalog(await readBody(req)) });
    }
    if (req.method === 'POST' && path === 'process') {
      const image = await processSentinelImage(await readBody(req));
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', String(image.length));
      return res.send(image);
    }
    return res.status(404).json({ success: false, error: 'Unknown Sentinel route' });
  } catch (error) {
    return res.status(400).json({ success: false, error: String(error?.message || error) });
  }
}
