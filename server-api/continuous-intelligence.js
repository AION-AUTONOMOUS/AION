import { runEconomicIntelligenceCycle } from '../config/aion-economic-intelligence-engine.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const cycle = await runEconomicIntelligenceCycle({ goal: 'Continuous AION real-data intelligence and measurable economic learning.' });
    return res.status(200).json({ success: true, cycleId: cycle.id, status: cycle.status, evidenceQuality: cycle.verification.score, productId: cycle.product.id });
  } catch (error) {
    console.error('AION continuous intelligence error:', error);
    return res.status(503).json({ success: false, error: String(error?.message || error) });
  }
}
