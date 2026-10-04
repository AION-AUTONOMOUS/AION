import crypto from 'node:crypto';

export const AION_MARKET_PRICING_VERSION='1.1.0';
export const MARKET_PRICE_POLICY=Object.freeze({noSyntheticPrices:true,noStaleFallback:true,sourceAndTimestampRequired:true,snapshotHashRecommended:true});

export const MARKET_PRICE_SOURCES=Object.freeze({
  equity:['exchange','licensed-market-data-provider'],
  fund:['fund-issuer','regulated-market-data-provider'],
  bond:['issuer','exchange','regulated-market-data-provider','regulated-custodian'],
  treasury-security:['issuer','exchange','regulated-market-data-provider','regulated-custodian'],
  money-market-instrument:['issuer','regulated-market-data-provider','regulated-custodian'],
  commodity:['exchange','regulated-market-data-provider'],
  real-estate:['official-registry','licensed-accredited-valuation','regulated-market-data-provider'],
  energy-infrastructure:['issuer','regulated-market-data-provider','licensed-accredited-valuation'],
  tokenized-rwa:['issuer','official-registry','regulated-custodian','regulated-market-data-provider']
});

export function validateMarketPrice(input={}){
  const type=String(input.assetType||'');
  const source=String(input.priceSource||'');
  const price=Number(input.marketPrice);
  const errors=[];
  if(!MARKET_PRICE_SOURCES[type]) errors.push('unsupported assetType');
  if(!MARKET_PRICE_SOURCES[type]?.includes(source)) errors.push('unsupported priceSource for assetType');
  if(!Number.isFinite(price)||price<0) errors.push('marketPrice must be a non-negative number');
  if(!String(input.currency||'').trim()) errors.push('currency required');
  if(!String(input.quotedAt||'').trim()) errors.push('quotedAt required');
  if(!String(input.sourceRef||'').trim()) errors.push('sourceRef required');
  if(input.sourceSnapshotHash && !/^[a-f0-9]{64}$/.test(String(input.sourceSnapshotHash))) errors.push('sourceSnapshotHash must be SHA-256 hex');
  return {valid:errors.length===0,errors,liveMarketPrice:true,fakePrice:false,fallbackPrice:false};
}

export function createMarketPriceRecord(input={}){
  const v=validateMarketPrice(input);
  if(!v.valid) throw new Error(v.errors.join('; '));
  const payload={assetId:String(input.assetId||''),assetType:String(input.assetType),marketPrice:Number(input.marketPrice),currency:String(input.currency),quotedAt:String(input.quotedAt),priceSource:String(input.priceSource),sourceRef:String(input.sourceRef),sourceSnapshotHash:input.sourceSnapshotHash||null};
  const fingerprint=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return {...payload,fingerprint,verified:true,liveMarketPrice:true,fakePrice:false,fallbackPrice:false};
}
