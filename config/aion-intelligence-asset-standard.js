import crypto from 'node:crypto';

export const AION_INTELLIGENCE_ASSET_STANDARD_VERSION = '1.0.0';

export const INTELLIGENCE_EVIDENCE_SOURCES = Object.freeze(['issuer','regulated-custodian','official-registry','signed-license','independent-audit','reproducible-benchmark','customer-contract','public-primary-source']);

export const INTELLIGENCE_ASSET_TYPES = Object.freeze([
  'ai-model','ai-agent','software','dataset','research','patent-ip',
  'knowledge-base','algorithm','workflow','verified-performance'
]);

const REQUIRED_EVIDENCE = Object.freeze([
  'assetId','sourceRef','evidenceRef','rightsRef','performanceRef',
  'verificationRef','valuationSource','evidenceSource','valuationDate'
]);

function required(value,name){
  const v=String(value??'').trim();
  if(!v) throw new Error(name+' required');
  return v;
}

export function intelligenceAssetFingerprint(input={}){
  const canonical = JSON.stringify({
    assetId:required(input.assetId,'assetId'),
    assetType:required(input.assetType,'assetType'),
    sourceRef:required(input.sourceRef,'sourceRef'),
    evidenceRef:required(input.evidenceRef,'evidenceRef'),
    rightsRef:required(input.rightsRef,'rightsRef'),
    performanceRef:required(input.performanceRef,'performanceRef'),
    verificationRef:required(input.verificationRef,'verificationRef'),
    valuationSource:required(input.valuationSource,'valuationSource'),
    evidenceSource:required(input.evidenceSource,'evidenceSource'),
    valuationDate:required(input.valuationDate,'valuationDate')
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

export function validateIntelligenceAsset(input={}){
  const errors=[];
  if(!INTELLIGENCE_ASSET_TYPES.includes(String(input.assetType))) errors.push('unsupported assetType');
  if(!INTELLIGENCE_EVIDENCE_SOURCES.includes(String(input.evidenceSource||''))) errors.push('unsupported evidenceSource');
  for(const key of REQUIRED_EVIDENCE){
    if(!String(input[key]??'').trim()) errors.push(key+' required');
  }
  if(input.verified !== true) errors.push('verified must be true');
  return {
    standard:AION_INTELLIGENCE_ASSET_STANDARD_VERSION,
    valid:errors.length===0,
    errors,
    realAssetRequiresEvidence:true,
    legalRightsMustBeProven:true,
    independentVerificationRequired:true,
    independentValuationRequired:true,
    fakeValue:false,
    fakeOwnership:false
  };
}

export function createIntelligenceAsset(input={}){
  const validation=validateIntelligenceAsset(input);
  if(!validation.valid) throw new Error(validation.errors.join('; '));
  return {
    id:required(input.assetId,'assetId'),
    assetType:String(input.assetType),
    sourceRef:required(input.sourceRef,'sourceRef'),
    evidenceRef:required(input.evidenceRef,'evidenceRef'),
    rightsRef:required(input.rightsRef,'rightsRef'),
    performanceRef:required(input.performanceRef,'performanceRef'),
    verificationRef:required(input.verificationRef,'verificationRef'),
    valuationSource:required(input.valuationSource,'valuationSource'),
    evidenceSource:required(input.evidenceSource,'evidenceSource'),
    valuationDate:required(input.valuationDate,'valuationDate'),
    valuation: input.valuation ?? null,
    valuationCurrency: String(input.valuationCurrency || 'USD'),
    verified:true,
    fingerprint:intelligenceAssetFingerprint(input),
    ownershipAuthority:'none-unless-rights-evidence-proves-it',
    financialAuthority:'none',
    valuationIsNotCash:true,
    valuationIsNotRevenue:true,
    createdAt:new Date().toISOString()
  };
}

export function createVerifiedAssetCertificate(assetInput={}){
  const asset=createIntelligenceAsset(assetInput);
  const certificatePayload={
    certificateVersion:'1.0.0',
    certificateType:'AION-VERIFIED-INTELLIGENCE-ASSET',
    assetId:asset.id,
    assetType:asset.assetType,
    fingerprint:asset.fingerprint,
    evidenceSource:asset.evidenceSource,
    sourceRef:asset.sourceRef,
    evidenceRef:asset.evidenceRef,
    rightsRef:asset.rightsRef,
    performanceRef:asset.performanceRef,
    verificationRef:asset.verificationRef,
    valuationSource:asset.valuationSource,
    valuationDate:asset.valuationDate
  };
  const certificateId='AION-CERT-'+crypto.createHash('sha256')
    .update(JSON.stringify(certificatePayload)).digest('hex').slice(0,24).toUpperCase();
  return {
    certificateId,
    ...certificatePayload,
    status:'VERIFIED',
    attestation:'AION registry attestation based on supplied evidence',
    legalTitleProven:false,
    legalOwnershipRequiresExternalRightsEvidence:true,
    valuationIsNotCash:true,
    valuationIsNotRevenue:true,
    issuedAt:new Date().toISOString()
  };
}

export async function registerIntelligenceAsset(asset={}){
  const record=createIntelligenceAsset(asset);
  const { registerAsset } = await import('./aion-global-asset-vault.js');
  return registerAsset({
    assetType:'intelligence',
    legalOwner:required(asset.legalOwner,'legalOwner'),
    jurisdiction:required(asset.jurisdiction,'jurisdiction'),
    custodian:asset.custodian,
    externalReference:asset.sourceRef,
    assetFingerprint:record.fingerprint,
    currency:asset.valuationCurrency || 'USD',
    valuation:asset.valuation ?? null,
    evidenceRefs:[record.evidenceRef,record.sourceRef,record.rightsRef,record.performanceRef,record.verificationRef,record.valuationSource,record.evidenceSource,record.valuationDate],
    rights:[record.rightsRef],
    risk:asset.risk ?? null,
    cashFlow:null,
    intelligenceAsset:record
  });
}

export function intelligenceAssetVaultRecord(asset){
  const record=createIntelligenceAsset(asset);
  return {
    ...record,
    vaultType:'intelligence-asset',
    vaultEligibility:true
  };
}

export function intelligenceEconomicAssetRecord(input={}) {
  const asset=createIntelligenceAsset(input);
  const valueProfile=createIntelligenceValueProfile(input);
  return {
    assetId:asset.id,
    assetType:asset.assetType,
    intelligenceValueScore:valueProfile.intelligenceValueScore,
    valueDimensions:valueProfile.dimensions,
    economicValue:valueProfile.economicValue,
    economicValueCurrency:valueProfile.economicValueCurrency,
    economicValueSource:valueProfile.economicValueSource,
    economicValueDate:valueProfile.economicValueDate,
    fingerprint:asset.fingerprint,
    evidenceBound:true,
    verified:true,
    isEconomicAsset:true,
    valuationIsNotCash:true,
    valuationIsNotRevenue:true,
    fakeValue:false
  };
}
