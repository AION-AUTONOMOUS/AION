import { intelligenceCoreHealth, runIntelligenceTask } from '../config/aion-intelligence-core.js';

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json(intelligenceCoreHealth());
  if (req.method !== 'POST') {
    res.setHeader('allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  try {
    const result = await runIntelligenceTask(req.body || {});
    return res.status(result.status === 'blocked_by_policy' ? 403 : 200).json(result);
  } catch (error) {
    return res.status(503).json({
      status: 'unavailable',
      error: error instanceof Error ? error.message : 'intelligence core unavailable',
      fakeCompletion: false
    });
  }
}
