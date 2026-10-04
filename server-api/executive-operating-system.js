import { executiveOperatingHealth, executiveOperatingSnapshot } from '../config/aion-executive-operating-system.js';
import { executiveDecisionHealth, executiveDecisionSnapshot } from '../config/aion-executive-decision-loop.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.AION_PUBLIC_ORIGIN || '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.status(405).json({ success:false, error:'GET only' });
    return;
  }

  const path = new URL(req.url || '/', 'http://aion.local').searchParams.get('path') || 'health';

  if (path === 'health') {
    res.status(200).json({ success:true, ...executiveOperatingHealth(), decisionLoop:await executiveDecisionHealth() });
    return;
  }

  if (path === 'snapshot') {
    res.status(200).json({ success:true, snapshot:executiveOperatingSnapshot(), decisionLoop:await executiveDecisionSnapshot() });
    return;
  }

  if (path === 'decisions') {
    res.status(200).json({ success:true, decisionLoop:await executiveDecisionSnapshot() });
    return;
  }

  res.status(404).json({ success:false, error:'Unknown executive operating system path' });
}
