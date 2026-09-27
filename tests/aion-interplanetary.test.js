import test from 'node:test';
import assert from 'node:assert/strict';
import { interplanetaryHealth,createProviderAdapter,createMarsService,createInterplanetaryJob } from '../config/aion-interplanetary.js';

test('AION interplanetary layer is Mars-ready without spacecraft control',()=>{
 const h=interplanetaryHealth();assert.equal(h.status,'interplanetary-ready');assert.ok(h.bodies.includes('Mars'));assert.equal(h.spacecraftCommand,false);assert.equal(h.externalMoney,false);
 const n=createProviderAdapter({name:'NASA',type:'NASA',capabilities:['public-data']});assert.equal(n.directControl,false);
 const s=createMarsService({name:'Mars Science Data',service:'mars-data',priceAion:100});assert.equal(s.destination,'Mars');assert.equal(s.settlement,'internal-ledger-only');
});
test('interplanetary jobs are planned, not falsely completed',()=>{
 const j=createInterplanetaryJob({serviceId:'SVC',objective:'analyze Mars climate data'});assert.equal(j.status,'planned');assert.equal(j.commandAccess,false);assert.equal(j.transport,'delay-tolerant');
});
