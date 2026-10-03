import crypto from 'node:crypto';

export const RECONCILIATION_VERSION='1.0.0';

export function canonicalEvidence(record){
  return {
    assetId:record.assetId,
    legalOwner:record.legalOwner ?? null,
    custodian:record.custodian ?? null,
    registry:record.registry ?? null,
    evidenceRefs:Array.isArray(record.evidenceRefs)?[...record.evidenceRefs].sort():[],
    valuation:record.valuation ?? null,
    verifiedAt:record.verifiedAt ?? null
  };
}

export function evidenceFingerprint(record){
  return crypto.createHash('sha256')
    .update(JSON.stringify(canonicalEvidence(record)))
    .digest('hex');
}

export function reconciliationResult({registryRecord,externalEvidence}){
  const expected=evidenceFingerprint(registryRecord);
  const observed=evidenceFingerprint(externalEvidence);
  return {
    version:RECONCILIATION_VERSION,
    match:expected===observed,
    expectedFingerprint:expected,
    observedFingerprint:observed,
    status:expected===observed?'VERIFIED':'MISMATCH',
    failClosed:expected!==observed
  };
}
