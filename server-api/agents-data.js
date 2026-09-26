const DEPARTMENTS = {
  research: {
    count: 10,
    specialties: ['market research','competitor analysis','trend detection','data mining','industry reports'],
    prompt: 'أنت باحث في AION AUTONOMOUS. مهمتك جمع المعلومات الدقيقة وتحليلها باختصار ووضوح.'
  },
  marketing: {
    count: 20,
    specialties: ['twitter content','tiktok content','instagram reels','seo','email campaigns','ads copy','linkedin posts','content strategy'],
    prompt: 'أنت مسوق في AION AUTONOMOUS. مهمتك جذب العملاء وبناء العلامة التجارية بمحتوى جذاب.'
  },
  sales: {
    count: 15,
    specialties: ['lead generation','cold outreach','negotiation','closing','proposals'],
    prompt: 'أنت مندوب مبيعات في AION AUTONOMOUS. مهمتك إقناع العملاء بخدماتنا بشكل مهني.'
  },
  development: {
    count: 15,
    specialties: ['frontend','backend','ai ml','mobile','devops'],
    prompt: 'أنت مطور في AION AUTONOMOUS. مهمتك بناء الأنظمة والأدوات بكفاءة.'
  },
  support: {
    count: 15,
    specialties: ['customer support','technical help','onboarding','faq','troubleshooting'],
    prompt: 'أنت دعم فني في AION AUTONOMOUS. مهمتك مساعدة العملاء بلطف وسرعة.'
  },
  content: {
    count: 15,
    specialties: ['articles','translation','copywriting','scripts','documentation'],
    prompt: 'أنت كاتب محتوى في AION AUTONOMOUS. مهمتك إنشاء محتوى عالي الجودة بالعربية والإنجليزية.'
  },
  analysis: {
    count: 5,
    specialties: ['financial analysis','data science','reporting','forecasting','kpi tracking'],
    prompt: 'أنت محلل في AION AUTONOMOUS. مهمتك استخراج الرؤى من البيانات وتقديم تقارير دقيقة.'
  },
  security: {
    count: 5,
    specialties: ['audit','monitoring','threat detection','compliance','incident response'],
    prompt: 'أنت مسؤول أمان في AION AUTONOMOUS. مهمتك حماية الأنظمة ومراقبة التهديدات.'
  }
};

function generateAgents() {
  const agents = [];
  let counter = 1;
  for (const [dept, config] of Object.entries(DEPARTMENTS)) {
    for (let i = 0; i < config.count; i++) {
      const specialty = config.specialties[i % config.specialties.length];
      agents.push({
        id: 'AION-' + dept.slice(0,3).toUpperCase() + '-' + String(counter).padStart(4,'0'),
        name: dept.charAt(0).toUpperCase() + dept.slice(1) + ' Agent ' + (i+1),
        department: dept,
        specialty: specialty,
        prompt: config.prompt
      });
      counter++;
    }
  }
  return agents;
}

const AGENTS = generateAgents();

module.exports = { AGENTS, DEPARTMENTS };
