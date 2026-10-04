import { meshHealth, meshStatus, registerNode, heartbeatNode, logicalAgent, shardPlan } from '../config/aion-agent-mesh.js';

const TOKEN=()=>String(process.env.AION_MESH_TOKEN||'').trim();
function authorized(req){
  const configured=TOKEN();
  const supplied=String(req.headers.authorization||'').replace(/^Bearer\\s+/i,'').trim();
  return Boolean(configured&&supplied&&supplied===configured);
}
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  try{
    if(req.method==='GET'){
      if(req.query?.agent!=null) return res.status(200).json({success:true,agent:logicalAgent(req.query.agent)});
      if(req.query?.plan==='1') return res.status(200).json({success:true,plan:shardPlan()});
      return res.status(200).json({success:true,mesh:await meshStatus()});
    }
    if(req.method==='POST'){
      if(!authorized(req)) return res.status(401).json({success:false,error:'mesh_authorization_required'});
      const body=req.body||{};
      if(body.action==='heartbeat') return res.status(200).json({success:true,node:await heartbeatNode(body)});
      if(body.action==='register') return res.status(201).json({success:true,node:await registerNode(body)});
      return res.status(400).json({success:false,error:'unknown_mesh_action'});
    }
    return res.status(405).json({success:false,error:'method_not_allowed'});
  }catch(error){
    return res.status(400).json({success:false,error:String(error?.message||error)});
  }
}
