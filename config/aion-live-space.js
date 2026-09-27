import crypto from 'node:crypto';
import { getJson, setJson, addToIndex, listIndexed } from './aion-stack-store.js';

export const LIVE_SPACE_VERSION='1.0.0';

const SERVICES=Object.freeze([
 {id:'eo-discovery',name:'AION Earth Observation Intelligence',priceAion:120,provider:'Copernicus Data Space + NASA GIBS',source:'live-public-data',unit:'analysis'},
 {id:'eo-change',name:'AION Change Detection',priceAion:250,provider:'Copernicus Data Space',source:'live-public-data',unit:'analysis'},
 {id:'space-weather',name:'AION Space Weather Intelligence',priceAion:180,provider:'NOAA SWPC',source:'live-operational-data',unit:'report'},
 {id:'disaster-intelligence',name:'AION Rapid Disaster Intelligence',priceAion:350,provider:'Copernicus + NASA GIBS',source:'live-public-data',unit:'incident'},
 {id:'mars-intelligence',name:'AION Mars Mission Intelligence',priceAion:750,provider:'authorized mission/provider data',source:'provider-data-required',unit:'mission-analysis'},
 {id:'commercial-satellite-intelligence',name:'AION Commercial Satellite Intelligence',priceAion:500,provider:'authorized commercial vendor',source:'commercial-data-pass-through',unit:'analysis'}
]);

function text(v){return String(v??'').trim();}
function id(p){return p+'-'+crypto.randomUUID();}

export function liveSpaceHealth(){
 return {version:LIVE_SPACE_VERSION,status:'live-service',services:SERVICES.length,realProviders:true,externalMoney:false,mainnet:false,commercialData:'authorized-vendor-credentials-required'};
}
export function listLiveSpaceServices(){return SERVICES.map(x=>({...x,currency:'AION-CREDIT',settlement:'AION-company-wallet-ledger'}));}
export function getLiveSpaceService(serviceId){return SERVICES.find(x=>x.id===text(serviceId))||null;}

async function fetchJson(url){
 const response=await fetch(url,{headers:{accept:'application/json'}});
 if(!response.ok)throw new Error('provider request failed: '+response.status);
 return response.json();
}

export async function queryLiveSpaceService(input={}){
 const service=getLiveSpaceService(input.serviceId);
 if(!service)throw new Error('unknown live space service');
 if(service.id==='space-weather'){
   const data=await fetchJson('https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json');
   return {serviceId:service.id,provider:'NOAA SWPC',retrievedAt:new Date().toISOString(),data};
 }
 if(service.id==='eo-discovery'||service.id==='eo-change'||service.id==='disaster-intelligence'){
   const body={collections:['sentinel-2-l2a'],limit:Math.min(Number(input.limit)||5,20),datetime:input.datetime||'2026-01-01T00:00:00Z/..'};
   const response=await fetch('https://stac.dataspace.copernicus.eu/v1/search',{method:'POST',headers:{'content-type':'application/json',accept:'application/geo+json'},body:JSON.stringify(body)});
   if(!response.ok)throw new Error('Copernicus STAC request failed: '+response.status);
   return {serviceId:service.id,provider:'Copernicus Data Space',retrievedAt:new Date().toISOString(),data:await response.json()};
 }
 return {serviceId:service.id,provider:service.provider,status:'provider-credentials-required',message:'Real commercial/mission data requires an authorized provider connection; AION does not fabricate access.'};
}

export async function purchaseLiveSpaceService(input={}){
 const service=getLiveSpaceService(input.serviceId);
 const customerWallet=text(input.customerWallet);
 if(!service)throw new Error('unknown live space service');
 if(!customerWallet)throw new Error('customerWallet required');
 const payment={id:id('AION-LIVE-SPACE-PAY'),serviceId:service.id,customerWallet,treasuryWallet:process.env.AION_COMPANY_WALLET||'AION-COMPANY-WALLET',amountAion:service.priceAion,currency:'AION-CREDIT',status:'recorded',settlement:'internal-ledger-only',externalTransfer:false,createdAt:new Date().toISOString()};
 await setJson('live-space-payment:'+payment.id,payment); await addToIndex('space-payments',payment.id); return payment;
}
export async function listLiveSpacePayments(){return listIndexed('space-payments');}
export async function getLiveSpacePayment(idValue){return getJson('live-space-payment:'+text(idValue));}
