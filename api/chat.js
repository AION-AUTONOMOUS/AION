
const DEPARTMENTS = {
  research: { count: 10, prompt: 'أنت باحث في AION AUTONOMOUS. مهمتك جمع المعلومات الدقيقة وتحليلها باختصار ووضوح.', specialties: ['market research','competitor analysis','trend detection','data mining','industry reports','survey design','qualitative research','quantitative analysis','trend forecasting','source verification'] },
  marketing: { count: 20, prompt: 'أنت مسوق في AION AUTONOMOUS. مهمتك جذب العملاء وبناء العلامة التجارية بمحتوى جذاب.', specialties: ['twitter content','tiktok content','instagram reels','seo','email campaigns','ads copy','linkedin posts','content strategy','youtube scripts','influencer outreach','community building','brand voice','copywriting','campaign planning','analytics reporting','growth hacking','viral content','newsletter','landing pages','cta optimization'] },
  sales: { count: 15, prompt: 'أنت مندوب مبيعات في AION AUTONOMOUS. مهمتك إقناع العملاء بخدماتنا بشكل مهني.', specialties: ['lead generation','cold outreach','negotiation','closing','proposals','discovery calls','objection handling','crm management','upselling','follow up sequences','pricing strategy','demo presentations','referral programs','pipeline management','contract drafting'] },
  development: { count: 15, prompt: 'أنت مطور في AION AUTONOMOUS. مهمتك بناء الأنظمة والأدوات بكفاءة.', specialties: ['frontend','backend','ai ml','mobile','devops','database design','api integration','security hardening','testing qa','code review','performance optimization','cloud architecture','ui ux','automation','documentation'] },
  support: { count: 15, prompt: 'أنت دعم فني في AION AUTONOMOUS. مهمتك مساعدة العملاء بلطف وسرعة.', specialties: ['customer support','technical help','onboarding','faq','troubleshooting','live chat','email support','escalation','refunds','feedback collection','sla management','knowledge base','ticket triage','user training','retention'] },
  content: { count: 15, prompt: 'أنت كاتب محتوى في AION AUTONOMOUS. مهمتك إنشاء محتوى عالي الجودة بالعربية والإنجليزية.', specialties: ['articles','translation','copywriting','scripts','documentation','blog posts','whitepapers','press releases','case studies','ebooks','product descriptions','video scripts','podcast outlines','infographics text','social captions'] },
  analysis: { count: 5, prompt: 'أنت محلل في AION AUTONOMOUS. مهمتك استخراج الرؤى من البيانات وتقديم تقارير دقيقة.', specialties: ['financial analysis','data science','reporting','forecasting','kpi tracking'] },
  security: { count: 5, prompt: 'أنت مسؤول أمان في AION AUTONOMOUS. مهمتك حماية الأنظمة ومراقبة التهديدات.', specialties: ['audit','monitoring','threat detection','compliance','incident response'] }
};

const AGENTS = [];
(function() {
  let counter = 1;
  const keys = Object.keys(DEPARTMENTS);
  for (let d = 0; d < keys.length; d++) {
    const dept = keys[d];
    const cfg = DEPARTMENTS[dept];
    for (let i = 0; i < cfg.count; i++) {
      const sp = cfg.specialties[i % cfg.specialties.length];
      AGENTS.push({
        id: 'AION-' + dept.slice(0,3).toUpperCase() + '-' + String(counter).padStart(4,'0'),
        name: dept.charAt(0).toUpperCase() + dept.slice(1) + ' Agent ' + (i+1),
        department: dept,
        specialty: sp,
        prompt: cfg.prompt + ' تخصصك: ' + sp + '.'
      });
      counter++;
    }
  }
})();

function findAgent(role) {
  if (!role) return AGENTS[0];
  let f = AGENTS.find(function(a){ return a.id === role; });
  if (f) return f;
  f = AGENTS.find(function(a){ return a.department === role; });
  if (f) return f;
  const map = { researcher:'research', analyst:'analysis', marketer:'marketing', sales:'sales', coder:'development', auditor:'security', legal:'content' };
  if (map[role]) {
    f = AGENTS.find(function(a){ return a.department === map[role]; });
    if (f) return f;
  }
  return AGENTS[0];
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const message = body.message;
    const role = body.role || body.agent || '';

    if (!message) return res.status(400).json({ success: false, error: 'message required' });

    const agent = findAgent(role);
    const systemPrompt = agent.prompt + ' اسمك: ' + agent.name + '.';

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
    try { data = JSON.parse(rawText); }
    catch (e) { return res.status(500).json({ success: false, error: 'Groq non-JSON', raw: rawText.slice(0,300) }); }

    if (!groqRes.ok) return res.status(500).json({ success: false, error: 'Groq API error', detail: data });

    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content : 'No reply';

    return res.status(200).json({
      success: true,
      reply: reply,
      agent: { id: agent.id, name: agent.name, department: agent.department, specialty: agent.specialty },
      total_agents: AGENTS.length
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
