import crypto from 'node:crypto';
import { addToIndex, getJson, listIndexed, setJson } from './aion-stack-store.js';

export const INTERPLANETARY_VERSION='1.0.0';
const BODIES=Object.freeze(['Earth','Moon','Mars']);
const PROVIDERS=Object.freeze(['NASA','SpaceX','commercial-provider','ground-network','orbital-relay']);
const SERVICES=Object.freeze(['mars-data','delay-tolerant-comms','mission-planning','navigation','earth-observation','science-compute']);

function text(v){return String(v??'').trim();}
function id(p){return p+'-'+crypto.randomUUID();}

export function interplanetaryHealth(){return{
 version:INTERPLANETARY_VERSION,status:'interplanetary-ready',bodies:[...BODIES],providers:[...PROVIDERS],services:[...SERVICES],
 integration:'authorized-adapter-only',marsOperations:'simulation-and-data-services',spacecraftCommand:false,
 spectrumInterference:false,externalMoney:false,mainnet:false,delayTolerant:true
};}

export function createProviderAdapter(input={}){
 const name=text(input.name),type=text(input.type)||'commercial-provider';
 if(!name)throw new Error('provider name required');
 if(!PROVIDERS.includes(type))throw new Error('invalid provider type');
 return {id:id('AION-INTERPLANETARY-PROVIDER'),name,type,apiBaseUrl:text(input.apiBaseUrl)||null,
  authorization:'required',status:input.apiBaseUrl?'adapter-configured':'adapter-ready',
  capabilities:Array.isArray(input.capabilities)?input.capabilities.map(text).filter(Boolean):[],
  directControl:false,createdAt:new Date().toISOString()};
}
export async function registerProviderAdapter(input={}){const x=createProviderAdapter(input);await setJson('interplanetary-provider:'+x.id,x);await addToIndex('interplanetary-providers',x.id);return x;}
export async function listProviderAdapters(){return listIndexed('interplanetary-providers');}

export function createMarsService(input={}){
 const name=text(input.name),service=text(input.service);
 if(!name)throw new Error('service name required');
 if(!SERVICES.includes(service))throw new Error('invalid service');
 const priceAion=Number(input.priceAion);
 if(!Number.isFinite(priceAion)||priceAion<=0)throw new Error('priceAion must be positive');
 return {id:id('AION-MARS-SVC'),name,service,priceAion,currency:'AION-CREDIT',
  route:'Earth-Mars',delivery:'AI-orchestrated-delay-tolerant',settlement:'internal-ledger-only',
  commandAccess:false,status:'cataloged',createdAt:new Date().toISOString()};
}
export async function registerMarsService(input={}){const x=createMarsService(input);await setJson('mars-service:'+x.id,x);await addToIndex('mars-services',x.id);return x;}
export async function listMarsServices(){return listIndexed('mars-services');}

export function createInterplanetaryJob(input={}){
 const serviceId=text(input.serviceId),objective=text(input.objective);
 if(!serviceId||!objective)throw new Error('serviceId and objective required');
 return {id:id('AION-IP-JOB'),serviceId,objective,origin:text(input.origin)||'Earth',
  destination:text(input.destination)||'Mars',status:'planned',transport:'delay-tolerant',
  execution:'authorized-adapter-only',commandAccess:false,createdAt:new Date().toISOString()};
}
export async function saveInterplanetaryJob(x){await setJson('ip-job:'+x.id,x);await addToIndex('interplanetary-jobs',x.id);return x;}
export async function listInterplanetaryJobs(){return listIndexed('interplanetary-jobs');}

export async function getProviderAdapter(idValue){return getJson('interplanetary-provider:'+text(idValue));}
