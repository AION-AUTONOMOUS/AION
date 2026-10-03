import { ASSET_CLASSES } from './aion-ai-asset-registry.js';
import { VALUE_UNIT_POLICY } from './aion-ai-vault-value-units.js';

export const AI_VAULT_LIVE_VALUE_STATUS_VERSION='1.0.0';

export function valueStatus({verifiedUnits=[]}={}) {
  const accepted=(Array.isArray(verifiedUnits)?verifiedUnits:[]).filter(x =>
    x && x.verified === true &&
    String(x.assetId||'').trim() &&
    String(x.evidenceRef||'').trim() &&
    String(x.valuationSource||'').trim()
  );
  const verifiedValueUsd=accepted.length*VALUE_UNIT_POLICY.defaultUnitValueUsd;
  const targetUnits=ASSET_CLASSES.length*10;
  const targetValueUsd=targetUnits*VALUE_UNIT_POLICY.defaultUnitValueUsd;
  return {
    version:AI_VAULT_LIVE_VALUE_STATUS_VERSION,
    targetUnits,
    targetValueUsd,
    verifiedUnitCount:accepted.length,
    verifiedValueUsd,
    remainingUnits:Math.max(0,targetUnits-accepted.length),
    remainingTargetValueUsd:Math.max(0,targetValueUsd-verifiedValueUsd),
    status:accepted.length===targetUnits?'VERIFIED_TARGET_REACHED':accepted.length>0?'PARTIALLY_VERIFIED':'NO_VERIFIED_VALUE',
    liveValueRequiresEvidence:true,
    liveValueIsNotCash:true,
    fakeValue:false
  };
}

export function assetClassTarget(assetClassId){
  const exists=ASSET_CLASSES.some(x=>x.id===String(assetClassId));
  if(!exists) throw new Error('unsupported asset class');
  return {
    assetClassId:String(assetClassId),
    targetUnits:10,
    unitValueUsd:100000,
    targetValueUsd:1000000,
    liveValueRequiresEvidence:true
  };
}
