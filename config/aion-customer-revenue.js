import crypto from 'node:crypto';
import { addToIndex, getJson, listIndexed, setJson } from './aion-stack-store.js';

export const CUSTOMER_REVENUE_VERSION = '1.0.0';

const OFFERS = Object.freeze([
  { id:'earth-change-intelligence', name:'AION Earth Change Intelligence', priceAion:250, delivery:'verified-analysis', evidence:'Copernicus Sentinel-2' },
  { id:'space-weather-brief', name:'AION Space Weather Risk Brief', priceAion:180, delivery:'verified-report', evidence:'NOAA SWPC' },
  { id:'leo-situational-awareness', name:'AION LEO Situational Awareness', priceAion:250, delivery:'verified-intelligence', evidence:'CelesTrak + operational space data' },
  { id:'disaster-intelligence', name:'AION Rapid Disaster Intelligence', priceAion:350, delivery:'incident-brief', evidence:'Copernicus + NASA GIBS' }
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
export function listOffers(){return OFFERS.map(o=>({...o,currency:'AION-CREDIT',status:'available'}));}
export function getOffer(offerId){return OFFERS.find(o=>o.id===text(offerId))||null;}

export async function createCustomerOrder(input={}){
  const offer=getOffer(input.offerId);
  const customerId=text(input.customerId);
  if(!offer)throw new Error('unknown offer');
  if(!customerId)throw new Error('customerId required');
  const order={id:id('AION-ORDER'),offerId:offer.id,customerId,amountAion:offer.priceAion,currency:'AION-CREDIT',status:'awaiting-payment',paymentStatus:'unpaid',deliveryStatus:'not-started',revenueRecognized:false,createdAt:new Date().toISOString()};
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
  const providerAmount=Number(input.providerAmount);
  const providerCurrency=text(input.providerCurrency).toUpperCase();
  if(provider!=='paypal') throw new Error('revenue confirmation requires an authorized payment provider');
  if(verification!=='SUCCESS') throw new Error('payment provider verification required');
  if(!providerEventId||!paymentReference) throw new Error('providerEventId and paymentReference required');
  if(!Number.isFinite(providerAmount)||providerAmount<=0) throw new Error('verified provider amount required');
  if(providerCurrency && providerCurrency!=='USD') throw new Error('unexpected provider currency');
  if(Math.abs(providerAmount-Number(order.amountAion))>0.01) throw new Error('provider amount does not match order amount');
  if(order.paymentStatus==='confirmed') return order;
  const updated={...order,status:'paid',paymentStatus:'confirmed',paymentProvider:provider,providerEventId,paymentReference,revenueRecognized:true,paidAt:new Date().toISOString(),verifiedAt:new Date().toISOString()};
  await setJson('customer-orders:'+order.id,updated);
  const revenue={id:id('AION-REV'),orderId:order.id,customerId:order.customerId,amountAion:order.amountAion,currency:order.currency,paymentReference:updated.paymentReference,recognizedAt:updated.paidAt,source:'confirmed-payment'};
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
