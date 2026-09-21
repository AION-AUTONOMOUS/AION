
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const message = body.message;
    const role = body.role || 'researcher';

    if (!message) {
      return res.status(400).json({ success: false, error: 'message required' });
    }

    const prompts = {
      researcher: 'أنت باحث في AION AUTONOMOUS. مهمتك جمع المعلومات وتحليلها بدقة.',
      analyst: 'أنت محلل في AION AUTONOMOUS. مهمتك تحليل البيانات وتقديم رؤى.',
      marketer: 'أنت مسوق في AION AUTONOMOUS. مهمتك التسويق وجذب العملاء.',
      sales: 'أنت مندوب مبيعات في AION AUTONOMOUS. مهمتك إقناع العملاء.',
      coder: 'أنت مبرمج في AION AUTONOMOUS. مهمتك كتابة الكود وحل المشاكل التقنية.',
      auditor: 'أنت مدقق في AION AUTONOMOUS. مهمتك مراجعة الجودة.',
      legal: 'أنت مستشار قانوني في AION AUTONOMOUS. مهمتك تقديم المشورة القانونية.'
    };

    const systemPrompt = prompts[role] || 'أنت مساعد في AION AUTONOMOUS.';

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
      return res.status(500).json({ success: false, error: 'Groq non-JSON', raw: rawText.slice(0, 300) });
    }

    if (!groqRes.ok) {
      return res.status(500).json({ success: false, error: 'Groq API error', detail: data });
    }

    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : 'No reply';

    return res.status(200).json({ success: true, reply: reply });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
