import crypto from 'node:crypto';
import { addToIndex, getJson, listIndexed, setJson } from './aion-stack-store.js';

export const CUSTOMER_REVENUE_VERSION = '1.0.0';

const OFFERS = Object.freeze([
  { id:'earth-change-intelligence', name:'AION Earth Change Intelligence', priceUsd:250, delivery:'verified-analysis', evidence:'Copernicus Sentinel-2' },
  { id:'space-weather-brief', name:'AION Space Weather Risk Brief', priceUsd:180, delivery:'verified-report', evidence:'NOAA SWPC' },
  { id:'leo-situational-awareness', name:'AION LEO Situational Awareness', priceUsd:250, delivery:'verified-intelligence', evidence:'CelesTrak + operational space data' },
  { id:'disaster-intelligence', name:'AION Rapid Disaster Intelligence', priceUsd:350, delivery:'incident-brief', evidence:'Copernicus + NASA GIBS' },
  { id:'article-500', name:'مقال 500 كلمة', priceUsd:5, delivery:'digital-content', evidence:'AION AI' },
  { id:'article-1000', name:'مقال 1000 كلمة', priceUsd:10, delivery:'digital-content', evidence:'AION AI' },
  { id:'social-5', name:'5 منشورات سوشيال', priceUsd:5, delivery:'digital-content', evidence:'AION AI' },
  { id:'translation-500', name:'ترجمة 500 كلمة', priceUsd:5, delivery:'digital-content', evidence:'AION AI' },
  { id:'market-analysis', name:'تحليل سوق', priceUsd:30, delivery:'digital-analysis', evidence:'AION AI' },
  { id:'competitor-analysis', name:'تحليل منافسين', priceUsd:20, delivery:'digital-analysis', evidence:'AION AI' },
  { id:'business-plan', name:'Business Plan', priceUsd:50, delivery:'digital-document', evidence:'AION AI' },
  { id:'professional-cv', name:'CV احترافي', priceUsd:10, delivery:'digital-document', evidence:'AION AI' },
  { id:'python-script', name:'سكريبت Python', priceUsd:15, delivery:'digital-code', evidence:'AION AI' },
  { id:'company-analysis', name:'تحليل شركة', priceUsd:15, delivery:'digital-analysis', evidence:'AION AI' },
  { id:'pitch-deck', name:'Pitch Deck', priceUsd:60, delivery:'digital-document', evidence:'AION AI' },
  { id:'feasibility-study', name:'دراسة جدوى', priceUsd:30, delivery:'digital-analysis', evidence:'AION AI' },
  { id:'satellite-data', name:'تحليل بيانات الأقمار الصناعية', priceUsd:35, delivery:'space-analysis', evidence:'Copernicus/NASA' },
  { id:'space-reports', name:'تقارير قطاع الفضاء', priceUsd:25, delivery:'space-report', evidence:'AION Space' },
  { id:'space-consulting', name:'استشارات فضائية', priceUsd:40, delivery:'space-consulting', evidence:'AION Space' },
  { id:'satellite-monitoring', name:'مراقبة الأقمار الصناعية', priceUsd:99, delivery:'space-monitoring', evidence:'AION Space' },
  { id:'remote-sensing', name:'تحليل الاستشعار عن بعد', priceUsd:30, delivery:'space-analysis', evidence:'Copernicus/NASA' },
  { id:'launch-planning', name:'خطط إطلاق الأقمار', priceUsd:150, delivery:'space-planning', evidence:'AION Space' }
]);

function text(v){return String(v??'').trim();}
function id(prefix){return prefix+'-'+crypto.randomUUID();}

export function customerRevenueHealth(){
  return {
    version:CUSTOMER_REVENUE_VERSION,
    status:'customer-ready',
    offers:OFFERS.length,
    realDataBacked:true,
    revenueRecognition:'payment-confirmed-only',
    deliveryEvidenceRequired:true,
    roiMeasurement:true,
    externalMoney:'provider-gated',
    noFakeRevenue:true
  };
}
export function listOffers(){return OFFERS.map(o=>({...o,currency:'USD',paymentProvider:'PayPal',status:'available'}));}
export function getOffer(offerId){return OFFERS.find(o=>o.id===text(offerId))||null;}

export async function createCustomerOrder(input={}){
  const offer=getOffer(input.offerId);
  const customerId=text(input.customerId);
  if(!offer)throw new Error('unknown offer');
  if(!customerId)throw new Error('customerId required');
  const order={id:id('AION-ORDER'),offerId:offer.id,customerId,amountUsd:offer.priceUsd,currency:'USD',paymentProvider:'PayPal',status:'awaiting-payment',paymentStatus:'unpaid',deliveryStatus:'not-started',revenueRecognized:false,createdAt:new Date().toISOString()};
  await setJson('customer-orders:'+order.id,order); await addToIndex('customer-orders',order.id);
  return order;
}
export async function confirmCustomerPayment(orderId,input={}){
  const order=await getJson('customer-orders:'+text(orderId));
  if(!order) return null;
  const provider=text(input.paymentProvider).toLowerCase();
  const verification=text(input.verificationStatus).toUpperCase();
  const providerEventId=text(input.providerEventId);
  const paymentReference=text(input.paymentReference);
  if(provider!=='paypal') throw new Error('revenue confirmation requires an authorized payment provider');
  if(verification!=='SUCCESS') throw new Error('payment provider verification required');
  if(!providerEventId||!paymentReference) throw new Error('providerEventId and paymentReference required');
  if(order.paymentStatus==='confirmed') return order;
  const updated={...order,status:'paid',paymentStatus:'confirmed',paymentProvider:provider,providerEventId,paymentReference,revenueRecognized:true,paidAt:new Date().toISOString(),verifiedAt:new Date().toISOString()};
  await setJson('customer-orders:'+order.id,updated);
  const revenue={id:id('AION-REV'),orderId:order.id,customerId:order.customerId,amountUsd:order.amountUsd,currency:order.currency,paymentReference:updated.paymentReference,recognizedAt:updated.paidAt,source:'confirmed-payment'};
  await setJson('customer-revenue:'+revenue.id,revenue); await addToIndex('customer-revenue',revenue.id);
  return updated;
}
export async function recordDelivery(orderId,input={}){
  const order=await getJson('customer-orders:'+text(orderId));
  if(!order) return null;
  if(order.paymentStatus!=='confirmed') throw new Error('delivery blocked until payment is confirmed');
  const evidence=text(input.evidence);
  if(!evidence) throw new Error('delivery evidence required');
  const updated={...order,status:'delivered',deliveryStatus:'delivered',deliveryEvidence:evidence,deliveredAt:new Date().toISOString()};
  await setJson('customer-orders:'+order.id,updated);
  return updated;
}
export async function recordOutcome(orderId,input={}){
  const order=await getJson('customer-orders:'+text(orderId));
  if(!order) return null;
  const baseline=Number(input.baselineValue);
  const result=Number(input.resultValue);
  if(!Number.isFinite(baseline)||!Number.isFinite(result)) throw new Error('baselineValue and resultValue required');
  const roi={orderId:order.id,baselineValue:baseline,resultValue:result,delta:result-baseline,roiRatio:baseline===0?null:(result-baseline)/Math.abs(baseline),recordedAt:new Date().toISOString()};
  await setJson('customer-outcome:'+order.id,roi); await addToIndex('customer-outcomes',order.id);
  return roi;
}
export async function listCustomerOrders(){return listIndexed('customer-orders');}
export async function listRevenue(){return listIndexed('customer-revenue');}
