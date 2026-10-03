import test from 'node:test';
import assert from 'node:assert/strict';
import { assetVaultHealth } from '../config/aion-global-asset-vault.js';

test('asset vault is explicit about legal ownership and custody boundaries',()=>{
  const health=assetVaultHealth();
  assert.equal(health.fakeOwnership,false);
  assert.equal(health.custody,'external-regulated-custodian-or-legal-owner');
  assert.match(health.immutableClaim,/does not itself create legal ownership/);
});
