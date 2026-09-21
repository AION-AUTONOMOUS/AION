
const { AGENTS } = require('./agents-data.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const message = body.message;
    const agentId = body.agent;

    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }

    let agent = AGENTS.find(a => a.id === agentId);

    if (!agent && agentId) {
      agent = AGENTS.find(a => a.department === agentId);
    }

    if (!agent) {
      agent = AGENTS[0];
    }

    const systemPrompt = agent.prompt + ' اسمك: ' + agent.name + ' — تخصصك: ' + agent.specialty + '.';

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
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

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(500).json({ error: 'Groq error', detail: errText });
    }

    const data = await groqRes.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : 'No reply';

    return res.status(200).json({
      reply: reply,
      agent: {
        id: agent.id,
        name: agent.name,
        department: agent.department,
        specialty: agent.specialty
      },
      total_agents: AGENTS.length
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
