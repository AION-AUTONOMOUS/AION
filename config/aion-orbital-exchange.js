import crypto from 'node:crypto';
import { getJson, setJson, addToIndex, listIndexed } from './aion-stack-store.js';

export const ORBITAL_EXCHANGE_VERSION='1.0.0';
export const SUCCESS_FEE_RATE=0.05;

const PROVIDERS=Object.freeze([
 {id:'ses',name:'SES',type:'satellite-operator',status:'target',capabilities:['geo','meo','leo','connectivity','government','maritime']},
 {id:'eutelsat-oneweb',name:'Eutelsat OneWeb',type:'satellite-operator',status:'target',capabilities:['leo','connectivity','enterprise','government','maritime']},
 {id:'viasat',name:'Viasat',type:'satellite-operator',status:'target',capabilities:['geo','connectivity','aviation','maritime','government']},
 {id:'planet',name:'Planet',type:'earth-observation',status:'target',capabilities:['earth-observation','agriculture','energy','insurance','maritime']},
 {id:'iceye',name:'ICEYE',type:'earth-observation',status:'target',capabilities:['sar','earth-observation','insurance','disaster-response','energy','maritime']}
]);

const VERTICALS=['energy','mining','agriculture','insurance','maritime','aviation','telecom','infrastructure','logistics','climate','research','emergency-response'];

function text(v){return String(v??'').trim();}
function id(prefix){return prefix+'-'+crypto.randomUUID();}
function cleanList(v){return Array.isArray(v)?v.map(text).filter(Boolean).slice(0,30):[];}

export function orbitalExchangeHealth(){
 return {version:ORBITAL_EXCHANGE_VERSION,status:'rfq-ready',successFeeRate:SUCCESS_FEE_RATE,providerRegistry:PROVIDERS.length,
  verticals:VERTICALS.length,verifiedProviders:PROVIDERS.filter(p=>p.status==='verified').length,
  targetProviders:PROVIDERS.filter(p=>p.status==='target').length,realContracts:0,storage:'stack-store',
  contractAuthority:'provider-confirmation-required',externalMoney:false,spacecraftControl:false};
}
export function listProviders(){return PROVIDERS.map(p=>({...p}));}

export async function createSpaceRFQ(input={}){
 const customer=text(input.customer);
 const email=text(input.email);
 const objective=text(input.objective);
 if(!customer)throw new Error('customer required');
 if(!email||!email.includes('@'))throw new Error('valid email required');
 if(!objective)throw new Error('objective required');
 const rfq={id:id('AION-RFQ'),customer,email,company:text(input.company),objective,
  vertical:text(input.vertical),geography:text(input.geography),coverage:text(input.coverage),
  capabilities:cleanList(input.capabilities),requiredCapacity:text(input.requiredCapacity),
  timing:text(input.timing),budget:text(input.budget),status:'received',providerStatus:'not-yet-verified',
  successFeeRate:SUCCESS_FEE_RATE,successFeeBasis:'qualifying contract value introduced or materially facilitated by AION; payable only under signed agreement',
  createdAt:new Date().toISOString()};
 await setJson('space-rfqs:'+rfq.id,rfq); await addToIndex('space-rfqs',rfq.id); return rfq;
}
export async function listSpaceRFQs(){return listIndexed('space-rfqs');}
export async function getSpaceRFQ(rfqId){return getJson('space-rfqs:'+text(rfqId));}

export async function createCommissionRecord(input={}){
 const contractValue=Number(input.contractValue);
 if(!Number.isFinite(contractValue)||contractValue<=0)throw new Error('positive contractValue required');
 const record={id:id('AION-COMMISSION'),rfqId:text(input.rfqId),providerId:text(input.providerId),
  customer:text(input.customer),contractValue,feeRate:SUCCESS_FEE_RATE,commissionAmount:Number((contractValue*SUCCESS_FEE_RATE).toFixed(2)),
  currency:text(input.currency)||'USD',status:'receivable-pending-contract-verification',
  createdAt:new Date().toISOString()};
 await setJson('space-commissions:'+record.id,record); await addToIndex('space-commissions',record.id); return record;
}
export async function listCommissionRecords(){return listIndexed('space-commissions');}
