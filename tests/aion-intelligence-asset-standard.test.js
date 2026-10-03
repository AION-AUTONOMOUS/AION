import assert from 'node:assert/strict';
import { createIntelligenceAsset, validateIntelligenceAsset } from '../config/aion-intelligence-asset-standard.js';

const base={
 assetId:'AION-INT-TEST-001',assetType:'ai-model',sourceRef:'source://aion',
 evidenceRef:'evidence://test',rightsRef:'rights://test',performanceRef:'performance://test',
 verificationRef:'verification://independent',valuationSource:'valuation://independent',verified:true
};
assert.equal(validateIntelligenceAsset(base).valid,true);
assert.equal(createIntelligenceAsset(base).vaultEligibility,true);
assert.equal(validateIntelligenceAsset({...base,verified:false}).valid,false);
assert.throws(()=>createIntelligenceAsset({...base,evidenceRef:''}));
console.log('AION Intelligence Asset Standard tests passed');
