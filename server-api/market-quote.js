import { fetchMarketQuote } from '../config/aion-live-market-data.js';
import { fetchUsTreasuryYield } from '../config/aion-authoritative-market-sources.js';
import { fetchFredObservation } from '../config/aion-fred-market-data.js';

export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({success:false,error:'method_not_allowed'});
  const symbol=String(req.query?.symbol||'').trim();
  const assetType=String(req.query?.assetType||'').trim();
  const source=String(req.query?.source||'provider').trim();
  if(source==='treasury'){try{return res.status(200).json({success:true,source:'US Treasury',record:await fetchUsTreasuryYield({maturity:req.query?.maturity||'10 Yr'})});}catch(error){return res.status(502).json({success:false,error:String(error?.message||error),live:false});}}
  if(source==='fred'){try{const r=await fetchFredObservation({seriesId:req.query?.seriesId});if(!r.available)return res.status(503).json({success:false,...r});return res.status(200).json({success:true,...r});}catch(error){return res.status(502).json({success:false,error:String(error?.message||error),live:false});}}
  if(!symbol||symbol.length>80)return res.status(400).json({success:false,error:'valid_symbol_required'});
  if(!assetType)return res.status(400).json({success:false,error:'assetType_required'});
  try{
    const result=await fetchMarketQuote({symbol,assetId:req.query?.assetId||symbol,assetType,currency:req.query?.currency||'USD'});
    if(!result.available)return res.status(503).json({success:false,error:result.reason,live:false});
    return res.status(200).json({success:true,...result});
  }catch(error){
    return res.status(502).json({success:false,error:String(error?.message||error),live:false});
  }
}
