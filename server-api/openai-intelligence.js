import { openAIGatewayHealth, runOpenAI } from '../config/aion-openai-gateway.js';

export async function openAIIntelligenceHandler(req, res) {
  if (req.method === 'GET') return res.status(200).json(openAIGatewayHealth());
  if (req.method !== 'POST') {
    res.setHeader('allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const result = await runOpenAI(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    return res.status(503).json({
      status: 'unavailable',
      error: error instanceof Error ? error.message : 'OpenAI gateway error',
      fakeCompletion: false
    });
  }
}
