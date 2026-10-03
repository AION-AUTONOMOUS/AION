import { listAssets, verifyAsset } from './aion-global-asset-vault.js';
import { valueStatus } from './aion-ai-vault-live-value-status.js';

export const AI_VAULT_ASSET_STATE_VERSION = '2.0.0';

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
      valuationSource: asset.valuationSource || null,
      intelligenceAsset: asset.intelligenceAsset || null,
      intelligenceAssetEligible: Boolean(asset.intelligenceAsset?.vaultEligibility === true)
    });
  }
  const verifiedIntelligenceAssets = rows.filter(x =>
    x.verified && x.intelligenceAssetEligible &&
    x.intelligenceAsset?.verified === true &&
    x.intelligenceAsset?.fingerprint &&
    x.evidenceRef && x.valuationSource
  );
  const verifiedIntelligenceValueUsd = verifiedIntelligenceAssets.reduce((sum,x) =>
    sum + Number(x.intelligenceAsset?.valuation?.valueUsd || x.aiValueUsd || 0), 0
  );
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
    verifiedIntelligenceAssetCount: verifiedIntelligenceAssets.length,
    verifiedIntelligenceValueUsd,
    intelligenceAssetStatus: verifiedIntelligenceAssets.length > 0 ? 'VERIFIED' : 'NO_VERIFIED_INTELLIGENCE_ASSETS',
    valueStatus: valueStatus({verifiedUnits})
  };
}
