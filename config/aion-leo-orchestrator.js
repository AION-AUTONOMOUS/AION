import crypto from 'node:crypto';
import { getJson, setJson, addToIndex, listIndexed } from './aion-stack-store.js';

export const LEO_ORCHESTRATOR_VERSION='1.0.0';

const PROVIDERS=Object.freeze([
 {id:'celestrak',name:'CelesTrak GP/SATCAT',mode:'public-orbit-data',credentials:false},
 {id:'noaa-swpc',name:'NOAA SWPC',mode:'public-operational-data',credentials:false},
 {id:'copernicus',name:'Copernicus Data Space',mode:'public-earth-observation',credentials:false},
 {id:'commercial-leo',name:'Commercial LEO Connectivity Provider',mode:'authorized-commercial-api',credentials:true}
]);

function text(v){return String(v??'').trim();}
function id(p){return p+'-'+crypto.randomUUID();}

export function leoOrchestratorHealth(){
 return {version:LEO_ORCHESTRATOR_VERSION,status:'operational-data-ready',providers:PROVIDERS.length,
  publicProviders:3,commercialAdapters:1,realData:true,spacecraftControl:false,
  spectrumInterference:false,externalMoney:false,mainnet:false,credentialsRequired:['commercial-leo'],
  routing:'policy-and-evidence-driven'};
}
export function listLeoProviders(){return PROVIDERS.map(x=>({...x}));}

async function fetchJson(url, options={}){
 const response=await fetch(url,{headers:{accept:'application/json',...(options.headers||{})},...options});
 if(!response.ok)throw new Error('LEO provider request failed: '+response.status);
 return response.json();
}

export async function discoverLeoAssets(input={}){
 const group=text(input.group)||'active';
 const max=Math.min(Math.max(Number(input.max)||25,1),100);
 const url='https://celestrak.org/NORAD/elements/gp.php?GROUP='+encodeURIComponent(group)+'&FORMAT=JSON';
 const data=await fetchJson(url);
 return {provider:'CelesTrak',group,retrievedAt:new Date().toISOString(),count:Math.min(data.length,max),data:data.slice(0,max)};
}

export async function getLeoSpaceWeather(){
 const data=await fetchJson('https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json');
 return {provider:'NOAA SWPC',retrievedAt:new Date().toISOString(),data};
}

export async function discoverEarthObservation(input={}){
 const body={collections:['sentinel-2-l2a'],limit:Math.min(Math.max(Number(input.limit)||5,1),20)};
 if(input.datetime) body.datetime=text(input.datetime);
 const response=await fetch('https://stac.dataspace.copernicus.eu/v1/search',{method:'POST',headers:{'content-type':'application/json',accept:'application/geo+json'},body:JSON.stringify(body)});
 if(!response.ok)throw new Error('Copernicus STAC request failed: '+response.status);
 return {provider:'Copernicus Data Space',retrievedAt:new Date().toISOString(),data:await response.json()};
}

export async function routeLeoJob(input={}){
 const objective=text(input.objective);
 if(!objective)throw new Error('objective required');
 const sources=Array.isArray(input.sources)?input.sources.map(text).filter(Boolean):['orbit','space-weather','earth-observation'];
 const route={id:id('AION-LEO-ROUTE'),objective,sources,
  providerPlan:sources.map(source=>source==='orbit'?'celestrak':source==='space-weather'?'noaa-swpc':source==='earth-observation'?'copernicus':'commercial-leo'),
  commercialFallback:'credentials-required',status:'planned',createdAt:new Date().toISOString(),
  guarantees:{realDataOnly:true,noSpacecraftCommand:true,noFabricatedAccess:true}};
 await setJson('leo-route:'+route.id,route); await addToIndex('leo-routes',route.id); return route;
}
export async function listLeoRoutes(){return listIndexed('leo-routes');}
export async function getLeoRoute(idValue){return getJson('leo-route:'+text(idValue));}
