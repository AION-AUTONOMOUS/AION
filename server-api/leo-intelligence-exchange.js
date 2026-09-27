import {leoExchangeHealth,listLeoIntelligenceProducts,getLeoIntelligenceProduct,createLeoIntelligenceOrder,recordLeoEvidence,listLeoIntelligenceOrders,getLeoIntelligenceOrder} from '../config/aion-leo-intelligence-exchange.js';
function json(res,status,payload){return res.status(status).json(payload);}
export default async function handler(req,res){
 const url=new URL(req.url||'/','http://aion.local'); const path=url.searchParams.get('path')||'';
 try{
  if(req.method==='GET'&&path==='health')return json(res,200,{success:true,data:leoExchangeHealth()});
  if(req.method==='GET'&&path==='products')return json(res,200,{success:true,data:listLeoIntelligenceProducts()});
  if(req.method==='GET'&&path.startsWith('products/'))return json(res,200,{success:true,data:getLeoIntelligenceProduct(path.slice(9))});
  if(req.method==='GET'&&path==='orders')return json(res,200,{success:true,data:await listLeoIntelligenceOrders()});
  if(req.method==='GET'&&path.startsWith('orders/'))return json(res,200,{success:true,data:await getLeoIntelligenceOrder(path.slice(7))});
  if(req.method==='POST'&&path==='orders')return json(res,201,{success:true,data:await createLeoIntelligenceOrder(req.body||{})});
  if(req.method==='POST'&&path.startsWith('orders/')&&path.endsWith('/evidence'))return json(res,200,{success:true,data:await recordLeoEvidence(path.slice(7,-9),req.body||{})});
  return json(res,404,{success:false,error:'Unknown LEO exchange route'});
 }catch(error){console.error('AION LEO exchange:',error);return json(res,400,{success:false,error:error.message||'LEO exchange error'});}
}