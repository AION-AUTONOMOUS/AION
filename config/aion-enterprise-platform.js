import crypto from 'node:crypto';
import { addToIndex, getJson, listIndexed, setJson } from './aion-stack-store.js';

export const ENTERPRISE_PLATFORM_VERSION='1.0.0';
const TIERS=Object.freeze(['starter','growth','enterprise','sovereign']);
const DOMAINS=Object.freeze(['agent-operations','security','data-intelligence','finance-automation','space-intelligence','research']);

function text(v){return String(v??'').trim();}
function id(p){return p+'-'+crypto.randomUUID();}

export function enterprisePlatformHealth(){return{
 version:ENTERPRISE_PLATFORM_VERSION,status:'product-ready',domains:[...DOMAINS],tiers:[...TIERS],
 differentiation:['proprietary-orchestration','measured-outcomes','policy-engine','audit-receipts','provider-adapters'],
 externalMoney:false,mainnet:false,exclusiveOwnership:'not-claimed',compliance:'customer-jurisdiction-and-policy-gated'
};}

export function createProduct(input={}){
 const name=text(input.name),domain=text(input.domain);
 if(!name)throw new Error('product name required');
 if(!DOMAINS.includes(domain))throw new Error('invalid domain');
 const monthlyAion=Number(input.monthlyAion);
 if(!Number.isFinite(monthlyAion)||monthlyAion<=0)throw new Error('monthlyAion must be positive');
 return {id:id('AION-PRODUCT'),name,domain,monthlyAion,currency:'AION-CREDIT',
  valueMetric:text(input.valueMetric)||'measured-outcomes',delivery:'AION-proprietary-orchestrated-service',
  ipPolicy:'AION-owned-or-licensed-components',customerData:'customer-controlled',status:'cataloged',
  createdAt:new Date().toISOString()};
}
export async function registerProduct(input={}){const x=createProduct(input);await setJson('product:'+x.id,x);await addToIndex('enterprise-products',x.id);return x;}
export async function listProducts(){return listIndexed('enterprise-products');}

export function createServiceContract(input={}){
 const productId=text(input.productId),businessId=text(input.businessId);
 if(!productId||!businessId)throw new Error('productId and businessId required');
 return {id:id('AION-CONTRACT'),productId,businessId,tier:TIERS.includes(input.tier)?input.tier:'growth',
  termMonths:Number.isInteger(input.termMonths)&&input.termMonths>0?input.termMonths:1,
  governance:'AION-policy-engine',settlement:'AION-CREDIT-internal-ledger',
  renewal:'customer-controlled',status:'draft',createdAt:new Date().toISOString()};
}
export async function saveServiceContract(x){await setJson('contract:'+x.id,x);await addToIndex('service-contracts',x.id);return x;}
export async function listServiceContracts(){return listIndexed('service-contracts');}

export async function getProduct(idValue){return getJson('product:'+text(idValue));}
export {TIERS,DOMAINS};
