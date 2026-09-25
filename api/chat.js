import { AGENTS, TOTAL_AGENTS, findAgent } from '../config/aion-fleet.js';

const ALLOWED_ORIGIN =
  process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const role = body.role || body.agent || '';

    if (!message) return res.status(400).json({ success: false, error: 'message required' });
    if (message.length > 12000) return res.status(413).json({ success: false, error: 'message too long' });
    if (!process.env.GROQ_API_KEY) return res.status(503).json({ success: false, error: 'AI provider is not configured' });

    const agent = findAgent(role);
    const systemPrompt =
      'أنت وكيل برمجي ضمن AION AUTONOMOUS. ' +
      agent.mission +
      ' تخصصك: ' + agent.specialty +
      '. اعمل بدقة، لا تدّع تنفيذ أفعال خارج النظام، ولا تنفذ قرارات مالية أو قانونية أو سياسية حساسة دون موافقة بشرية. ' +
      'اسمك: ' + agent.name + '.';

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });

    const rawText = await groqRes.text();
    let data;
    try { data = JSON.parse(rawText); }
    catch { return res.status(502).json({ success: false, error: 'AI provider returned invalid JSON' }); }

    if (!groqRes.ok) {
      console.error('AION Groq error:', data);
      return res.status(502).json({ success: false, error: 'AI provider error' });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply) {
      return res.status(502).json({ success: false, error: 'AI provider returned no reply' });
    }

    return res.status(200).json({
      success: true,
      reply,
      agent: {
        id: agent.id,
        name: agent.name,
        department: agent.department,
        specialty: agent.specialty
      },
      total_agents: TOTAL_AGENTS
    });
  } catch (error) {
    console.error('AION chat error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
