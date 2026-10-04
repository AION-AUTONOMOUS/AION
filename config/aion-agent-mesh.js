import crypto from 'node:crypto';
import { hasRailwayRedis, railwayRedisCommand } from './aion-redis.js';

export const MESH_VERSION = '1.0.0';
export const LOGICAL_AGENT_CAPACITY = 1_000_000;
export const SHARD_COUNT = 4096;
const NODE_PREFIX='aion:mesh:node:';
const SHARD_PREFIX='aion:mesh:shard:';
const NODE_INDEX='aion:mesh:nodes';
const TTL_SECONDS=90;

function now(){return new Date().toISOString();}
function nodeId(){return String(process.env.AION_MESH_NODE_ID||('node-'+crypto.randomUUID())).trim();}

export function meshHealth(){
  return {
    version:MESH_VERSION,
    status:hasRailwayRedis()?'ready':'not-ready',
    logicalAgentCapacity:LOGICAL_AGENT_CAPACITY,
    shardCount:SHARD_COUNT,
    scheduling:'deterministic-sharding + lease-based workers',
    executionModel:'logical agents are mapped onto available worker nodes; concurrency is bounded by real compute/provider capacity',
    unlimitedNodes:'supported by protocol, subject to infrastructure/provider limits',
    durableRegistry:hasRailwayRedis()
  };
}

export function shardForAgent(agentNumber){
  const n=Math.max(0,Math.floor(Number(agentNumber)||0));
  return n % SHARD_COUNT;
}

export function logicalAgent(agentNumber){
  const n=Math.max(0,Math.floor(Number(agentNumber)||0));
  if(n>=LOGICAL_AGENT_CAPACITY) throw new Error('agent number exceeds mesh capacity');
  const shard=shardForAgent(n);
  return {number:n,id:'AION-MESH-'+String(n+1).padStart(7,'0'),shard};
}

export async function registerNode(input={}){
  if(!hasRailwayRedis()) throw new Error('Mesh requires durable Redis');
  const id=String(input.nodeId||nodeId()).trim();
  const record={
    nodeId:id,
    region:String(input.region||process.env.RAILWAY_REPLICA_REGION||'unknown'),
    capacity:Math.max(1,Number(input.capacity)||1),
    capabilities:Array.isArray(input.capabilities)?input.capabilities.map(String):['general'],
    updatedAt:now()
  };
  await railwayRedisCommand(['HSET',NODE_PREFIX+id,'data',JSON.stringify(record),'expiresAt',String(Date.now()+TTL_SECONDS*1000)]);
  await railwayRedisCommand(['SADD',NODE_INDEX,id]);
  return record;
}

export async function listNodes(){
  if(!hasRailwayRedis()) return [];
  const ids=await railwayRedisCommand(['SMEMBERS',NODE_INDEX]);
  const out=[];
  for(const id of (Array.isArray(ids)?ids:[])){
    const raw=await railwayRedisCommand(['HGET',NODE_PREFIX+id,'data']);
    if(raw) out.push(JSON.parse(raw));
  }
  return out;
}

export async function heartbeatNode(input={}){
  return registerNode(input);
}

export function shardPlan(){
  const groups=Math.min(SHARD_COUNT,LOGICAL_AGENT_CAPACITY);
  return Array.from({length:groups},(_,shard)=>({
    shard,
    firstAgent:shard,
    stride:SHARD_COUNT,
    logicalAgents:Math.floor((LOGICAL_AGENT_CAPACITY-1-shard)/SHARD_COUNT)+1
  }));
}

export async function meshStatus(){
  const nodes=await listNodes();
  const capacity=nodes.reduce((sum,n)=>sum+Math.max(0,Number(n.capacity)||0),0);
  return {
    ...meshHealth(),
    activeNodes:nodes.length,
    declaredWorkerCapacity:capacity,
    nodes
  };
}
