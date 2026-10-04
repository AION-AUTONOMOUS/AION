export const AION_GLOBAL_DISTRESSED_MAP_VERSION='1.0.0';

export const DISTRESSED_REGIONS=Object.freeze([
  {id:'north-america',name:'North America',priority:94,focus:['Chapter 11 asset sales','court-approved asset purchases','insolvency trustee sales'],countries:['United States','Canada','Mexico'],sourceTypes:['bankruptcy courts','government insolvency registries','court sale notices','licensed insolvency professionals'],officialSources:[
    {name:'U.S. Courts / Bankruptcy',url:'https://www.uscourts.gov/services-forms/bankruptcy'},
    {name:'U.S. Department of Justice — U.S. Trustee Program',url:'https://www.justice.gov/ust'},
    {name:'Canada — Office of the Superintendent of Bankruptcy',url:'https://ised-isde.canada.ca/site/office-superintendent-bankruptcy/en'}
  ]},
  {id:'south-america',name:'South America',priority:82,focus:['judicial reorganization','bankruptcy/liquidation','judicial auctions'],countries:['Brazil','Argentina','Chile','Colombia','Peru','Uruguay'],sourceTypes:['commercial courts','official gazettes','judicial auction portals','insolvency administrators'],officialSources:[
    {name:'Brazil — Gov.br',url:'https://www.gov.br/'},
    {name:'Brazil — Conselho Nacional de Justiça',url:'https://www.cnj.jus.br/'}
  ]},
  {id:'europe',name:'Europe',priority:98,focus:['insolvency registers','pre-pack/going-concern sales','judicial auctions'],countries:['EU Member States','United Kingdom','Switzerland','Norway'],sourceTypes:['EU e-Justice registers','national insolvency registers','courts','official auction platforms','insolvency practitioners'],officialSources:[
    {name:'EU e-Justice — Insolvency Registers',url:'https://e-justice.europa.eu/topics/registers-business-insolvency-land/bankruptcy-and-insolvency-registers_en'},
    {name:'EU Insolvency Registers Interconnection',url:'https://webgate.ec.europa.eu/iri/integrated/index.html'},
    {name:'EU Judicial Auctions pilot',url:'https://eujudicialauctions.eu/'},
    {name:'UK Insolvency Service',url:'https://www.gov.uk/government/organisations/insolvency-service'}
  ]},
  {id:'asia',name:'Asia',priority:91,focus:['insolvency resolution','liquidation auctions','asset reconstruction/sales'],countries:['India','Japan','South Korea','Singapore','Indonesia','Malaysia','China','Hong Kong'],sourceTypes:['insolvency boards','commercial courts','official auction portals','receivers/liquidators'],officialSources:[
    {name:'India — Insolvency and Bankruptcy Board of India',url:'https://ibbi.gov.in/'},
    {name:'Singapore — Ministry of Law',url:'https://www.mlaw.gov.sg/'}
  ]},
  {id:'africa',name:'Africa',priority:76,focus:['liquidation','business rescue','court/receiver asset sales'],countries:['South Africa','Nigeria','Kenya','Egypt','Morocco','Ghana'],sourceTypes:['commercial courts','official gazettes','business rescue practitioners','liquidators','auction notices'],officialSources:[
    {name:'South Africa — CIPC',url:'https://www.cipc.co.za/'},
    {name:'South Africa — Department of Justice',url:'https://www.justice.gov.za/'}
  ]},
  {id:'middle-east',name:'Middle East',priority:84,focus:['bankruptcy/restructuring','court-supervised liquidation','judicial auctions'],countries:['Saudi Arabia','United Arab Emirates','Qatar','Bahrain','Kuwait','Oman','Jordan'],sourceTypes:['commercial courts','bankruptcy commissions','official gazettes','judicial auctions','liquidators'],officialSources:[
    {name:'Saudi Arabia — Bankruptcy Commission',url:'https://bankruptcy.gov.sa/'},
    {name:'UAE — Ministry of Justice',url:'https://www.moj.gov.ae/'}
  ]},
  {id:'oceania',name:'Oceania',priority:86,focus:['external administration','liquidation','receiver asset sales'],countries:['Australia','New Zealand'],sourceTypes:['corporate regulators','courts','receivers/liquidators','auction notices'],officialSources:[
    {name:'Australia — ASIC',url:'https://asic.gov.au/'},
    {name:'Australia — AFSA',url:'https://www.afsa.gov.au/'},
    {name:'New Zealand — Companies Office',url:'https://companiesoffice.govt.nz/'}
  ]}
]);

