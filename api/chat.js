
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
    const agentName = body.agent || 'AION Assistant';

    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY missing in Vercel env' });
    }

    const systemPrompt = 'أنت ' + agentName + ' في شركة AION AUTONOMOUS. أجب بالعربية باختصار ودقة.';

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

    const rawText = await groqRes.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({
        error: 'Groq returned non-JSON',
        status: groqRes.status,
        raw: rawText.slice(0, 500)
      });
    }

    if (!groqRes.ok) {
      return res.status(500).json({
        error: 'Groq API error',
        status: groqRes.status,
        detail: data
      });
    }

    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : 'No reply from Groq';

    return res.status(200).json({ reply: reply });

  } catch (err) {
    return res.status(500).json({
      error: 'Server exception',
      message: err.message
    });
  }
};
