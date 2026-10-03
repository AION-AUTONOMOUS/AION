import assert from 'node:assert/strict';
import { createVerifiedFinancialVaultRecord } from '../config/aion-financial-asset-vault-bridge.js';
const input={assetId:'AION-SEC-TEST-002',assetType:'bond',issuer:'TEST-ISSUER',officialIdentifier:'ISIN-TEST-002',sourceRef:'issuer://test',ownershipEvidenceRef:'custody://ownership-test',custodyEvidenceRef:'custody://test',valuationSource:'valuation://independent',valuationDate:'2026-10-04',evidenceSource:'regulated-custodian',verificationRef:'verification://audit',legalOwner:'AION AUTONOMOUS',jurisdiction:'TEST',verified:true,valuationVerified:true,ownershipVerified:true,custodyVerified:true};
const r=createVerifiedFinancialVaultRecord(input);
assert.equal(r.verified,true); assert.equal(r.vaultEligibility,true); assert.equal(r.fakeOwnership,false); assert.match(r.assetFingerprint,/^[a-f0-9]{64}$/);
console.log('AION financial vault bridge tests passed');
