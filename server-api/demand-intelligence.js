import { addToIndex, getJson, listIndexed, setJson, stackStorageHealth } from '../config/aion-stack-store.js';
import { classifyDemandSignal, demandCompliance, demandIntelligenceHealth, demandIntelligenceStrategy, scoreDemandSignal, routeDemandOffer } from '../config/aion-demand-intelligence.js';

function bodyOf(req){ return req.body && typeof req.body==='object' ? req.body : {}; }

function normalizeSignal(body){
  return {
    id:String(body.id||'signal-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)),
    company:String(body.company||'').trim(), domain:String(body.domain||'').trim(),
    sector:String(body.sector||'').trim(), region:String(body.region||'global').trim(),
    type:String(body.type||'').trim(), headline:String(body.headline||'').trim(),
    sourceUrl:String(body.sourceUrl||'').trim(), sourceType:String(body.sourceType||'public-business-evidence').trim(),
    detectedAt:String(body.detectedAt||new Date().toISOString()), verifiedAt:body.verifiedAt?String(body.verifiedAt):null,
    painSignal:Number(body.painSignal||0), urgencySignal:Number(body.urgencySignal||0),
    budgetSignal:Number(body.budgetSignal||0), solutionFit:Number(body.solutionFit||0),
    accessSignal:Number(body.accessSignal||0), recurringPotential:Number(body.recurringPotential||0),
    evidenceStrength:Number(body.evidenceStrength||0), complianceRisk:Number(body.complianceRisk||0),
    consent:body.consent===true, inbound:body.inbound===true, officialChannel:body.officialChannel===true,
    jurisdictionReviewed:body.jurisdictionReviewed===true, doNotContact:body.doNotContact===true,
    suppressed:body.suppressed===true, offerId:body.offerId?String(body.offerId):null
  };
}

async function saveSignal(signal){
  const record={...signal,classification:classifyDemandSignal(signal),updatedAt:new Date().toISOString()};
  await setJson('demand-signals:'+record.id,record);
  await addToIndex('demand-signals',record.id);
  return record;
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.AION_PUBLIC_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();
  const url=new URL(req.url||'/','http://aion.local');
  const path=url.searchParams.get('path')||'health';

  if(req.method==='GET'&&path==='health') return res.status(200).json({success:true,...demandIntelligenceHealth(),storage:stackStorageHealth()});
  if(req.method==='GET'&&path==='strategy') return res.status(200).json({success:true,strategy:demandIntelligenceStrategy()});
  if(req.method==='GET'&&path==='signals'){
    const sector=url.searchParams.get('sector'), minScore=Number(url.searchParams.get('minScore')||0);
    const rows=await listIndexed('demand-signals');
    const signals=rows.filter(x=>!sector||x.sector===sector).filter(x=>(x.classification?.score||0)>=minScore).sort((a,b)=>(b.classification?.score||0)-(a.classification?.score||0));
    return res.status(200).json({success:true,count:signals.length,signals});
  }
  if(req.method==='GET'&&path==='signal'){
    const id=url.searchParams.get('id'); if(!id) return res.status(400).json({success:false,error:'id required'});
    const signal=await getJson('demand-signals:'+id); if(!signal) return res.status(404).json({success:false,error:'signal not found'});
    return res.status(200).json({success:true,signal});
  }
  if(req.method==='POST'&&path==='score'){
    const body=bodyOf(req); if(!body.company||!body.type) return res.status(400).json({success:false,error:'company and type required'});
    const signal=normalizeSignal(body);
    return res.status(200).json({success:true,classification:classifyDemandSignal(signal),compliance:demandCompliance(signal),recommendedOffer:routeDemandOffer(signal),score:scoreDemandSignal(signal)});
  }
  if(req.method==='POST'&&path==='ingest'){
    const body=bodyOf(req);
    if(!body.company||!body.type||!body.headline||!body.sourceUrl) return res.status(400).json({success:false,error:'company, type, headline and sourceUrl required'});
    const signal=normalizeSignal(body);
    if(!(signal.sourceUrl.startsWith('http://')||signal.sourceUrl.startsWith('https://'))) return res.status(400).json({success:false,error:'sourceUrl must be http(s)'});
    if(signal.doNotContact||signal.suppressed) signal.suppressed=true;
    const saved=await saveSignal(signal);
    return res.status(201).json({success:true,signal:saved});
  }
  return res.status(404).json({success:false,error:'Unknown path'});
}
