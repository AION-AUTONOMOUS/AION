
```javascript
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { message, role = 'researcher' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: 'You are a ' + role + ' agent at AION AUTONOMOUS. Answer in Arabic, clearly and professionally.' },
          { role: 'user', content: message }
        ],
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: 'Groq API error', details: error });
    }
    
    const data = await response.json();
    const reply = data.choices[0].message.content;
    
    return res.status(200).json({ 
      success: true, 
      reply,
      agent: role
    });
    
  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
```
