import { SATELLITE_PROVIDER_CONFIG, satelliteProviderHealth } from '../config/aion-satellite-providers.js';
const provider = SATELLITE_PROVIDER_CONFIG.sentinelHub;
function credentials() {
  const clientId=String(process.env.SENTINEL_HUB_CLIENT_ID||'').trim(), clientSecret=String(process.env.SENTINEL_HUB_CLIENT_SECRET||'').trim();
  if(!clientId||!clientSecret) throw new Error('Sentinel Hub credentials are not configured');
  return {clientId,clientSecret};
}
async function token() {
  const c=credentials();
  const body=new URLSearchParams({grant_type:'client_credentials',client_id:c.clientId,client_secret:c.clientSecret});
  const r=await fetch(provider.tokenUrl,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
  const d=await r.json().catch(()=>null);
  if(!r.ok||!d?.access_token) throw new Error('Sentinel Hub authentication failed: '+(d?.error_description||r.statusText));
  return d.access_token;
}
function bbox(v){if(!Array.isArray(v)||v.length!==4||v.some(x=>!Number.isFinite(Number(x))))throw new Error('bbox must be [minLon,minLat,maxLon,maxLat]');const b=v.map(Number);if(b[0]>=b[2]||b[1]>=b[3])throw new Error('bbox bounds are invalid');return b;}
function times(a,b){const x=new Date(a),y=new Date(b);if(Number.isNaN(x.valueOf())||Number.isNaN(y.valueOf())||x>=y)throw new Error('valid from/to ISO dates are required');return {from:x.toISOString(),to:y.toISOString()};}
async function request(path,options={}){const t=await token();const r=await fetch(provider.baseUrl+path,{...options,headers:{Authorization:'Bearer '+t,Accept:'application/json',...(options.headers||{})}});const raw=await r.text();let d=null;try{d=raw?JSON.parse(raw):null}catch{d={raw}}if(!r.ok)throw new Error('Sentinel Hub API '+r.status+': '+(d?.error?.message||d?.message||r.statusText));return d;}
export function sentinelHubHealth(){return satelliteProviderHealth();}
export async function searchSentinelCatalog({bbox:bb,from,to,collection='sentinel-2-l2a',limit=5}={}){const b=bbox(bb),t=times(from,to),l=Math.max(1,Math.min(Number(limit)||5,100));return request(provider.catalogPath,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bbox:b,datetime:t.from+'/'+t.to,collections:[collection],limit:l})});}
export async function processSentinelImage({bbox:bb,from,to,collection='sentinel-2-l2a',width=1024,height=1024,maxCloudCoverage=35}={}){const b=bbox(bb),t=times(from,to),w=Math.max(64,Math.min(Number(width)||1024,2048)),h=Math.max(64,Math.min(Number(height)||1024,2048)),cloud=Math.max(0,Math.min(Number(maxCloudCoverage)||35,100));
const evalscript="//VERSION=3\nfunction setup(){return {input:[{bands:['B04','B03','B02','SCL','dataMask']}],output:{bands:4,sampleType:'AUTO'}};}\nfunction evaluatePixel(sample){if(sample.dataMask===0)return [0,0,0,0];const c=[3,8,9,10].includes(sample.SCL);if(c)return [0.05,0.05,0.05,0.15];return [2.5*sample.B04,2.5*sample.B03,2.5*sample.B02,1];}";
return request(provider.processPath,{method:'POST',headers:{'Content-Type':'application/json',Accept:'image/png'},body:JSON.stringify({input:{bounds:{properties:{crs:'http://www.opengis.net/def/crs/OGC/1.3/CRS84'},bbox:b},data:[{type:collection,dataFilter:{timeRange:t,maxCloudCoverage:cloud}}]},output:{width:w,height:h,responses:[{identifier:'default',format:{type:'image/png'}}]},evalscript})});}
export async function runSentinelMission(input={}){const catalog=await searchSentinelCatalog(input);const image=await processSentinelImage(input);return {provider:'sentinel-hub',source:'Copernicus Data Space Ecosystem',mock:false,evidence:{catalogFeatures:Array.isArray(catalog?.features)?catalog.features.length:0,collection:input.collection||'sentinel-2-l2a',bbox:input.bbox,from:input.from,to:input.to},image};}
