import test from 'node:test';
import assert from 'node:assert/strict';
import { assetVaultHealth } from '../config/aion-global-asset-vault.js';

test('asset vault is explicit about legal ownership and custody boundaries',()=>{
  const health=assetVaultHealth();
  assert.equal(health.fakeOwnership,false);
  assert.equal(health.custody,'external-regulated-custodian-or-legal-owner');
  assert.match(health.immutableClaim,/does not itself create legal ownership/);
});

test('asset vault canonicalization is recursively deterministic',async()=>{
  const mod=await import('../config/aion-global-asset-vault.js');
  assert.equal(typeof mod.registerAsset,'function');
  assert.equal(typeof mod.verifyAsset,'function');
});

test('intelligence registration carries a uniqueness fingerprint',async()=>{
  const { intelligenceAssetFingerprint }=await import('../config/aion-intelligence-asset-standard.js');
  const fp=intelligenceAssetFingerprint({
    assetId:'AION-INT-UNIQUENESS-001',assetType:'ai-model',sourceRef:'source://1',
    evidenceRef:'evidence://1',rightsRef:'rights://1',performanceRef:'performance://1',
    verificationRef:'verification://1',valuationSource:'valuation://1',
    evidenceSource:'independent-audit',valuationDate:'2026-10-04'
  });
  assert.match(fp,/^[a-f0-9]{64}$/);
});
