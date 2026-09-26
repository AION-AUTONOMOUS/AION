const HANDLERS = {
  'daily-report': () => import('../server-api/daily-report.js'),
  'ops-health': () => import('../server-api/ops-health.js'),
  'orchestrator': () => import('../server-api/orchestrator.js'),
  'runtime-dispatch': () => import('../server-api/runtime-dispatch.js'),
  'test-redis': () => import('../server-api/test-redis.js'),
  'worker-runtime-health': () => import('../server-api/worker-runtime-health.js'),
  'worker-runtime': () => import('../server-api/worker-runtime.js'),
  'workers': () => import('../server-api/workers.js')
};

export default async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://aion.local');
  const route = url.searchParams.get('route');
  const loader = route ? HANDLERS[route] : null;

  if (!loader) {
    return res.status(404).json({ success: false, error: 'Unknown AION API route' });
  }

  try {
    const module = await loader();
    return module.default(req, res);
  } catch (error) {
    console.error('AION system router error:', error);
    return res.status(500).json({ success: false, error: 'AION system route failed' });
  }
}
