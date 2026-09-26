const memory = new Map();
const prefix = 'aion:stack:';
const indexes = {
  assets: 'aion:stack:assets:index',
  robots: 'aion:stack:robots:index',
  plans: 'aion:stack:plans:index'
};

function config() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

export function stackStorageHealth() {
  return {
    mode: config() ? 'upstash-redis' : 'memory-fallback',
    durable: Boolean(config()),
    configured: Boolean(config())
  };
}

async function command(command) {
  const cfg = config();
  if (!cfg) return null;
  const response = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + cfg.token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Redis returned a non-JSON response'); }
  if (!response.ok || data.error) throw new Error(data.error || 'Redis request failed');
  return data.result;
}

export async function getJson(key) {
  if (!config()) return memory.get(key) ?? null;
  const raw = await command(['GET', prefix + key]);
  return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
}

export async function setJson(key, value) {
  if (!config()) {
    memory.set(key, value);
    return value;
  }
  await command(['SET', prefix + key, JSON.stringify(value)]);
  return value;
}

export async function addToIndex(indexName, id) {
  if (!config()) return id;
  await command(['SADD', indexes[indexName], id]);
  return id;
}

export async function listIndexed(indexName) {
  if (!config()) {
    const prefixKey = indexName + ':';
    return [...memory.entries()]
      .filter(([key]) => key.startsWith(prefixKey))
      .map(([, value]) => value);
  }
  const ids = await command(['SMEMBERS', indexes[indexName]]);
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const values = await Promise.all(ids.map(id => getJson(indexName + ':' + id)));
  return values.filter(Boolean);
}
