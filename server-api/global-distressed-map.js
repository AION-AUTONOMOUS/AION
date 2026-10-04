import {addToIndex,getJson,listIndexed,setJson,stackStorageHealth} from '../config/aion-stack-store.js';
import {classifyGlobalDistressedAsset,DISTRESSED_REGIONS,globalDistressedMapHealth,globalDistressedMapStrategy,scoreGlobalDistressedAsset} from '../config/aion-global-distressed-map.js';

const body=req=>req.body&&typeof req.body==='object'?req.body:{};

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.AION_PUBLIC_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  if(req.method==='OPTIONS')return res.status(204).end();
  const url=new URL(req.url||'/','http://aion.local');
  const path=url.searchParams.get('path')||'health';

  if(req.method==='GET'&&path==='health')
    return res.status(200).json({success:true,...globalDistressedMapHealth(),storage:stackStorageHealth()});

  if(req.method==='GET'&&path==='strategy')
    return res.status(200).json({success:true,strategy:globalDistressedMapStrategy()});

  if(req.method==='GET'&&path==='regions')
    return res.status(200).json({success:true,count:DISTRESSED_REGIONS.length,regions:DISTRESSED_REGIONS});

  if(req.method==='GET'&&path==='opportunities'){
    const min=Number(url.searchParams.get('minScore')||0);
    const region=url.searchParams.get('region');
    const rows=await listIndexed('global-distressed-opportunities');
    const opportunities=rows
      .filter(x=>(x.classification?.score||0)>=min)
      .filter(x=>!region||x.region===region)
      .sort((a,b)=>(b.classification?.score||0)-(a.classification?.score||0));
    return res.status(200).json({success:true,count:opportunities.length,opportunities});
  }

  if(req.method==='POST'&&path==='score'){
    const x=body(req);
    return res.status(200).json({success:true,classification:classifyGlobalDistressedAsset(x)});
  }

  if(req.method==='POST'&&path==='ingest'){
    const auth=String(req.headers?.authorization||'');
    if(!process.env.AION_MESH_TOKEN||auth!=='Bearer '+process.env.AION_MESH_TOKEN)
      return res.status(401).json({success:false,error:'authenticated internal ingest required'});
    const x=body(req);
    if(!x.name||!x.region||!x.sourceUrl||!x.officialProcessVerified)
      return res.status(400).json({success:false,error:'name, region, sourceUrl and officialProcessVerified required'});
    const record={...x,id:String(x.id||'global-distressed-'+Date.now()),classification:classifyGlobalDistressedAsset(x),updatedAt:new Date().toISOString()};
    await setJson('global-distressed-opportunity:'+record.id,record);
    await addToIndex('global-distressed-opportunities',record.id);
    return res.status(201).json({success:true,opportunity:record});
  }

  if(req.method==='GET'&&path==='opportunity'){
    const id=url.searchParams.get('id');
    if(!id)return res.status(400).json({success:false,error:'id required'});
    const x=await getJson('global-distressed-opportunity:'+id);
    if(!x)return res.status(404).json({success:false,error:'opportunity not found'});
    return res.status(200).json({success:true,opportunity:x});
  }

  return res.status(404).json({success:false,error:'Unknown path'});
}
