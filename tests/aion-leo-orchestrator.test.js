import test from 'node:test';
import assert from 'node:assert/strict';
import {leoOrchestratorHealth,listLeoProviders,routeLeoJob} from '../config/aion-leo-orchestrator.js';

test('LEO orchestrator is real-data ready',()=>{
 const health=leoOrchestratorHealth();
 assert.equal(health.status,'operational-data-ready');
 assert.equal(health.realData,true);
 assert.equal(health.spacecraftControl,false);
 assert.equal(health.externalMoney,false);
 assert.equal(listLeoProviders().length,4);
});

test('LEO routing never fabricates commercial access',async()=>{
 const route=await routeLeoJob({objective:'find a resilient LEO data path',sources:['orbit','commercial-leo']});
 assert.equal(route.providerPlan[0],'celestrak');
 assert.equal(route.providerPlan[1],'commercial-leo');
 assert.equal(route.commercialFallback,'credentials-required');
 assert.equal(route.guarantees.noFabricatedAccess,true);
});
