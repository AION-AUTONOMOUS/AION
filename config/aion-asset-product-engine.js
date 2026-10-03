import crypto from 'node:crypto';
import { buildAssetEconomicIntelligence } from './aion-asset-economic-intelligence.js';

export const ASSET_PRODUCT_ENGINE_VERSION='1.0.0';

function sha(v){return crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');}

export async function buildAssetIntelligenceProduct({limit=100}={}){
  const intelligence=await buildAssetEconomicIntelligence({limit});
  const product={
    id:'AION-ASSET-PRODUCT-'+crypto.randomUUID(),
    type:'verified-asset-intelligence',
    status:intelligence.assetCount>0?'publishable-internal':'no-data',
    sourceFingerprint:intelligence.fingerprint,
    assetCount:intelligence.assetCount,
    knownValuation:intelligence.totalKnownValuation,
    knownCashFlow:intelligence.totalKnownCashFlow,
    rejectedCount:intelligence.rejectedCount,
    priceAion:250,
    pricingBasis:'service-price-not-claimed-revenue',
    customerStatus:'no-customer-purchase',
    createdAt:new Date().toISOString()
  };
  return {...product,fingerprint:sha(product),guarantees:{noFakeRevenue:true,noLegalOwnershipInference:true}};
}
