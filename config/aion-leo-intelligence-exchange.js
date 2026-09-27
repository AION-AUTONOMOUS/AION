import crypto from 'node:crypto';
import { getJson, setJson, addToIndex, listIndexed } from './aion-stack-store.js';

export const LEO_INTELLIGENCE_EXCHANGE_VERSION='1.0.0';

const PRODUCTS=Object.freeze([
 {id:'leo-situational-awareness',name:'AION LEO Situational Awareness',priceAion:250,inputs:['orbit','space-weather','earth-observation'],output:'decision-brief'},
 {id:'leo-risk-watch',name:'AION LEO Risk Watch',priceAion:450,inputs:['orbit','space-weather'],output:'risk-score-and-evidence'},
 {id:'leo-earth-change',name:'AION LEO Earth Change Intelligence',priceAion:600,inputs:['earth-observation','orbit'],output:'change-analysis'},
 {id:'leo-network-optimization',name:'AION LEO Network Optimization',priceAion:900,inputs:['orbit','commercial-leo'],output:'provider-routing-plan'}
]);

function text(v){return String(v??'').trim();}
function id(p){return p+'-'+crypto.randomUUID();}

export function leoExchangeHealth(){
 return {version:LEO_INTELLIGENCE_EXCHANGE_VERSION,status:'product-ready',products:PRODUCTS.length,
  realInputs:true,measuredOutcomes:true,evidenceRequired:true,externalMoney:false,spacecraftControl:false,
  commercialAccess:'credentials-required'};
}

export function listLeoIntelligenceProducts(){return PRODUCTS.map(x=>({...x,currency:'AION-CREDIT',settlement:'internal-ledger-only'}));}
export function getLeoIntelligenceProduct(productId){return PRODUCTS.find(x=>x.id===text(productId))||null;}

export async function createLeoIntelligenceOrder(input={}){
 const product=getLeoIntelligenceProduct(input.productId);
 if(!product)throw new Error('unknown LEO intelligence product');
 const customer=text(input.customer);
 if(!customer)throw new Error('customer required');
 const order={id:id('AION-LEO-ORDER'),productId:product.id,customer,objective:text(input.objective),
  inputs:product.inputs,priceAion:product.priceAion,currency:'AION-CREDIT',status:'awaiting-evidence',
  evidencePolicy:'source-and-timestamp-required',createdAt:new Date().toISOString()};
 await setJson('leo-order:'+order.id,order);await addToIndex('leo-orders',order.id);return order;
}

export async function recordLeoEvidence(orderId,evidence={}){
 const order=await getJson('leo-order:'+text(orderId));
 if(!order)return null;
 const updated={...order,evidence:{sources:Array.isArray(evidence.sources)?evidence.sources.map(text).filter(Boolean):[],
  observations:Array.isArray(evidence.observations)?evidence.observations:[],recordedAt:new Date().toISOString()},
  status:'evidence-recorded'};
 await setJson('leo-order:'+order.id,updated);return updated;
}
export async function listLeoIntelligenceOrders(){return listIndexed('leo-orders');}
export async function getLeoIntelligenceOrder(orderId){return getJson('leo-order:'+text(orderId));}
