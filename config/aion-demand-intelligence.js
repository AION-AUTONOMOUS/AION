export const AION_DEMAND_INTELLIGENCE_VERSION = '1.0.0';

export const DEMAND_SIGNAL_TYPES = Object.freeze([
  'rfp-tender','procurement','explicit-service-request','product-launch',
  'capacity-expansion','funding-investment','hiring-demand','incident-disruption',
  'regulatory-change','public-strategy-change','partner-program','inbound-lead'
]);

export const DEMAND_STAGES = Object.freeze([
  'discovered','verified','scored','offer-routed','sales-ready','contact-eligible',
  'engaged','qualified','quoted','paid','delivered','recurring','suppressed'
]);

export const DEMAND_OFFERS = Object.freeze({
  'earth-change-intelligence': { priceUsd:250, delivery:'verified-analysis', evidence:'Copernicus Sentinel-2' },
  'space-weather-brief': { priceUsd:180, delivery:'verified-report', evidence:'NOAA SWPC' },
  'leo-situational-awareness': { priceUsd:250, delivery:'verified-intelligence', evidence:'CelesTrak + operational space data' },
  'disaster-intelligence': { priceUsd:350, delivery:'incident-brief', evidence:'Copernicus + NASA GIBS' },
  'custom-digital-service': { priceUsd:null, delivery:'qualified-scope', evidence:'documented business requirements' },
  'orbital-exchange': { priceUsd:null, delivery:'qualified-provider-routing', evidence:'verified provider/customer evidence' }
});

const OFFER_RULES = Object.freeze([
  ['disaster-intelligence',['incident-disruption','regulatory-change'],['insurance-risk','logistics-supply-chain','maritime-aviation','energy-infrastructure']],
  ['earth-change-intelligence',['product-launch','capacity-expansion','public-strategy-change'],['agriculture-climate','mining-resources','energy-infrastructure','research-technology']],
  ['leo-situational-awareness',['capacity-expansion','product-launch','incident-disruption'],['space-earth-observation','space-geointelligence','satellite-connectivity']],
  ['orbital-exchange',['rfp-tender','procurement','partner-program'],['space-earth-observation','space-geointelligence','satellite-connectivity','space-applications']],
  ['custom-digital-service',['explicit-service-request','procurement','partner-program','hiring-demand'],['enterprise-ai','cloud-ai','energy-infrastructure','research-technology','logistics-supply-chain']]
]);

function clamp(n,min=0,max=100){ return Math.max(min,Math.min(max,Number(n)||0)); }

export function scoreDemandSignal(signal={}){
  const pain=clamp(signal.painSignal), urgency=clamp(signal.urgencySignal);
  const budget=clamp(signal.budgetSignal), fit=clamp(signal.solutionFit);
  const access=clamp(signal.accessSignal), recurring=clamp(signal.recurringPotential);
  const evidence=clamp(signal.evidenceStrength), risk=clamp(signal.complianceRisk);
  return clamp(Math.round(pain*.20+urgency*.18+budget*.16+fit*.20+access*.08+recurring*.08+evidence*.10-risk*.18));
}

export function routeDemandOffer(signal={}){
  const explicit=String(signal.offerId||'').trim();
  if(explicit && DEMAND_OFFERS[explicit]) return explicit;
  const match=OFFER_RULES.find(([,types,sectors])=>types.includes(String(signal.type||''))&&sectors.includes(String(signal.sector||'')));
  return match?.[0] || (signal.inbound?'custom-digital-service':'earth-change-intelligence');
}

export function demandCompliance(signal={}){
  const consent=signal.consent===true;
  const inbound=signal.inbound===true || signal.type==='inbound-lead' || signal.type==='explicit-service-request';
  const suppression=signal.suppressed===true || signal.doNotContact===true;
  if(suppression) return {status:'suppressed',contactAllowed:false,reason:'suppression-or-do-not-contact'};
  if(consent) return {status:'opt-in',contactAllowed:true,reason:'documented-consent'};
  if(inbound) return {status:'inbound',contactAllowed:true,reason:'customer-initiated-demand'};
  if(signal.officialChannel===true && signal.jurisdictionReviewed===true){
    return {status:'review-required',contactAllowed:false,reason:'requires-channel-and-jurisdiction-review-before-outreach'};
  }
  return {status:'research-only',contactAllowed:false,reason:'no verified outreach basis'};
}

export function classifyDemandSignal(signal={}){
  const offerId=routeDemandOffer(signal);
  const compliance=demandCompliance(signal);
  const score=scoreDemandSignal({...signal,offerId});
  const highValue=score>=75;
  const salesReady=highValue&&compliance.contactAllowed;
  return {
    version:AION_DEMAND_INTELLIGENCE_VERSION,
    stage:compliance.status==='suppressed'?'suppressed':salesReady?'sales-ready':'scored',
    score, offerId, offer:DEMAND_OFFERS[offerId], compliance,
    nextAction:compliance.status==='suppressed'?'suppress':salesReady?'route-to-sales':highValue?'nurture-content-or-partner':'continue-monitoring'
  };
}

export function demandIntelligenceStrategy(){
  return {
    version:AION_DEMAND_INTELLIGENCE_VERSION,
    model:'continuous-evidence-backed-demand-intelligence',
    signalTypes:DEMAND_SIGNAL_TYPES, stages:DEMAND_STAGES,
    scoring:{pain:.20,urgency:.18,budget:.16,solutionFit:.20,access:.08,recurringPotential:.08,evidence:.10,complianceRisk:-.18},
    rules:[
      'prefer explicit buying signals over generic company fit',
      'verify the signal before raising its score',
      'never invent contact, customer, contract, budget or purchase intent',
      'never treat a public signal as consent to market to a person',
      'never send bulk unsolicited or deceptive outreach',
      'respect applicable privacy, e-marketing, platform and sector rules',
      'store only business-relevant data needed for qualification',
      'honour suppression and do-not-contact signals',
      'route unqualified demand to content, partner or monitoring paths',
      'recognize revenue only after provider-confirmed payment'
    ],
    sources:[
      'public company announcements','official procurement/RFP pages',
      'official partner/program pages','official product and expansion announcements',
      'verified inbound requests','public regulatory or incident notices'
    ]
  };
}

export function demandIntelligenceHealth(){
  return {version:AION_DEMAND_INTELLIGENCE_VERSION,status:'active',mode:'evidence-first',outreachDefault:'disabled-until-eligible',revenueClaimsMade:0};
}
