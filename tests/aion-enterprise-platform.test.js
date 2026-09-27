import test from 'node:test';
import assert from 'node:assert/strict';
import { enterprisePlatformHealth,createProduct,createServiceContract } from '../config/aion-enterprise-platform.js';

test('enterprise platform has governed proprietary service model',()=>{
 const h=enterprisePlatformHealth();assert.equal(h.status,'product-ready');assert.equal(h.externalMoney,false);assert.equal(h.mainnet,false);assert.equal(h.exclusiveOwnership,'not-claimed');
 const p=createProduct({name:'AION Agent Operations',domain:'agent-operations',monthlyAion:500});
 assert.equal(p.delivery,'AION-proprietary-orchestrated-service');assert.equal(p.customerData,'customer-controlled');
});
test('contracts require product and business',()=>{
 assert.throws(()=>createServiceContract({productId:'x'}),/productId and businessId required/);
 const c=createServiceContract({productId:'P',businessId:'B',tier:'enterprise',termMonths:12});
 assert.equal(c.tier,'enterprise');assert.equal(c.termMonths,12);assert.equal(c.settlement,'AION-CREDIT-internal-ledger');
});
