import crypto from 'node:crypto';
import { addToIndex, getJson, listIndexed, setJson } from './aion-stack-store.js';

export const REAL_ECONOMY_VERSION='1.0.0';
const STATUSES=['draft','active','suspended','completed'];
const CURRENCIES=['AION-CREDIT'];

function text(v){return String(v??'').trim();}
function id(p){return p+'-'+crypto.randomUUID();}

export function realEconomyHealth(){
 return {version:REAL_ECONOMY_VERSION,status:'b2b-ready',currency:'AION-CREDIT',
  rails:['invoicing','escrow','subscriptions','service-orders','receipts'],settlement:'internal-ledger-only',
  externalMoney:false,mainnet:false,compliance:'policy-gated',auditTrail:true};
}

export function createBusiness(input={}){
 const name=text(input.name), jurisdiction=text(input.jurisdiction);
 if(!name)throw new Error('business name required');
 if(!jurisdiction)throw new Error('jurisdiction required');
 return {id:id('AION-BIZ'),name,jurisdiction,industry:text(input.industry)||'general',
  status:'active',verification:'pending',createdAt:new Date().toISOString()};
}
export async function registerBusiness(input={}){const x=createBusiness(input);await setJson('business:'+x.id,x);await addToIndex('businesses',x.id);return x;}
export async function listBusinesses(){return listIndexed('businesses');}

export function createInvoice(input={}){
 const businessId=text(input.businessId), description=text(input.description), amount=Number(input.amount);
 if(!businessId)throw new Error('businessId required');
 if(!description)throw new Error('description required');
 if(!Number.isFinite(amount)||amount<=0)throw new Error('amount must be positive');
 return {id:id('AION-INV'),businessId,description,amount,currency:'AION-CREDIT',
  status:'draft',dueAt:input.dueAt||null,settlement:'internal-ledger-only',createdAt:new Date().toISOString()};
}
export async function saveInvoice(x){if(!x?.id)throw new Error('invoice required');await setJson('invoice:'+x.id,x);await addToIndex('invoices',x.id);return x;}
export async function listInvoices(){return listIndexed('invoices');}

export function createEscrow(input={}){
 const invoiceId=text(input.invoiceId);
 if(!invoiceId)throw new Error('invoiceId required');
 const amount=Number(input.amount);
 if(!Number.isFinite(amount)||amount<=0)throw new Error('amount must be positive');
 return {id:id('AION-ESCROW'),invoiceId,amount,currency:'AION-CREDIT',
  status:'funds-not-deposited',releasePolicy:'proof-of-delivery-or-owner-approved-dispute',
  externalSettlement:false,createdAt:new Date().toISOString()};
}
export async function saveEscrow(x){if(!x?.id)throw new Error('escrow required');await setJson('escrow:'+x.id,x);await addToIndex('escrows',x.id);return x;}
export async function listEscrows(){return listIndexed('escrows');}

export function createReceipt(input={}){
 const orderId=text(input.orderId), proof=text(input.proof);
 if(!orderId||!proof)throw new Error('orderId and proof required');
 return {id:id('AION-RECEIPT'),orderId,proofHash:crypto.createHash('sha256').update(proof).digest('hex'),
  status:'verified-input',measured:true,createdAt:new Date().toISOString()};
}
export { STATUSES, CURRENCIES };
