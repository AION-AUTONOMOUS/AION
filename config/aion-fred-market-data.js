import crypto from 'node:crypto';

export const FRED_API_KEY_ENV='FRED_API_KEY';

export async function fetchFredObservation({seriesId}={}) {
  const key=String(process.env[FRED_API_KEY_ENV]||'').trim();
  if(!key)return {available:false,reason:'fred-api-key-not-configured',live:false};
  if(!seriesId)throw new Error('seriesId required');
  const url=new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.set('series_id',seriesId);
  url.searchParams.set('api_key',key);
  url.searchParams.set('file_type','json');
  url.searchParams.set('sort_order','desc');
  url.searchParams.set('limit','1');
  const response=await fetch(url,{headers:{Accept:'application/json'}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('FRED HTTP '+response.status);
  const obs=data.observations?.[0];
  const value=Number(obs?.value);
  if(!obs||!Number.isFinite(value))return {available:false,reason:'fred-observation-not-found',live:false};
  const snapshotHash=crypto.createHash('sha256').update(JSON.stringify(obs)).digest('hex');
  return {available:true,live:true,record:{
    seriesId,
    value,
    date:obs.date,
    source:'FRED',
    sourceRef:'https://api.stlouisfed.org/fred/series/observations',
    sourceSnapshotHash:snapshotHash,
    verified:true
  }};
}
