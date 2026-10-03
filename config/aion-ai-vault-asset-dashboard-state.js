import { listAssets, verifyAsset } from './aion-global-asset-vault.js';
import { valueStatus } from './aion-ai-vault-live-value-status.js';

export const AI_VAULT_ASSET_STATE_VERSION = '1.0.0';

export async function buildVaultAiAssetState({limit=100}={}) {
  const assets = await listAssets({limit});
  const rows = [];
  for (const asset of assets) {
    let verification;
    try { verification = await verifyAsset(asset.id); }
    catch (error) { verification = {verified:false, reason:error.message}; }
    rows.push({
      assetId: asset.id,
      assetClass: asset.assetClass || asset.type || null,
      verified: verification?.verified === true,
      verificationReason: verification?.reason || null,
      aiValueUnitId: asset.aiValueUnitId || null,
      aiValueUsd: Number(asset.aiValueUsd || 0),
      evidenceRef: asset.evidenceRef || null,
      valuationSource: asset.valuationSource || null
    });
  }
  const verifiedUnits = rows.filter(x =>
    x.verified && x.aiValueUnitId && x.aiValueUsd > 0 &&
    x.evidenceRef && x.valuationSource
  ).map(x => ({
    verified:true, assetId:x.assetId, evidenceRef:x.evidenceRef, valuationSource:x.valuationSource
  }));
  return {
    version: AI_VAULT_ASSET_STATE_VERSION,
    assets: rows,
    verifiedAssetCount: rows.filter(x=>x.verified).length,
    linkedAiValueUnitCount: verifiedUnits.length,
    verifiedValueUsd: verifiedUnits.reduce((s,x)=>s+Number(x.aiValueUsd),0),
    valueStatus: valueStatus({verifiedUnits})
  };
}
