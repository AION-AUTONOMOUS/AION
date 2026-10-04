import { growthEngineDashboard } from '../config/aion-growth-engine.js';
function json(res,status,payload){return res.status(status).json(payload);}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.AION_PUBLIC_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='GET')return json(res,405,{success:false,error:'Method not allowed'});
  try{
    const path=new URL(req.url||'/','http://aion.local').searchParams.get('path')||'dashboard';
    if(path==='dashboard')return json(res,200,{success:true,data:await growthEngineDashboard()});
    return json(res,404,{success:false,error:'Unknown Growth route'});
  }catch(error){return json(res,500,{success:false,error:error.message||'Growth engine error'});}
}
