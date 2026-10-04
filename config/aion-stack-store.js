import { hasRailwayRedis, railwayRedisCommand, redisStorageMode } from './aion-redis.js';

const memory = new Map();
const prefix = 'aion:stack:';
const indexes = {
  assets: 'aion:stack:assets:index',
  robots: 'aion:stack:robots:index',
  plans: 'aion:stack:plans:index',
  cycles: 'aion:stack:cycles:index',
  'enterprise-products': 'aion:stack:enterprise-products:index',
  'service-contracts': 'aion:stack:service-contracts:index',
  'interplanetary-providers': 'aion:stack:interplanetary-providers:index',
  'mars-services': 'aion:stack:mars-services:index',
  'interplanetary-jobs': 'aion:stack:interplanetary-jobs:index',
  'space-payments': 'aion:stack:space-payments:index',
  'intelligence-evidence': 'aion:stack:intelligence-evidence:index',
  'intelligence-products': 'aion:stack:intelligence-products:index',
  'intelligence-metrics': 'aion:stack:intelligence-metrics:index',
  'economic-events': 'aion:stack:economic-events:index',
  'space-rfqs': 'aion:stack:space-rfqs:index',
  'space-commissions': 'aion:stack:space-commissions:index',
  'digital-contracts': 'aion:stack:digital-contracts:index',
  'deal-rooms': 'aion:stack:deal-rooms:index'
};

function config() {
  if (hasRailwayRedis()) return { kind: 'railway' };
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { kind: 'upstash', url, token } : null;
}

export function stackStorageHealth() {
  return { mode: config() ? (redisStorageMode() || 'upstash-redis') : 'memory-fallback', durable: Boolean(config()), configured: Boolean(config()) };
}

async function command(command) {
  const cfg = config();
  if (!cfg) return null;
  if (cfg.kind === 'railway') return railwayRedisCommand(command);
  const response = await fetch(cfg.url, { method: 'POST', headers: { Authorization: 'Bearer ' + cfg.token, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
  const body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { throw new Error('Redis returned a non-JSON response'); }
  if (!response.ok || data.error) throw new Error(data.error || 'Redis request failed');
  return data.result;
}

export async function getJson(key) {
  if (!config()) return memory.get(key) ?? null;
  const raw = await command(['GET', prefix + key]);
  return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
}

export async function setJson(key, value) {
  if (!config()) { memory.set(key, value); return value; }
  await command(['SET', prefix + key, JSON.stringify(value)]);
  return value;
}

export async function addToIndex(indexName, id) {
  if (!config()) return id;
  const index = indexes[indexName];
  if (!index) throw new Error('Unknown stack index: ' + indexName);
  await command(['SADD', index, id]);
  return id;
}

export async function listIndexed(indexName) {
  if (!config()) {
    const prefixKey = indexName + ':';
    return [...memory.entries()].filter(([key]) => key.startsWith(prefixKey)).map(([, value]) => value);
  }
  const index = indexes[indexName];
  if (!index) throw new Error('Unknown stack index: ' + indexName);
  const ids = await command(['SMEMBERS', index]);
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const values = await Promise.all(ids.map(id => getJson(indexName + ':' + id)));
  return values.filter(Boolean);
}
