import {discoverLeoAssets,getLeoSpaceWeather,discoverEarthObservation,leoOrchestratorHealth,listLeoProviders,routeLeoJob,listLeoRoutes,getLeoRoute} from '../config/aion-leo-orchestrator.js';

function json(res,status,payload){return res.status(status).json(payload);}
export default async function handler(req,res){
 const url=new URL(req.url||'/','http://aion.local');
 const path=url.searchParams.get('path')||'';
 try{
  if(req.method==='GET'&&path==='health') return json(res,200,{success:true,data:leoOrchestratorHealth()});
  if(req.method==='GET'&&path==='providers') return json(res,200,{success:true,data:listLeoProviders()});
  if(req.method==='GET'&&path==='assets') return json(res,200,{success:true,data:await discoverLeoAssets({group:url.searchParams.get('group')||'active',max:url.searchParams.get('max')})});
  if(req.method==='GET'&&path==='space-weather') return json(res,200,{success:true,data:await getLeoSpaceWeather()});
  if(req.method==='GET'&&path==='earth-observation') return json(res,200,{success:true,data:await discoverEarthObservation({limit:url.searchParams.get('limit'),datetime:url.searchParams.get('datetime')})});
  if(req.method==='GET'&&path==='routes') return json(res,200,{success:true,data:await listLeoRoutes()});
  if(req.method==='GET'&&path.startsWith('routes/')) return json(res,200,{success:true,data:await getLeoRoute(path.slice(7))});
  if(req.method==='POST'&&path==='route') return json(res,201,{success:true,data:await routeLeoJob(req.body||{})});
  return json(res,404,{success:false,error:'Unknown LEO route'});
 }catch(error){console.error('AION LEO orchestrator:',error);return json(res,502,{success:false,error:error.message||'LEO provider error'});}
}
