import {addToIndex,getJson,listIndexed,setJson,stackStorageHealth} from '../config/aion-stack-store.js';
import {classifyDistressedOpportunity,distressedHealth,distressedStrategy} from '../config/aion-distressed-assets.js';

function body(req){return req.body&&typeof req.body==='object'?req.body:{};}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.AION_PUBLIC_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  const url=new URL(req.url||'/','http://aion.local'), path=url.searchParams.get('path')||'health';
  if(req.method==='GET'&&path==='health')return res.status(200).json({success:true,...distressedHealth(),storage:stackStorageHealth()});
  if(req.method==='GET'&&path==='strategy')return res.status(200).json({success:true,strategy:distressedStrategy()});
  if(req.method==='GET'&&path==='opportunities'){
    const min=Number(url.searchParams.get('minScore')||0);
    const rows=await listIndexed('distressed-opportunities');
    return res.status(200).json({success:true,count:rows.length,opportunities:rows.filter(x=>(x.classification?.score||0)>=min).sort((a,b)=>(b.classification?.score||0)-(a.classification?.score||0))});
  }
  if(req.method==='POST'&&path==='score'){
    const x=body(req); if(!x.name||!x.insolvencyEvidence)return res.status(400).json({success:false,error:'name and insolvencyEvidence required'});
    return res.status(200).json({success:true,classification:classifyDistressedOpportunity(x)});
  }
  if(req.method==='POST'&&path==='ingest'){
    const auth=String(req.headers?.authorization||'');
    if(!process.env.AION_MESH_TOKEN||auth!=='Bearer '+process.env.AION_MESH_TOKEN)return res.status(401).json({success:false,error:'authenticated internal ingest required'});
    const x=body(req); if(!x.name||!x.sourceUrl||!x.insolvencyEvidence)return res.status(400).json({success:false,error:'name, sourceUrl and insolvencyEvidence required'});
    const record={...x,id:String(x.id||'distressed-'+Date.now()),classification:classifyDistressedOpportunity(x),updatedAt:new Date().toISOString()};
    await setJson('distressed-opportunity:'+record.id,record); await addToIndex('distressed-opportunities',record.id);
    return res.status(201).json({success:true,opportunity:record});
  }
  if(req.method==='GET'&&path==='opportunity'){
    const id=url.searchParams.get('id'); if(!id)return res.status(400).json({success:false,error:'id required'});
    const x=await getJson('distressed-opportunity:'+id); if(!x)return res.status(404).json({success:false,error:'opportunity not found'});
    return res.status(200).json({success:true,opportunity:x});
  }
  return res.status(404).json({success:false,error:'Unknown path'});
}
