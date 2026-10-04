import { createMarketPriceRecord } from './aion-market-pricing.js';

export const MARKET_DATA_PROVIDER_ENV='AION_MARKET_DATA_PROVIDER_URL';

export async function fetchMarketQuote(input={}) {
  const baseUrl=String(process.env[MARKET_DATA_PROVIDER_ENV]||'').trim();
  if(!baseUrl) return {available:false,reason:'market-data-provider-not-configured',live:false};
  const symbol=String(input.symbol||'').trim();
  if(!symbol) throw new Error('symbol required');
  const url=new URL('/quote',baseUrl);
  url.searchParams.set('symbol',symbol);
  const response=await fetch(url,{headers:{Accept:'application/json'}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error('market-data-provider HTTP '+response.status);
  const record=createMarketPriceRecord({
    assetId:input.assetId||symbol,
    assetType:input.assetType,
    marketPrice:data.marketPrice ?? data.price,
    currency:data.currency||input.currency||'USD',
    quotedAt:data.quotedAt||data.timestamp,
    priceSource:data.priceSource||data.sourceType,
    sourceRef:data.sourceRef||data.source,
    sourceSnapshotHash:data.sourceSnapshotHash||null
  });
  return {available:true,live:true,record};
}
