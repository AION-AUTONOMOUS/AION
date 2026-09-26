import {
  stackHealth, listCapabilities, createAutonomousPlan,
  getLedger, proposeLedgerTransfer,
  registerTokenizedAsset, listTokenizedAssets,
  registerRobot, listRobots
} from '../config/aion-autonomous-stack.js';

const ORIGIN = process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const url = new URL(req.url || '/', 'http://aion.local');
  const path = url.searchParams.get('path') || 'health';

  try {
    if (req.method === 'GET' && path === 'health') return res.status(200).json({ success: true, ...stackHealth() });
    if (req.method === 'GET' && path === 'capabilities') return res.status(200).json({ success: true, capabilities: listCapabilities() });
    if (req.method === 'GET' && path === 'ledger') return res.status(200).json({ success: true, ledger: await getLedger(url.searchParams.get('account')) });
    if (req.method === 'GET' && path === 'assets') return res.status(200).json({ success: true, assets: await listTokenizedAssets() });
    if (req.method === 'GET' && path === 'robots') return res.status(200).json({ success: true, robots: await listRobots() });

    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    const body = req.body || {};

    if (path === 'plan') {
      const plan = await createAutonomousPlan(body.goal, body);
      return res.status(201).json({ success: true, plan });
    }
    if (path === 'ledger/propose') {
      const proposal = await proposeLedgerTransfer(body);
      return res.status(202).json({ success: true, proposal });
    }
    if (path === 'assets/register') {
      const asset = await registerTokenizedAsset(body);
      return res.status(201).json({ success: true, asset });
    }
    if (path === 'robots/register') {
      const robot = await registerRobot(body);
      return res.status(201).json({ success: true, robot });
    }

    return res.status(404).json({ success: false, error: 'Unknown Autonomous Stack route' });
  } catch (error) {
    return res.status(400).json({ success: false, error: String(error?.message || error) });
  }
}
