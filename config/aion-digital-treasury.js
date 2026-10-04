import crypto from 'node:crypto';
import { hasRailwayRedis, railwayRedisCommand } from './aion-redis.js';

export const TREASURY_VERSION='1.0.0';
const INDEX='aion:treasury:index';
const ENTRY=id=>'aion:treasury:entry:'+id;
const HEAD='aion:treasury:head';

function now(){return new Date().toISOString();}
function canonical(v){
  if(Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
  if(v&&typeof v==='object') return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
function hash(v){return crypto.createHash('sha256').update(canonical(v)).digest('hex');}

export function treasuryHealth(){
  return {
    version:TREASURY_VERSION,
    status:hasRailwayRedis()?'durable-ledger':'not-ready',
    ledger:'append-only hash-chained',
    custody:'external regulated financial custodian required for real funds',
    autonomousMovement:'disabled-by-default',
    ownerWithdrawal:'explicit approval boundary',
    audit:'cryptographic record integrity'
  };
}

export async function recordTreasuryEntry(input={}){
  if(!hasRailwayRedis()) throw new Error('Treasury requires durable Redis');
  const type=String(input.type||'observation').trim();
  const amount=Number(input.amount);
  if(!Number.isFinite(amount)||amount<0) throw new Error('valid non-negative amount required');
  const currency=String(input.currency||'USD').trim().toUpperCase();
  const previousHash=String(await railwayRedisCommand(['GET',HEAD])||'');
  const entry={
    id:'AION-TREASURY-'+crypto.randomUUID(),
    type,
    amount,
    currency,
    accountRef:String(input.accountRef||'').trim()||null,
    externalReference:String(input.externalReference||'').trim()||null,
    actor:String(input.actor||'aion-system').trim(),
    approvalRequired:Boolean(input.approvalRequired??(type==='transfer'||type==='withdrawal')),
    status:String(input.status||'recorded'),
    createdAt:now()
  };
  const recordHash=hash({entry,previousHash});
  const record={...entry,previousHash,recordHash};
  await railwayRedisCommand(['HSET',ENTRY(record.id),'data',JSON.stringify(record)]);
  await railwayRedisCommand(['LPUSH',INDEX,record.id]);
  await railwayRedisCommand(['SET',HEAD,recordHash]);
  return record;
}

export async function listTreasuryEntries(limit=100){
  if(!hasRailwayRedis()) throw new Error('Treasury storage unavailable');
  const ids=await railwayRedisCommand(['LRANGE',INDEX,'0',String(Math.max(0,Math.min(Number(limit)||100,500)-1))]);
  const out=[];
  for(const id of (Array.isArray(ids)?ids:[])){
    const raw=await railwayRedisCommand(['HGET',ENTRY(id),'data']);
    if(raw) out.push(JSON.parse(raw));
  }
  return out;
}

export async function verifyTreasuryEntry(id){
  if(!hasRailwayRedis()) throw new Error('Treasury storage unavailable');
  const raw=await railwayRedisCommand(['HGET',ENTRY(String(id)),'data']);
  if(!raw) return {valid:false,reason:'not_found'};
  const record=JSON.parse(raw);
  const {recordHash,previousHash,...rest}=record;
  const expected=hash({entry:rest,previousHash});
  return {valid:expected===recordHash,entryId:id,recordHash,expectedHash:expected,previousHash};
}
