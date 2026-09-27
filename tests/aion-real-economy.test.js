import test from 'node:test';
import assert from 'node:assert/strict';
import { realEconomyHealth,createBusiness,createInvoice,createEscrow,createReceipt } from '../config/aion-real-economy.js';

test('real economy is B2B-ready but external settlement is guarded',()=>{
 const h=realEconomyHealth();assert.equal(h.status,'b2b-ready');assert.equal(h.externalMoney,false);assert.equal(h.mainnet,false);
 const b=createBusiness({name:'Acme Space Systems',jurisdiction:'SA',industry:'space'});
 assert.equal(b.status,'active');
 const i=createInvoice({businessId:b.id,description:'Earth observation analytics',amount:1250});
 assert.equal(i.currency,'AION-CREDIT');assert.equal(i.settlement,'internal-ledger-only');
 const e=createEscrow({invoiceId:i.id,amount:1250});assert.equal(e.externalSettlement,false);
 const r=createReceipt({orderId:'ORDER-1',proof:'delivery-proof'});assert.equal(r.proofHash.length,64);
});
test('economy validates required fields',()=>{
 assert.throws(()=>createBusiness({name:'x'}),/jurisdiction required/);
 assert.throws(()=>createInvoice({businessId:'x',description:'x',amount:0}),/amount must be positive/);
 assert.throws(()=>createEscrow({invoiceId:'x',amount:0}),/amount must be positive/);
});
