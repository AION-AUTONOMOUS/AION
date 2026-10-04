import { orbitalExchangeHealth,listProviders,createSpaceRFQ,listSpaceRFQs,getSpaceRFQ,createCommissionRecord,listCommissionRecords } from '../config/aion-orbital-exchange.js';

function json(res,status,payload){return res.status(status).json(payload);}
function token(req){return String(req.headers?.authorization||'').replace(/^Bearer\s+/i,'').trim();}
function authorized(req){
 const expected=String(process.env.AION_ORBITAL_ADMIN_TOKEN||'').trim();
 return Boolean(expected)&&token(req)===expected;
}
export default async function handler(req,res){
 const path=new URL(req.url||'/','http://aion.local').searchParams.get('path')||'health';
 try{
  if(req.method==='GET'&&path==='health')return json(res,200,{success:true,data:orbitalExchangeHealth()});
  if(req.method==='GET'&&path==='providers')return json(res,200,{success:true,data:listProviders()});
  if(req.method==='POST'&&path==='rfqs')return json(res,201,{success:true,data:await createSpaceRFQ(req.body||{})});
  if(!authorized(req))return json(res,401,{success:false,error:'orbital exchange authorization required'});
  if(req.method==='GET'&&path==='rfqs')return json(res,200,{success:true,data:await listSpaceRFQs()});
  if(req.method==='GET'&&path.startsWith('rfqs/')){
   const data=await getSpaceRFQ(path.slice(5));
   if(!data)return json(res,404,{success:false,error:'RFQ not found'});
   return json(res,200,{success:true,data});
  }
  if(req.method==='GET'&&path==='commissions')return json(res,200,{success:true,data:await listCommissionRecords()});
  if(req.method==='POST'&&path==='commissions')return json(res,201,{success:true,data:await createCommissionRecord(req.body||{})});
  return json(res,404,{success:false,error:'Unknown orbital exchange route'});
 }catch(error){return json(res,400,{success:false,error:error.message||'Orbital exchange error'});}
}
