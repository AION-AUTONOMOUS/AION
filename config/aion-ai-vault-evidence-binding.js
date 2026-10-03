import { createValueUnit } from './aion-ai-vault-value-units.js';

export const AI_VAULT_EVIDENCE_BINDING_VERSION = '1.0.0';

export function bindAiValueUnitToRealAsset({assetClassId, unitNumber, assetId, evidenceRef, valuationSource, verified=false}={}) {
  if (!String(assetId || '').trim()) throw new Error('real assetId required');
  const unit = createValueUnit({assetClassId, unitNumber, evidenceRef, valuationSource, verified});
  return {
    version: AI_VAULT_EVIDENCE_BINDING_VERSION,
    ...unit,
    assetId: String(assetId),
    bindingStatus: 'verified-asset-bound',
    realAssetRequired: true,
    legalOwnershipInference: false,
    transferAuthority: 'none',
    financialAuthority: 'none'
  };
}

export function bindingPolicy() {
  return {
    status: 'evidence-required',
    assetIdRequired: true,
    evidenceRequired: true,
    independentValuationRequired: true,
    verifiedOnly: true,
    fakeValueAllowed: false,
    ownershipCreatedByBinding: false,
    moneyCreatedByBinding: false
  };
}
