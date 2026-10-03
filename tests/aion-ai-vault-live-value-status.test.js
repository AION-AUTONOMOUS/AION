import assert from 'node:assert/strict';
import { valueStatus, assetClassTarget } from '../config/aion-ai-vault-live-value-status.js';

describe('AION AI Vault Live Value Status',()=>{
  it('starts with zero verified value when no evidence exists',()=>{
    const s=valueStatus();
    assert.equal(s.verifiedValueUsd,0);
    assert.equal(s.status,'NO_VERIFIED_VALUE');
    assert.equal(s.targetValueUsd,10000000);
  });
  it('counts only fully evidenced units',()=>{
    const s=valueStatus({verifiedUnits:[{
      verified:true,assetId:'AION-ASSET-001',evidenceRef:'evidence://001',valuationSource:'valuation://001'
    }]});
    assert.equal(s.verifiedUnitCount,1);
    assert.equal(s.verifiedValueUsd,100000);
  });
  it('defines the one-million target for each class',()=>{
    const t=assetClassTarget('bonds-fixed-income');
    assert.equal(t.targetUnits,10);
    assert.equal(t.targetValueUsd,1000000);
  });
});
