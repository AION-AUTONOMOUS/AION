import { dispatchTask } from '../config/aion-workers.js';
import { opsHealth } from '../config/aion-ops-engine.js';
import { processBatch, workerRuntimeStatus } from '../config/aion-worker-runtime.js';

const ALLOWED_ORIGIN =
  process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const body = req.body || {};
  if (typeof body.text !== 'string' || !body.text.trim()) {
    return res.status(400).json({ success: false, error: 'task.text required' });
  }
  if (body.text.length > 4000) {
    return res.status(413).json({ success: false, error: 'task too long' });
  }

  const dispatched = await dispatchTask(body);
  if (dispatched.action === 'blocked_by_policy') {
    return res.status(403).json({ success: false, ...dispatched, health: await opsHealth(), runtime: await workerRuntimeStatus() });
  }
  if (dispatched.action === 'await_human_approval') {
    return res.status(202).json({ success: true, ...dispatched, health: await opsHealth(), runtime: await workerRuntimeStatus() });
  }
  const results = await processBatch(1);
  const result = results[0];
  if (!result) return res.status(409).json({ success: false, error: 'Worker did not claim task', runtime: await workerRuntimeStatus() });
  if (result.status === 'failed') return res.status(502).json({ success: false, error: result.error, task: result, runtime: await workerRuntimeStatus() });
  return res.status(200).json({ success: true, task: result, worker: dispatched.worker, action: 'executed', health: await opsHealth(), runtime: await workerRuntimeStatus() });
}
