import assert from 'node:assert/strict';
import { vaultRoleAssignment, vaultRuntimeBlueprint } from '../config/aion-ai-vault-runtime.js';

describe('AION AI Vault Runtime Bridge', () => {
  it('binds a registered role without ownership or financial authority', () => {
    const result = vaultRoleAssignment({
      assetClassId: 'bonds-fixed-income',
      roleNumber: 1,
      roleType: 'analyst'
    });
    assert.equal(result.status, 'role-ready');
    assert.equal(result.ownershipClaimAllowed, false);
    assert.equal(result.financialAuthority, 'none');
    assert.equal(result.realAssetRequired, true);
  });

  it('keeps the 10M registry as registered capabilities, not concurrent processes', () => {
    const blueprint = vaultRuntimeBlueprint();
    assert.equal(
      blueprint.scaleModel,
      '10-million-registered-roles, not 10-million-concurrent-processes'
    );
    assert.equal(blueprint.realAssetGate, 'external-evidence-and-verification-required');
  });
});
