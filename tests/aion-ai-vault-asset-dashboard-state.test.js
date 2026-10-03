import assert from 'node:assert/strict';
import { valueStatus } from '../config/aion-ai-vault-live-value-status.js';

describe('AION AI Vault Asset State',()=>{
  it('keeps value at zero until verified evidence exists',()=>{
    const s=valueStatus({verifiedUnits:[]});
    assert.equal(s.verifiedValueUsd,0);
    assert.equal(s.status,'NO_VERIFIED_VALUE');
  });
});
