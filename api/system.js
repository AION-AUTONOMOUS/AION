const HANDLERS = {
  'fleet': () => import('../server-api/fleet.js'),
  'chat': () => import('../server-api/chat.js'),
  'ops': () => import('../server-api/ops.js'),
  'presale': () => import('../server-api/presale.js'),
  'verify': () => import('../server-api/verify.js'),
  'webhook': () => import('../server-api/webhook.js'),
  'daily-report': () => import('../server-api/daily-report.js'),
  'ops-health': () => import('../server-api/ops-health.js'),
  'orchestrator': () => import('../server-api/orchestrator.js'),
  'runtime-dispatch': () => import('../server-api/runtime-dispatch.js'),
  'test-redis': () => import('../server-api/test-redis.js'),
  'worker-runtime-health': () => import('../server-api/worker-runtime-health.js'),
  'worker-runtime': () => import('../server-api/worker-runtime.js'),
  'ops-approve': () => import('../server-api/ops-approve.js'),
  'workers': () => import('../server-api/workers.js'),
  'paypal-client-id': () => import('../server-api/paypal/client-id.js'),
  'paypal-client-config': () => import('../server-api/paypal/client-config.js'),
  'paypal-create-order': () => import('../server-api/paypal/create-order.js'),
  'paypal-capture-order': () => import('../server-api/paypal/capture-order.js'),
  'wallet-config': () => import('../server-api/wallet/config.js'),
  'mobile': () => import('../server-api/mobile.js')
};

export default async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://aion.local');
  const route = url.searchParams.get('route');
  const loader = route ? HANDLERS[route] : null;
  if (!loader) return res.status(404).json({ success: false, error: 'Unknown AION API route' });
  try {
    const module = await loader();
    return module.default(req, res);
  } catch (error) {
    console.error('AION system router error:', error);
    return res.status(500).json({ success: false, error: 'AION system route failed' });
  }
}
