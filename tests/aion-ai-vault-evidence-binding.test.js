import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bindAiValueUnitToRealAsset, bindingPolicy } from '../config/aion-ai-vault-evidence-binding.js';

describe('AION AI Vault Evidence Binding', () => {
  it('binds a verified AI value unit to a real asset identifier', () => {
    const result = bindAiValueUnitToRealAsset({
      assetClassId:'bonds-fixed-income',
      unitNumber:1,
      assetId:'AION-ASSET-REAL-BOND-001',
      evidenceRef:'verified://bond-001',
      valuationSource:'independent://valuation-001',
      verified:true
    });
    assert.equal(result.bindingStatus,'verified-asset-bound');
    assert.equal(result.valueUsd,100000);
    assert.equal(result.assetId,'AION-ASSET-REAL-BOND-001');
    assert.equal(result.transferAuthority,'none');
  });

  it('fails without an asset identifier', () => {
    assert.throws(() => bindAiValueUnitToRealAsset({
      assetClassId:'bonds-fixed-income', unitNumber:1,
      evidenceRef:'verified://bond-001', valuationSource:'independent://valuation-001', verified:true
    }), /real assetId required/);
  });

  it('never turns binding into money or ownership', () => {
    const policy=bindingPolicy();
    assert.equal(policy.moneyCreatedByBinding,false);
    assert.equal(policy.ownershipCreatedByBinding,false);
  });
});
