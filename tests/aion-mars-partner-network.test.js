import test from 'node:test';
import assert from 'node:assert/strict';
import {marsNetworkHealth,createPartnerAdapter,createMarsService} from '../config/aion-mars-partner-network.js';
test('Mars network is ready without claiming control or ownership',()=>{const h=marsNetworkHealth();assert.equal(h.mars,true);assert.equal(h.directControl,false);assert.equal(h.ownershipClaim,false);assert.equal(h.externalMoney,false);const p=createPartnerAdapter({partner:'NASA'});assert.equal(p.authorization,'required');const s=createMarsService({name:'Mars mission analytics',priceAion:100});assert.equal(s.plane,'mars');assert.equal(s.settlement,'internal-ledger-only');});
test('partner and service validation is strict',()=>{assert.throws(()=>createPartnerAdapter({partner:'unknown'}),/unsupported partner/);assert.throws(()=>createMarsService({name:'x',priceAion:0}),/priceAion must be positive/);});
