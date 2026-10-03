import test from 'node:test';
import assert from 'node:assert/strict';
import { securityPosture, hashEvidence } from '../config/aion-asset-vault-security.js';

test('security posture requires external key custody',()=>{
  const s=securityPosture();
  assert.equal(s.keys,'external KMS/HSM required; private keys never stored in repository');
  assert.match(s.custody,/threshold\/multisignature/);
});

test('evidence hashing is deterministic',()=>{
  assert.equal(hashEvidence({a:1}),hashEvidence({a:1}));
});
