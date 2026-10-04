import crypto from 'node:crypto';
import { createMarketPriceRecord } from './aion-market-pricing.js';

export const AUTHORITATIVE_MARKET_SOURCES=Object.freeze({
  treasury:'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml'
});

export async function fetchUsTreasuryYield({maturity='10 Yr'}={}) {
  const url='https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=all&page=1';
  const response=await fetch(url,{headers:{Accept:'application/xml,text/xml'}});
  if(!response.ok) throw new Error('US Treasury data HTTP '+response.status);
  const xml=await response.text();
  const escaped=maturity.replace(/[.*+?^()|[\\]\\\\]/g,'\\\\$&');
  const tagRe=new RegExp('<'+escaped+'>([^<]+)</');
  const dateRe=/<d:NEW_DATE>([^<]+)</;
  for(const entry of xml.split('<entry>').slice(1)) {
    const tag=tagRe.exec(entry);
    const date=dateRe.exec(entry);
    if(tag&&date&&tag[1]&&tag[1]!=='N/A') {
      const marketPrice=Number(tag[1]);
      if(!Number.isFinite(marketPrice)) continue;
      const snapshotHash=crypto.createHash('sha256').update(entry).digest('hex');
      return createMarketPriceRecord({
        assetId:'US-TREASURY-CMT-'+maturity.replace(/\\s+/g,'-').toUpperCase(),
        assetType:'treasury-security',
        marketPrice,
        currency:'USD',
        quotedAt:date[1],
        priceSource:'issuer',
        sourceRef:AUTHORITATIVE_MARKET_SOURCES.treasury,
        sourceSnapshotHash:snapshotHash
      });
    }
  }
  return {available:false,reason:'treasury_quote_not_found'};
}
