import test from 'node:test';
import assert from 'node:assert/strict';
import { reconciliationResult } from '../config/aion-asset-vault-reconciliation.js';

test('matching external evidence verifies',()=>{
  const record={assetId:'asset-1',legalOwner:'owner-1',custodian:'custodian-1',registry:'registry-1',evidenceRefs:['e2','e1'],valuation:100,verifiedAt:'2026-10-03'};
  const r=reconciliationResult({registryRecord:record,externalEvidence:{...record,evidenceRefs:['e1','e2']}});
  assert.equal(r.status,'VERIFIED');
  assert.equal(r.failClosed,false);
});

test('mismatch fails closed',()=>{
  const record={assetId:'asset-1',legalOwner:'owner-1',custodian:'custodian-1'};
  const r=reconciliationResult({registryRecord:record,externalEvidence:{...record,legalOwner:'other-owner'}});
  assert.equal(r.status,'MISMATCH');
  assert.equal(r.failClosed,true);
});
