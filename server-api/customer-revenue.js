import { customerRevenueHealth, listOffers, getOffer, createCustomerOrder, confirmCustomerPayment, recordDelivery, recordOutcome, listCustomerOrders, listRevenue } from '../config/aion-customer-revenue.js';
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.AION_PUBLIC_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();
  const url=new URL(req.url||'/','http://aion.local'), path=url.searchParams.get('path')||'health';
  const body=async()=>req.body&&typeof req.body==='object'?req.body:new Promise((resolve,reject)=>{let r='';req.on('data',c=>r+=c);req.on('end',()=>{try{resolve(r?JSON.parse(r):{})}catch(e){reject(e)}});req.on('error',reject)});
  try{
    if(req.method==='GET'&&path==='health')return res.status(200).json({success:true,...customerRevenueHealth()});
    if(req.method==='GET'&&path==='offers')return res.status(200).json({success:true,offers:listOffers()});
    if(req.method==='GET'&&path==='orders')return res.status(200).json({success:true,orders:await listCustomerOrders()});
    if(req.method==='GET'&&path==='revenue')return res.status(200).json({success:true,revenue:await listRevenue()});
    if(req.method==='POST'&&path==='order')return res.status(201).json({success:true,order:await createCustomerOrder(await body())});
    if(req.method==='POST'&&path==='payment'){const b=await body(); if(String(b.paymentProvider||'').toLowerCase()!=='paypal'||String(b.verificationStatus||'').toUpperCase()!=='SUCCESS'||!b.providerEventId) return res.status(400).json({success:false,error:'verified PayPal payment evidence required'}); return res.status(200).json({success:true,order:await confirmCustomerPayment(b.orderId,b)})}
    if(req.method==='POST'&&path==='delivery'){const b=await body();return res.status(200).json({success:true,order:await recordDelivery(b.orderId,b)})}
    if(req.method==='POST'&&path==='outcome'){const b=await body();return res.status(200).json({success:true,outcome:await recordOutcome(b.orderId,b)})}
    if(req.method==='GET'&&path==='offer')return res.status(200).json({success:true,offer:getOffer(url.searchParams.get('id'))});
    return res.status(405).json({success:false,error:'Method not allowed'});
  }catch(error){return res.status(400).json({success:false,error:String(error?.message||error)})}
}