import test from 'node:test';
import assert from 'node:assert/strict';
import {leoExchangeHealth,listLeoIntelligenceProducts,createLeoIntelligenceOrder} from '../config/aion-leo-intelligence-exchange.js';

test('LEO Intelligence Exchange is product ready',()=>{
 const h=leoExchangeHealth();
 assert.equal(h.status,'product-ready');
 assert.equal(h.realInputs,true);
 assert.equal(h.evidenceRequired,true);
 assert.equal(h.externalMoney,false);
 assert.equal(listLeoIntelligenceProducts().length,4);
});

test('LEO orders require evidence before completion',async()=>{
 const order=await createLeoIntelligenceOrder({productId:'leo-risk-watch',customer:'test-customer',objective:'monitor orbital risk'});
 assert.equal(order.status,'awaiting-evidence');
 assert.equal(order.evidencePolicy,'source-and-timestamp-required');
 assert.equal(order.priceAion,450);
});
