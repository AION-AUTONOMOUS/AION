import { listAgents, listServices } from '../apps/aion-mobile-service/src/agents.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const url = new URL(req.url || '/', 'http://aion.local');
  const path = url.searchParams.get('path') || 'health';

  if (req.method === 'GET' && path === 'health') {
    return res.status(200).json({ success: true, service: 'AION Mobile Core', version: '1.1.0', status: 'ready' });
  }
  if (req.method === 'GET' && path === 'agents') {
    return res.status(200).json({ success: true, service: 'AION Mobile Core', agents: listAgents() });
  }
  if (req.method === 'GET' && path === 'services') {
    return res.status(200).json({ success: true, service: 'AION Mobile Core', services: listServices() });
  }
  if (req.method !== 'POST' || path !== 'chat') {
    return res.status(404).json({ success: false, error: 'Unknown Mobile Core route' });
  }

  const body = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return res.status(400).json({ success: false, error: 'message required' });
  if (message.length > 12000) return res.status(413).json({ success: false, error: 'message too long' });
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ success: false, error: 'AI provider is not configured' });

  const agent = listAgents().find((item) => item.id === body.agent) || listAgents()[0];
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'أنت AION Mobile Core. اعمل بدقة، لا تدّع تنفيذ أفعال خارج النظام، ولا تنفذ قرارات مالية أو قانونية أو سياسية حساسة دون موافقة بشرية. الوكيل: ' + agent.name + '.'
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });
    const raw = await groqRes.text();
    let data;
    try { data = JSON.parse(raw); } catch { return res.status(502).json({ success: false, error: 'AI provider returned invalid JSON' }); }
    if (!groqRes.ok) return res.status(502).json({ success: false, error: 'AI provider error' });
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply) return res.status(502).json({ success: false, error: 'AI provider returned no reply' });
    return res.status(200).json({ success: true, reply, agent });
  } catch (error) {
    console.error('AION Mobile Core error:', error);
    return res.status(502).json({ success: false, error: 'Mobile AI provider request failed' });
  }
}
