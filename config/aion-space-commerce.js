import crypto from 'node:crypto';
import { getJson, setJson, addToIndex, listIndexed } from './aion-stack-store.js';

export const SPACE_COMMERCE_VERSION='1.0.0';
export const SPACE_TREASURY_WALLET='AION-COMPANY-WALLET';
const CATALOG=Object.freeze([
 {id:'orbit-intelligence',name:'AION Orbit Intelligence',category:'earth-observation',priceAion:120,unit:'per-analysis',description:'AI analysis of licensed Earth-observation data.'},
 {id:'space-weather',name:'AION Space Weather Shield',category:'space-weather',priceAion:180,unit:'per-report',description:'Space-weather risk brief with measured alerts and evidence.'},
 {id:'satellite-insight',name:'AION Satellite Insight',category:'satellite-data',priceAion:250,unit:'per-job',description:'Multi-source satellite-data fusion through authorized providers.'},
 {id:'orbital-ops',name:'AION Orbital Mission Planner',category:'mission-planning',priceAion:400,unit:'per-mission',description:'AI mission planning and verification; no direct spacecraft control.'},
 {id:'space-comms',name:'AION Delay-Tolerant Space Comms',category:'communications',priceAion:300,unit:'per-job',description:'Planning and routing for authorized delay-tolerant communications.'},
 {id:'mars-data',name:'AION Mars Science Data',category:'mars-data',priceAion:100,unit:'per-dataset',description:'AI-orchestrated Mars science/data service via authorized providers.'},
 {id:'mars-mission',name:'AION Mars Mission Intelligence',category:'mars-mission',priceAion:750,unit:'per-mission',description:'Earth-Mars mission analysis, simulation and verification.'},
 {id:'space-research',name:'AION Frontier Space Research',category:'research',priceAion:1000,unit:'per-project',description:'Measured research workflow across space science and autonomous AI.'}
]);

function text(v){return String(v??'').trim();}
function id(p){return p+'-'+crypto.randomUUID();}

export function spaceCommerceHealth(){
 return {version:SPACE_COMMERCE_VERSION,status:'catalog-ready',currency:'AION-CREDIT',catalogSize:CATALOG.length,treasuryWallet:SPACE_TREASURY_WALLET,settlement:'internal-ledger-only',externalMoney:false,mainnet:false};
}
export function listSpaceCatalog(){return CATALOG.map(x=>({...x,currency:'AION-CREDIT',settlement:'AION-company-wallet-ledger'}));}
export function getSpaceProduct(productId){return listSpaceCatalog().find(x=>x.id===text(productId))||null;}

export async function purchaseSpaceService(input={}){
 const product=getSpaceProduct(input.productId);
 const customerWallet=text(input.customerWallet);
 if(!product)throw new Error('unknown space product');
 if(!customerWallet)throw new Error('customerWallet required');
 const payment={id:id('AION-SPACE-PAY'),productId:product.id,customerWallet,treasuryWallet:SPACE_TREASURY_WALLET,amountAion:product.priceAion,currency:'AION-CREDIT',status:'recorded',settlement:'internal-ledger-only',externalTransfer:false,createdAt:new Date().toISOString()};
 await setJson('space-payment:'+payment.id,payment);
 await addToIndex('space-payments',payment.id);
 return payment;
}
export async function listSpacePayments(){return listIndexed('space-payments');}
export async function getSpacePayment(idValue){return getJson('space-payment:'+text(idValue));}
