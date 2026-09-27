import {
  economyHealth,
  createEconomicModel,
  saveEconomicModel,
  listEconomicModels
} from '../config/aion-economy.js';
import {
  spaceIntelligenceHealth,
  registerSpaceMission,
  listSpaceMissions,
  createSpaceDataJob,
  saveSpaceDataJob,
  listSpaceDataJobs
} from '../config/aion-space-intelligence.js';

const ORIGIN = process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
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
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON body')); }
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
      return res.status(200).json({ success: true, economy: economyHealth(), spaceIntelligence: spaceIntelligenceHealth() });
    }
    if (req.method === 'GET' && path === 'economy/models') return res.status(200).json({ success: true, models: await listEconomicModels() });
    if (req.method === 'GET' && path === 'space/missions') return res.status(200).json({ success: true, missions: await listSpaceMissions() });
    if (req.method === 'GET' && path === 'space/jobs') return res.status(200).json({ success: true, jobs: await listSpaceDataJobs() });

    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    const body = await readBody(req);
    if (path === 'economy/models') {
      return res.status(201).json({ success: true, model: await saveEconomicModel(createEconomicModel(body)) });
    }
    if (path === 'space/missions') {
      return res.status(201).json({ success: true, mission: await registerSpaceMission(body) });
    }
    if (path === 'space/jobs') {
      return res.status(201).json({ success: true, job: await saveSpaceDataJob(await createSpaceDataJob(body)) });
    }
    return res.status(404).json({ success: false, error: 'Unknown Economy/Space route' });
  } catch (error) {
    return res.status(400).json({ success: false, error: String(error?.message || error) });
  }
}
