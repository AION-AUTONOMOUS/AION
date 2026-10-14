import { customerRevenueHealth, listOffers, getOffer, createCustomerOrder, confirmCustomerPayment, recordDelivery, recordOutcome, listCustomerOrders, listRevenue } from '../config/aion-customer-revenue.js';
import { revenueEngineHealth, revenueStrategy, revenueDashboard } from '../config/aion-revenue-engine.js';
import { createPayPalOrder, capturePayPalOrder, paypalHealth } from '../config/aion-paypal.js';
import { setJson } from '../config/aion-stack-store.js';

function isRevenueAdmin(req) {
  const expected = String(process.env.AION_REVENUE_ADMIN_TOKEN || '');
  const supplied = String(req.headers?.authorization || '');
  return Boolean(expected) && supplied === `Bearer ${expected}`;
}

function requireRevenueAdmin(req, res) {
  if (isRevenueAdmin(req)) return true;
  res.status(401).json({ success: false, error: 'admin authorization required' });
  return false;
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.AION_PUBLIC_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  if(req.method==='OPTIONS') return res.status(204).end();
  const url=new URL(req.url||'/','http://aion.local'), path=url.searchParams.get('path')||'health';
  const body=async()=>req.body&&typeof req.body==='object'?req.body:new Promise((resolve,reject)=>{let r='';req.on('data',c=>r+=c);req.on('end',()=>{try{resolve(r?JSON.parse(r):{})}catch(e){reject(e)}});req.on('error',reject)});
  try{
    if(req.method==='GET'&&path==='health') return res.status(200).json({success:true,...customerRevenueHealth(),revenueEngine:revenueEngineHealth(),paypal:paypalHealth()});
    if(req.method==='GET'&&path==='strategy') return res.status(200).json({success:true,...revenueStrategy()});
    if(req.method==='GET'&&path==='dashboard'){
      if(!requireRevenueAdmin(req,res)) return;
      return res.status(200).json({success:true,...await revenueDashboard()});
    }
    if(req.method==='GET'&&path==='offers') return res.status(200).json({success:true,offers:listOffers()});
    if(req.method==='GET'&&path==='orders'){
      if(!requireRevenueAdmin(req,res)) return;
      return res.status(200).json({success:true,orders:await listCustomerOrders()});
    }
    if(req.method==='GET'&&path==='revenue'){
      if(!requireRevenueAdmin(req,res)) return;
      return res.status(200).json({success:true,revenue:await listRevenue()});
    }
    if(req.method==='GET'&&path==='offer') return res.status(200).json({success:true,offer:getOffer(url.searchParams.get('id'))});
    if(req.method==='POST'&&path==='order') return res.status(201).json({success:true,order:await createCustomerOrder(await body())});
    if(req.method==='POST'&&path==='checkout'){
      const b=await body(), offer=getOffer(b.offerId), customerId=String(b.customerId||'').trim();
      if(!offer) return res.status(400).json({success:false,error:'unknown offer'});
      if(!customerId) return res.status(400).json({success:false,error:'customerId required'});
      const origin=String(process.env.AION_PUBLIC_ORIGIN||'').replace(/\/$/,'');
      if(!origin) return res.status(500).json({success:false,error:'AION_PUBLIC_ORIGIN is not configured'});
      const order=await createCustomerOrder({offerId:offer.id,customerId});
      const payment=await createPayPalOrder({orderId:order.id,offer,returnUrl:origin+'/payment-success.html?orderId='+encodeURIComponent(order.id),cancelUrl:origin+'/payment-cancelled.html?orderId='+encodeURIComponent(order.id)});
      const updated={...order,paypalOrderId:payment.id,paymentApprovalUrl:payment.approvalUrl};
      await setJson('customer-orders:'+order.id,updated);
      return res.status(201).json({success:true,order:updated,payment});
    }
    if(req.method==='POST'&&path==='capture'){
      const b=await body(), orderId=String(b.orderId||'').trim(), orders=await listCustomerOrders(), order=orders.find(x=>x.id===orderId);
      if(!order) return res.status(404).json({success:false,error:'order not found'});
      if(order.paymentStatus==='confirmed') return res.status(200).json({success:true,order});
      if(!order.paypalOrderId) return res.status(400).json({success:false,error:'PayPal order is missing'});
      const payment=await capturePayPalOrder({paypalOrderId:order.paypalOrderId,expectedOrderId:order.id,expectedAmountUsd:order.amountUsd});
      const updated=await confirmCustomerPayment(order.id,{paymentProvider:'paypal',verificationStatus:'SUCCESS',providerEventId:payment.orderId,paymentReference:payment.captureId});
      return res.status(200).json({success:true,order:updated,payment});
    }
    // Do not accept caller-supplied "SUCCESS" as payment evidence. Only the server-side
    // PayPal capture path above may confirm payment after provider-side verification.
    if(req.method==='POST'&&path==='payment') return res.status(410).json({success:false,error:'direct payment confirmation is disabled; use verified PayPal capture'});
    if(req.method==='POST'&&path==='delivery'){
      if(!requireRevenueAdmin(req,res)) return;
      const b=await body();return res.status(200).json({success:true,order:await recordDelivery(b.orderId,b)});
    }
    if(req.method==='POST'&&path==='outcome'){
      if(!requireRevenueAdmin(req,res)) return;
      const b=await body();return res.status(200).json({success:true,outcome:await recordOutcome(b.orderId,b)});
    }
    return res.status(405).json({success:false,error:'Method not allowed'});
  }catch(error){return res.status(400).json({success:false,error:String(error?.message||error)})}
}
