export const AION_GLOBAL_PROSPECTS_VERSION = '1.0.0';

export const GLOBAL_PROSPECTS = Object.freeze([
  {
    id:'schneider-electric',
    company:'Schneider Electric',
    sector:'energy-infrastructure',
    region:'global',
    fitScore:94,
    offer:'custom-digital-service',
    reason:'Industrial energy and infrastructure operations with explicit digital services, maintenance intelligence, cybersecurity and carbon-reduction needs.',
    source:'https://www.se.com/be/en/'
  },
  {
    id:'mda-space',
    company:'MDA Space',
    sector:'space-geointelligence',
    region:'global',
    fitScore:96,
    offer:'orbital-exchange',
    reason:'Launching MDA CHORUS and expanding commercial Earth-observation intelligence; strong fit for downstream intelligence, marketplace routing and qualified customer opportunities.',
    source:'https://mda.space/'
  },
  {
    id:'open-cosmos',
    company:'Open Cosmos',
    sector:'space-earth-observation',
    region:'global',
    fitScore:95,
    offer:'leo-situational-awareness',
    reason:'Operates satellite infrastructure, Earth-observation data and AI platforms for climate, energy, natural resources and critical operations.',
    source:'https://www.open-cosmos.com/'
  },
  {
    id:'planet',
    company:'Planet',
    sector:'earth-observation',
    region:'global',
    fitScore:92,
    offer:'earth-change-intelligence',
    reason:'Global near-daily Earth observation provider; natural fit for downstream change intelligence and decision-ready analysis.',
    source:'https://www.planet.com/'
  },
  {
    id:'taranis',
    company:'Taranis',
    sector:'agriculture',
    region:'global',
    fitScore:91,
    offer:'earth-change-intelligence',
    reason:'AI crop-intelligence company operating at scale; complementary geospatial intelligence can support broader environmental and field-change workflows.',
    source:'https://www.taranis.com/'
  },
  {
    id:'swiss-re',
    company:'Swiss Re',
    sector:'insurance-risk',
    region:'global',
    fitScore:97,
    offer:'disaster-intelligence',
    reason:'Global reinsurer with explicit risk-data solutions and natural-catastrophe exposure; high fit for rapid disaster intelligence and measurable risk workflows.',
    source:'https://www.swissre.com/'
  },
  {
    id:'maersk',
    company:'Maersk',
    sector:'logistics-maritime',
    region:'global',
    fitScore:93,
    offer:'disaster-intelligence',
    reason:'Global integrated logistics operator across 130+ countries; weather, disruption and infrastructure intelligence can support resilience decisions.',
    source:'https://www.maersk.com/en'
  },
  {
    id:'coforge',
    company:'Coforge',
    sector:'enterprise-ai',
    region:'global',
    fitScore:90,
    offer:'custom-digital-service',
    reason:'Enterprise AI engineering provider focused on production agentic systems, data foundations and measurable business outcomes; potential channel and implementation fit.',
    source:'https://www.coforge.com/'
  },
  {
    id:'servicenow',
    company:'ServiceNow',
    sector:'enterprise-ai',
    region:'global',
    fitScore:88,
    offer:'custom-digital-service',
    reason:'Enterprise AI/workflow platform with broad industry coverage; potential complementary intelligence and autonomous-operations use cases.',
    source:'https://www.servicenow.com/'
  },
  {
    id:'ovhcloud',
    company:'OVHcloud',
    sector:'cloud-ai',
    region:'global',
    fitScore:89,
    offer:'custom-digital-service',
    reason:'Global cloud infrastructure and partner ecosystem; potential fit for AI-native operational intelligence and data/AI services.',
    source:'https://www.ovhcloud.com/en/'
  },
  {
    id:'astranis',
    company:'Astranis',
    sector:'satellite-connectivity',
    region:'global',
    fitScore:94,
    offer:'leo-situational-awareness',
    reason:'Satellite manufacturer/operator delivering dedicated connectivity with a global ground network; strong operational and intelligence adjacency.',
    source:'https://www.astranis.com/commercial'
  },
  {
    id:'esa-space-solutions',
    company:'ESA Space Solutions ecosystem',
    sector:'space-applications',
    region:'europe-and-global',
    fitScore:95,
    offer:'earth-change-intelligence',
    reason:'Active ecosystem around satellite-enabled infrastructure, agriculture, climate and environmental applications; useful channel for commercial demand discovery.',
    source:'https://business.esa.int/projects/theme/infrastructure-smartcities'
  }
]);

export function globalProspectingStrategy(){
  return {
    version:AION_GLOBAL_PROSPECTS_VERSION,
    model:'evidence-backed-global-demand-development',
    priority:'high-fit-business-problems-first',
    sectors:[
      'energy-infrastructure','mining-resources','agriculture-climate',
      'maritime-aviation','insurance-risk','logistics-supply-chain',
      'research-technology','enterprise-ai','space-earth-observation'
    ],
    stages:['discover','verify','score','route-offer','request-contact','qualify','quote','payment','delivery','outcome','recurring'],
    rules:[
      'use public business evidence to score fit',
      'do not invent contact, partnership, customer or contract status',
      'do not send bulk unsolicited or deceptive messages',
      'respect applicable privacy, marketing and platform rules',
      'prefer official company contact channels and opt-in demand',
      'recognize revenue only after provider-confirmed payment'
    ]
  };
}

export function listGlobalProspects({sector=null,minScore=0}={}){
  return GLOBAL_PROSPECTS
    .filter(p => !sector || p.sector===sector)
    .filter(p => p.fitScore >= Number(minScore||0))
    .sort((a,b)=>b.fitScore-a.fitScore);
}

export function prospectingHealth(){
  return {
    version:AION_GLOBAL_PROSPECTS_VERSION,
    status:'active',
    evidenceBackedTargets:GLOBAL_PROSPECTS.length,
    highestFitScore:Math.max(...GLOBAL_PROSPECTS.map(x=>x.fitScore)),
    revenueClaimsMade:0
  };
}
