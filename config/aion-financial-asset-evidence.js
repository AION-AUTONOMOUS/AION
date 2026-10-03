import crypto from 'node:crypto';
export const AION_FINANCIAL_ASSET_EVIDENCE_STANDARD_VERSION='1.0.0';
export const FINANCIAL_ASSET_TYPES=Object.freeze(['equity','fund','bond','treasury-security','money-market-instrument','commodity','real-estate','energy-infrastructure','tokenized-rwa']);
export const FINANCIAL_EVIDENCE_SOURCES=Object.freeze(['issuer','regulated-custodian','official-registry','independent-audit']);
const REQUIRED=Object.freeze(['assetId','assetType','issuer','officialIdentifier','sourceRef','ownershipEvidenceRef','custodyEvidenceRef','valuationSource','valuationDate','evidenceSource','verificationRef','legalOwner','jurisdiction']);
const required=(v,n)=>{const s=String(v??'').trim();if(!s)throw new Error(n+' required');return s;};
function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
export function financialAssetFingerprint(input={}){const payload={};for(const key of REQUIRED)payload[key]=required(input[key],key);return crypto.createHash('sha256').update(canonical(payload)).digest('hex');}
export function validateFinancialAsset(input={}){
 const errors=[];
 if(!FINANCIAL_ASSET_TYPES.includes(String(input.assetType||'')))errors.push('unsupported assetType');
 if(!FINANCIAL_EVIDENCE_SOURCES.includes(String(input.evidenceSource||'')))errors.push('unsupported evidenceSource');
 for(const key of REQUIRED)if(!String(input[key]??'').trim())errors.push(key+' required');
 if(input.verified!==true)errors.push('verified must be true');
 if(input.valuationVerified!==true)errors.push('valuationVerified must be true');
 if(input.ownershipVerified!==true)errors.push('ownershipVerified must be true');
 if(input.custodyVerified!==true)errors.push('custodyVerified must be true');
 if(input.evidenceRefHash && !/^[a-f0-9]{64}$/.test(String(input.evidenceRefHash)))errors.push('evidenceRefHash must be SHA-256 hex');
 if(input.valuationSourceRefHash && !/^[a-f0-9]{64}$/.test(String(input.valuationSourceRefHash)))errors.push('valuationSourceRefHash must be SHA-256 hex');
 if(input.evidenceSource==='independent-audit' && !String(input.auditReportRef||'').trim())errors.push('auditReportRef required for independent-audit');
 return {standard:AION_FINANCIAL_ASSET_EVIDENCE_STANDARD_VERSION,valid:errors.length===0,errors,realAssetRequiresExternalEvidence:true,legalOwnershipRequiresExternalEvidence:true,custodyRequiresExternalEvidence:true,independentVerificationRequired:true,fakeOwnership:false,fakeValue:false};
}
export function createFinancialAssetEvidenceRecord(input={}){
 const validation=validateFinancialAsset(input);if(!validation.valid)throw new Error(validation.errors.join('; '));
 return {assetId:required(input.assetId,'assetId'),assetType:required(input.assetType,'assetType'),issuer:required(input.issuer,'issuer'),officialIdentifier:required(input.officialIdentifier,'officialIdentifier'),sourceRef:required(input.sourceRef,'sourceRef'),ownershipEvidenceRef:required(input.ownershipEvidenceRef,'ownershipEvidenceRef'),custodyEvidenceRef:required(input.custodyEvidenceRef,'custodyEvidenceRef'),valuationSource:required(input.valuationSource,'valuationSource'),valuationDate:required(input.valuationDate,'valuationDate'),evidenceSource:required(input.evidenceSource,'evidenceSource'),verificationRef:required(input.verificationRef,'verificationRef'),legalOwner:required(input.legalOwner,'legalOwner'),jurisdiction:required(input.jurisdiction,'jurisdiction'),quantity:input.quantity??null,faceValue:input.faceValue??null,currency:String(input.currency||'USD'),valuation:input.valuation??null,verified:true,ownershipVerified:true,custodyVerified:true,valuationVerified:true,fingerprint:financialAssetFingerprint(input),evidenceRefHash:input.evidenceRefHash||null,valuationSourceRefHash:input.valuationSourceRefHash||null,auditReportRef:input.auditReportRef||null,evidenceBound:true,fakeOwnership:false,fakeValue:false,createdAt:new Date().toISOString()};
}
