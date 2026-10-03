import crypto from 'node:crypto';

export const AI_VAULT_VALUE_UNITS_VERSION = '1.0.0';

/*
 * A value unit is an AI capability valuation record, not a claim that
 * an AI model, token, security, or asset is legally worth this amount.
 * Real financial value requires an independently verified asset, contract,
 * customer payment, or other recognized valuation basis.
 */
export const VALUE_UNIT_POLICY = Object.freeze({
  unitType: 'ai-capability-valuation',
  currency: 'USD',
  defaultUnitValueUsd: 100_000,
  defaultUnitsPerAssetClass: 10,
  defaultClassValueUsd: 1_000_000,
  realValueRequired: true,
  legalOwnershipInference: false,
  fakeValueAllowed: false,
  revenueClaimAllowed: false
});

export const AI_VALUE_ASSET_CLASSES = Object.freeze([
  'equities-funds',
  'bonds-fixed-income',
  'real-estate',
  'metals-commodities',
  'energy-infrastructure',
  'rights-licenses',
  'intellectual-property',
  'data-rights',
  'digital-rwa',
  'environmental-certificates'
]);

export function createValueUnit({assetClassId, unitNumber, evidenceRef, valuationSource, verified=false}={}) {
  const assetClass = String(assetClassId || '');
  const n = Number(unitNumber);
  if (!AI_VALUE_ASSET_CLASSES.includes(assetClass)) throw new Error('unsupported asset class');
  if (!Number.isInteger(n) || n < 1 || n > VALUE_UNIT_POLICY.defaultUnitsPerAssetClass) {
    throw new Error('unitNumber must be 1..10');
  }
  if (!verified || !String(evidenceRef || '').trim() || !String(valuationSource || '').trim()) {
    throw new Error('real evidence and independent valuation verification required');
  }

  const id = 'AION-AI-VALUE-' + assetClass.toUpperCase().replaceAll('-', '_') + '-' + String(n).padStart(2,'0');
  const valueUsd = VALUE_UNIT_POLICY.defaultUnitValueUsd;
  return {
    id,
    assetClass,
    unitNumber: n,
    unitType: VALUE_UNIT_POLICY.unitType,
    valueUsd,
    valueBasis: 'verified-external-evidence-and-valuation',
    evidenceRef: String(evidenceRef),
    valuationSource: String(valuationSource),
    verified: true,
    legalOwnershipInference: false,
    fakeValue: false,
    revenueClaim: false,
    fingerprint: crypto.createHash('sha256').update(JSON.stringify({
      id, assetClass, n, valueUsd, evidenceRef: String(evidenceRef), valuationSource: String(valuationSource)
    })).digest('hex')
  };
}

export function classValueSummary({assetClassId, units=10}={}) {
  const assetClass = String(assetClassId || '');
  const count = Number(units);
  if (!AI_VALUE_ASSET_CLASSES.includes(assetClass)) throw new Error('unsupported asset class');
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error('units must be 1..10');
  return {
    assetClass,
    unitCount: count,
    unitValueUsd: VALUE_UNIT_POLICY.defaultUnitValueUsd,
    totalValueUsd: count * VALUE_UNIT_POLICY.defaultUnitValueUsd,
    requiresVerifiedEvidence: true,
    valuationIsNotRevenue: true,
    valuationIsNotLegalOwnership: true
  };
}
