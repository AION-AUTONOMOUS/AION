import crypto from 'node:crypto';
import { listAssets, verifyAsset } from './aion-global-asset-vault.js';

export const ASSET_ECONOMIC_INTELLIGENCE_VERSION='1.0.0';

function n(v){ const x=Number(v); return Number.isFinite(x)?x:null; }
function sha(v){ return crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex'); }

export async function buildAssetEconomicIntelligence({limit=100}={}){
  const assets=await listAssets(limit);
  const verified=[];
  const rejected=[];
  for(const asset of assets){
    const integrity=await verifyAsset(asset.id);
    if(!integrity.valid){ rejected.push({assetId:asset.id,reason:'registry-integrity-failure'}); continue; }
    const valuation=n(asset.valuation);
    const cashFlow=n(asset.cashFlow);
    verified.push({
      assetId:asset.id,
      assetType:asset.assetType,
      legalOwner:asset.legalOwner,
      jurisdiction:asset.jurisdiction,
      valuation,
      cashFlow,
      annualizedCashFlowYield:valuation && cashFlow!=null ? cashFlow/valuation : null,
      risk:asset.risk ?? null,
      status:asset.status
    });
  }
  const totalValuation=verified.reduce((s,a)=>s+(a.valuation??0),0);
  const knownCashFlow=verified.reduce((s,a)=>s+(a.cashFlow??0),0);
  return {
    version:ASSET_ECONOMIC_INTELLIGENCE_VERSION,
    generatedAt:new Date().toISOString(),
    status:'verified-registry-analysis',
    assetCount:verified.length,
    rejectedCount:rejected.length,
    totalKnownValuation:totalValuation,
    totalKnownCashFlow:knownCashFlow,
    assets:verified,
    rejected,
    fingerprint:sha({verified,rejected,totalValuation,knownCashFlow}),
    guarantees:{noLegalOwnershipInference:true,noFakeValuation:true,noRevenueClaim:true}
  };
}
