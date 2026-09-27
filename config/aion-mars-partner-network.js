import crypto from 'node:crypto';
import { addToIndex, listIndexed, setJson } from './aion-stack-store.js';

export const MARS_NETWORK_VERSION='1.0.0';
const PARTNERS=Object.freeze(['NASA','SpaceX','ESA','commercial-provider','research-institution']);
const PLANES=Object.freeze(['earth-orbit','lunar','mars','deep-space']);
function text(v){return String(v??'').trim();}
function id(p){return p+'-'+crypto.randomUUID();}

export function marsNetworkHealth(){return{version:MARS_NETWORK_VERSION,status:'partner-adapter-ready',planes:[...PLANES],partners:[...PARTNERS],
  mars:true,partnerAccess:'authorized-adapter-and-public-data-only',directControl:false,ownershipClaim:false,
  spectrumControl:false,externalMoney:false};}

export function createPartnerAdapter(input={}){
 const partner=text(input.partner);
 if(!PARTNERS.includes(partner))throw new Error('unsupported partner');
 return {id:id('AION-PARTNER'),partner,apiBaseUrl:text(input.apiBaseUrl)||null,
  mode:input.apiBaseUrl?'configured':'adapter-ready',authorization:'required',
  scopes:Array.isArray(input.scopes)?input.scopes.map(text).filter(Boolean):[],
  createdAt:new Date().toISOString()};
}
export async function registerPartnerAdapter(input={}){const x=createPartnerAdapter(input);await setJson('partner-adapter:'+x.id,x);await addToIndex('partner-adapters',x.id);return x;}
export async function listPartnerAdapters(){return listIndexed('partner-adapters');}

export function createMarsService(input={}){
 const name=text(input.name);const priceAion=Number(input.priceAion);
 if(!name)throw new Error('service name required');
 if(!Number.isFinite(priceAion)||priceAion<=0)throw new Error('priceAion must be positive');
 return {id:id('AION-MARS-SVC'),name,priceAion,currency:'AION-CREDIT',
  plane:'mars',delivery:'AI-orchestrated',dataSources:['authorized-partner','public-space-data'],
  humanBenefitMetric:text(input.humanBenefitMetric)||'mission-risk-reduction',
  settlement:'internal-ledger-only',status:'cataloged',createdAt:new Date().toISOString()};
}
export async function registerMarsService(input={}){const x=createMarsService(input);await setJson('mars-service:'+x.id,x);await addToIndex('mars-services',x.id);return x;}
export async function listMarsServices(){return listIndexed('mars-services');}
