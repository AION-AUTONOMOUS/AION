export const AION_DISTRESSED_ASSET_INTELLIGENCE_VERSION='1.0.0';

export const DISTRESSED_ASSET_TYPES=Object.freeze([
  'company','business-unit','ip-portfolio','software-platform','customer-book',
  'brand','patents-trademarks','data-assets','equipment','manufacturing-line',
  'real-estate','licenses','contracts'
]);

export const DISTRESSED_STAGES=Object.freeze([
  'watch','distress-verified','asset-opportunity','due-diligence','bid-ready',
  'offer-submitted','acquired','integrated','monetized','rejected','blocked'
]);

const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));

export function scoreDistressedOpportunity(x={}){
  const strategicFit=clamp(x.strategicFit), revenuePotential=clamp(x.revenuePotential);
  const assetQuality=clamp(x.assetQuality), priceAdvantage=clamp(x.priceAdvantage);
  const integrationEase=clamp(x.integrationEase), evidence=clamp(x.evidenceStrength);
  const legalRisk=clamp(x.legalRisk), liabilityRisk=clamp(x.liabilityRisk);
  return clamp(Math.round(
    strategicFit*.22+revenuePotential*.22+assetQuality*.18+
    priceAdvantage*.14+integrationEase*.10+evidence*.14-
    legalRisk*.20-liabilityRisk*.12
  ));
}

export function valueThesis(x={}){
  const assets=Array.isArray(x.assets)?x.assets:[];
  const highValue=assets.filter(a=>['ip-portfolio','software-platform','customer-book','brand','patents-trademarks','data-assets','contracts'].includes(a.type));
  return {
    preserve:highValue.map(a=>a.name||a.type),
    likelyAionUses:[
      'reuse technology inside AION products',
      'turn verified customer demand into new paid services',
      'reuse non-restricted IP and know-how where legally transferable',
      'cross-sell compatible customer relationships only where lawful and consent/contract permits',
      'retire non-core liabilities instead of assuming them'
    ],
    rule:'prefer asset deals over assuming the insolvent entity unless legal and economic diligence supports the entity itself'
  };
}

export function distressedCompliance(x={}){
  const insolvencyEvidence=x.insolvencyEvidence===true;
  const administratorVerified=x.administratorVerified===true;
  const auctionOrProcessVerified=x.auctionOrProcessVerified===true;
  const sanctionsCleared=x.sanctionsCleared===true;
  const exportCleared=x.exportCleared!==false;
  const privacyCleared=x.privacyCleared===true;
  if(!insolvencyEvidence) return {status:'research-only',eligible:false,reason:'insolvency-not-verified'};
  if(!administratorVerified && !auctionOrProcessVerified) return {status:'diligence-required',eligible:false,reason:'official-process-not-verified'};
  if(!sanctionsCleared || !exportCleared) return {status:'blocked',eligible:false,reason:'sanctions-or-export-review'};
  if(!privacyCleared && x.includesPersonalData===true) return {status:'blocked',eligible:false,reason:'personal-data-transfer-unverified'};
  return {status:'bid-review',eligible:true,reason:'process-evidence-present'};
}

export function classifyDistressedOpportunity(x={}){
  const score=scoreDistressedOpportunity(x);
  const compliance=distressedCompliance(x);
  const thesis=valueThesis(x);
  let stage='watch', nextAction='continue-monitoring';
  if(compliance.status==='blocked') { stage='blocked'; nextAction='do-not-bid'; }
  else if(compliance.eligible && score>=80) { stage='bid-ready'; nextAction='prepare-due-diligence-and-bid-model'; }
  else if(compliance.eligible) { stage='due-diligence'; nextAction='request-dossier-and-value-assets'; }
  else if(x.insolvencyEvidence===true) { stage='distress-verified'; nextAction='verify-official-sale-process'; }
  return {version:AION_DISTRESSED_ASSET_INTELLIGENCE_VERSION,score,stage,nextAction,compliance,thesis};
}

export function distressedStrategy(){
  return {
    version:AION_DISTRESSED_ASSET_INTELLIGENCE_VERSION,
    model:'asset-first-distressed-opportunity-intelligence',
    priority:'acquire-useful-assets-and-capabilities-not-debt-by-default',
    targets:['software','AI','earth-observation','space-data','cybersecurity','enterprise-tools','industrial-digital','IP-rich businesses'],
    sources:['official insolvency administrators','court/official gazettes','official auction houses','public sale notices','verified company filings'],
    rules:[
      'never claim AION owns a company or asset before legally completed closing',
      'prefer asset purchases when they reduce inherited liabilities',
      'verify title, IP ownership, liens, licenses, contracts, privacy rights and employee obligations',
      'do not acquire restricted, stolen, encumbered or unlawfully transferable data',
      'respect sanctions, export controls, competition law and sector regulation',
      'model total cost including integration and liabilities before bidding',
      'require external legal and financial diligence before binding acquisition',
      'do not use distressed status to exploit individuals or evade creditor rights',
      'recognize acquisition and resulting revenue only after verified closing and payment evidence'
    ]
  };
}

export function distressedHealth(){
  return {version:AION_DISTRESSED_ASSET_INTELLIGENCE_VERSION,status:'active',mode:'research-and-diligence',acquisitionsClosed:0,revenueClaimsFromAcquisitions:0};
}
