import { companyOrchestratorHealth, planCompanyWork, executeCompanyTask } from '../config/aion-company-orchestrator.js';

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json(companyOrchestratorHealth());
  if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
  try {
    const body = req.body || {};
    if (body.action === 'plan') return res.status(200).json({ status:'planned', work:planCompanyWork(body), fakeCompletion:false });
    return res.status(200).json(await executeCompanyTask(body));
  } catch (error) {
    return res.status(503).json({ status:'unavailable', error:error instanceof Error ? error.message : 'orchestrator error', fakeCompletion:false });
  }
}
