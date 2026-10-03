import crypto from 'node:crypto';
import { hasRailwayRedis, railwayRedisCommand } from './aion-redis.js';

export const ASSET_VAULT_VERSION = '1.0.0';
const INDEX = 'aion:asset-vault:index';
const ITEM = id => 'aion:asset-vault:asset:' + id;
const HEAD = 'aion:asset-vault:head';

function now(){ return new Date().toISOString(); }
function canonical(value){ return JSON.stringify(value, Object.keys(value).sort()); }
function hash(value){ return crypto.createHash('sha256').update(canonical(value)).digest('hex'); }

function requiredString(value,name){
  const v=String(value??'').trim();
  if(!v) throw new Error(name+' required');
  return v;
}

export function assetVaultHealth(){
  return {
    version: ASSET_VAULT_VERSION,
    status: hasRailwayRedis() ? 'durable' : 'not-ready',
    storage: hasRailwayRedis() ? 'Railway Redis' : 'unavailable',
    custody: 'external-regulated-custodian-or-legal-owner',
    registry: 'cryptographically-hashed',
    fakeOwnership: false,
    immutableClaim: 'cryptographic integrity does not itself create legal ownership'
  };
}

export async function registerAsset(input={}){
  if(!hasRailwayRedis()) throw new Error('Asset vault requires durable Redis storage');
  const id = 'AION-ASSET-' + crypto.randomUUID();
  const previousHash = String(await railwayRedisCommand(['GET',HEAD]) || '');
  const asset = {
    id,
    assetType: requiredString(input.assetType,'assetType'),
    legalOwner: requiredString(input.legalOwner,'legalOwner'),
    jurisdiction: requiredString(input.jurisdiction,'jurisdiction'),
    custodian: String(input.custodian||'').trim() || null,
    externalReference: String(input.externalReference||'').trim() || null,
    currency: String(input.currency||'').trim() || null,
    quantity: input.quantity ?? null,
    valuation: input.valuation ?? null,
    evidenceRefs: Array.isArray(input.evidenceRefs) ? input.evidenceRefs.map(String) : [],
    rights: Array.isArray(input.rights) ? input.rights.map(String) : [],
    risk: input.risk ?? null,
    cashFlow: input.cashFlow ?? null,
    status: 'registered',
    createdAt: now()
  };
  const recordHash = hash({asset,previousHash});
  const record = { ...asset, previousHash, recordHash };
  await railwayRedisCommand(['HSET',ITEM(id),'data',JSON.stringify(record),'hash',recordHash]);
  await railwayRedisCommand(['LPUSH',INDEX,id]);
  await railwayRedisCommand(['SET',HEAD,recordHash]);
  return record;
}

export async function getAsset(id){
  if(!hasRailwayRedis()) throw new Error('Asset vault storage unavailable');
  const raw=await railwayRedisCommand(['HGET',ITEM(requiredString(id,'id')),'data']);
  if(!raw) return null;
  return JSON.parse(raw);
}

export async function listAssets(limit=100){
  if(!hasRailwayRedis()) throw new Error('Asset vault storage unavailable');
  const ids=await railwayRedisCommand(['LRANGE',INDEX,'0',String(Math.max(0,Math.min(Number(limit)||100,500)-1))]);
  const list=Array.isArray(ids)?ids:[];
  const out=[];
  for(const id of list){
    const item=await getAsset(id);
    if(item) out.push(item);
  }
  return out;
}

export async function verifyAsset(id){
  const asset=await getAsset(id);
  if(!asset) return {valid:false,reason:'not_found'};
  const {recordHash,previousHash,...rest}=asset;
  const expected=hash({asset:rest,previousHash});
  return {valid:expected===recordHash,assetId:id,recordHash,expectedHash:expected,previousHash};
}
