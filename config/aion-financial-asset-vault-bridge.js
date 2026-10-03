import { createFinancialAssetEvidenceRecord } from './aion-financial-asset-evidence.js';

export function createVerifiedFinancialVaultRecord(input={}) {
  const evidence=createFinancialAssetEvidenceRecord(input);
  return {
    assetId:evidence.assetId,
    assetType:evidence.assetType,
    legalOwner:evidence.legalOwner,
    jurisdiction:evidence.jurisdiction,
    externalReference:evidence.officialIdentifier,
    currency:evidence.currency,
    quantity:evidence.quantity,
    valuation:evidence.valuation,
    evidenceRefs:[
      evidence.sourceRef,
      evidence.ownershipEvidenceRef,
      evidence.custodyEvidenceRef,
      evidence.valuationSource,
      evidence.verificationRef
    ],
    rights:[evidence.ownershipEvidenceRef],
    assetFingerprint:evidence.fingerprint,
    financialAssetEvidence:evidence,
    verified:true,
    vaultEligibility:true,
    fakeOwnership:false,
    fakeValue:false
  };
}
