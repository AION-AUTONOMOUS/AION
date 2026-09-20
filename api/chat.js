module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST /api/chat'
    });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    const message =
      typeof body.message === 'string'
        ? body.message.trim()
        : '';

    const role =
      typeof body.role === 'string' && body.role.trim()
        ? body.role.trim()
        : 'researcher';

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GROQ_API_KEY is not configured in Vercel'
      });
    }

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content:
                'You are a ' +
                role +
                ' agent at AION AUTONOMOUS. Answer clearly and professionally in the same language as the user.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1500
        })
      }
    );

    const raw = await response.text();

    let data = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (_) {
      data = null;
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error:
          data?.error?.message ||
          'Groq API returned an invalid response',
        provider_status: response.status
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (typeof reply !== 'string') {
      return res.status(502).json({
        success: false,
        error: 'Groq returned no assistant message'
      });
    }

    return res.status(200).json({
      success: true,
      reply,
      agent: role
    });

  } catch (error) {
    console.error('AION /api/chat error:', error);

    return res.status(500).json({
      success: false,
      error: 'AION server error',
      details: error?.message || 'Unknown error'
    });
  }
};
