import { ASSET_CLASSES } from './aion-ai-asset-registry.js';
import { createValueUnit, VALUE_UNIT_POLICY } from './aion-ai-vault-value-units.js';

export const AI_VAULT_VALUE_PORTFOLIO_VERSION = '1.0.0';

export function buildValueUnitPlan() {
  return ASSET_CLASSES.map(cls => ({
    assetClassId: cls.id,
    assetClassName: cls.name,
    uniqueAiValueUnits: Array.from({length: 10}, (_, i) => ({
      unitNumber: i + 1,
      aiRoleNumber: i + 1,
      targetValueUsd: VALUE_UNIT_POLICY.defaultUnitValueUsd,
      status: 'requires-real-evidence'
    })),
    targetClassValuationUsd: 1_000_000
  }));
}

export function buildVerifiedValuePortfolio({verifiedUnits=[]}={}) {
  const accepted = [];
  const rejected = [];
  for (const item of Array.isArray(verifiedUnits) ? verifiedUnits : []) {
    try {
      const unit = createValueUnit(item);
      accepted.push(unit);
    } catch (error) {
      rejected.push({
        assetClassId: item?.assetClassId ?? null,
        unitNumber: item?.unitNumber ?? null,
        reason: error.message
      });
    }
  }
  const verifiedValueUsd = accepted.reduce((sum, x) => sum + x.valueUsd, 0);
  return {
    version: AI_VAULT_VALUE_PORTFOLIO_VERSION,
    verifiedUnitCount: accepted.length,
    verifiedValueUsd,
    targetUnitValueUsd: VALUE_UNIT_POLICY.defaultUnitValueUsd,
    targetUnitsPerClass: 10,
    targetClassValueUsd: VALUE_UNIT_POLICY.defaultClassValueUsd,
    totalTargetClasses: ASSET_CLASSES.length,
    totalTargetValuationUsd: ASSET_CLASSES.length * VALUE_UNIT_POLICY.defaultClassValueUsd,
    accepted,
    rejected,
    realValueStatus: accepted.length ? 'partially-verified' : 'no-verified-value',
    fakeValue: false,
    revenueClaim: false,
    legalOwnershipInference: false
  };
}

export function valuePortfolioTruth() {
  return {
    target: '10 unique AI value units per asset class',
    unitValueUsd: 100_000,
    classValueUsd: 1_000_000,
    classes: ASSET_CLASSES.length,
    totalTargetValuationUsd: ASSET_CLASSES.length * 1_000_000,
    targetIsNotCash: true,
    targetRequiresEvidence: true,
    targetRequiresIndependentValuation: true,
    verifiedValueOnly: true
  };
}