export const DISTRESSED_ASSET_SCORING=Object.freeze({
  valueOfAsset:.28,
  expectedAcquisitionPrice:.20,
  integrationEase:.16,
  revenueConversion:.24,
  evidenceStrength:.12,
  legalRisk:-.18,
  liabilityRisk:-.18,
  sanctionsExportRisk:-.14
});

const clamp=(n)=>Math.max(0,Math.min(100,Number(n)||0));

export function scoreGlobalDistressedAsset(x={}){
  const s=DISTRESSED_ASSET_SCORING;
  return clamp(Math.round(
    clamp(x.valueOfAsset)*s.valueOfAsset+
    clamp(x.expectedAcquisitionPrice)*s.expectedAcquisitionPrice+
    clamp(x.integrationEase)*s.integrationEase+
    clamp(x.revenueConversion)*s.revenueConversion+
    clamp(x.evidenceStrength)*s.evidenceStrength+
    clamp(x.legalRisk)*s.legalRisk+
    clamp(x.liabilityRisk)*s.liabilityRisk+
    clamp(x.sanctionsExportRisk)*s.sanctionsExportRisk
  ));
}

export function classifyGlobalDistressedAsset(x={}){
  const score=scoreGlobalDistressedAsset(x);
  const official=Boolean(x.officialProcessVerified);
  const title=Boolean(x.titleVerified);
  const transfer=Boolean(x.transferabilityVerified);
  const blocked=Number(x.legalRisk||0)>=70||Number(x.liabilityRisk||0)>=70||Number(x.sanctionsExportRisk||0)>=40;
  if(blocked) return {score,status:'blocked',nextAction:'do-not-bid'};
  if(official&&title&&transfer&&score>=80) return {score,status:'bid-ready',nextAction:'prepare-diligence-and-bid-model'};
  if(official&&score>=65) return {score,status:'due-diligence',nextAction:'verify-title-liens-ip-contracts-data-and-total-cost'};
  if(official) return {score,status:'verified-process',nextAction:'extract-transferable-assets-and-price-range'};
  return {score,status:'research-only',nextAction:'verify-official-insolvency-and-sale-process'};
}

export function globalDistressedMapHealth(){
  return {
    version:AION_GLOBAL_DISTRESSED_MAP_VERSION,
    status:'active',
    regions:DISTRESSED_REGIONS.length,
    verifiedLiveOpportunities:0,
    acquisitionsClosed:0,
    revenueClaims:0,
    dataPolicy:'only evidence-backed records are counted as live opportunities'
  };
}

export function globalDistressedMapStrategy(){
  return {
    version:AION_GLOBAL_DISTRESSED_MAP_VERSION,
    model:'global-distressed-asset-map',
    flow:['discover','verify-process','extract-assets','score','diligence','bid-review','acquire','integrate','monetize'],
    priorityAssets:['software','AI','IP','earth-observation','space-data','cybersecurity','enterprise-tools','industrial-digital','brand','transferable-contracts'],
    acquisitionRule:'asset-first; do not assume the insolvent entity or its liabilities by default',
    scoreFormula:'asset value × price advantage × integration ease × revenue conversion, adjusted for evidence and legal/liability/sanctions risk',
    dataRule:'official process evidence is required before a record can become a live opportunity'
  };
}
