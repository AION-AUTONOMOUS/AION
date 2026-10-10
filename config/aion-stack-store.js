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
  'deal-rooms': 'aion:stack:deal-rooms:index',
  'customer-orders': 'aion:stack:customer-orders:index',
  'customer-revenue': 'aion:stack:customer-revenue:index',
  'customer-outcomes': 'aion:stack:customer-outcomes:index',
  'teacher-orders': 'aion:stack:teacher-orders:index',
  'teacher-revenue': 'aion:stack:teacher-revenue:index',
  'presale': 'aion:stack:presale:index',
  'customer-leads': 'aion:stack:customer-leads:index',
  'demand-signals': 'aion:stack:demand-signals:index',
  'distressed-opportunities': 'aion:stack:distressed-opportunities:index',
  'global-distressed-opportunities': 'aion:stack:global-distressed-opportunities:index'
};

const FINANCIAL_KEY_PREFIXES = ['customer-orders:', 'customer-revenue:', 'customer-outcome:', 'customer-outcomes:'];
const FINANCIAL_INDEXES = new Set(['customer-orders', 'customer-revenue', 'customer-outcomes']);
const ALLOW_MEMORY_FINANCIAL_TESTS = () =>
  process.env.NODE_ENV === 'test' && process.env.AION_TEST_ALLOW_MEMORY_FINANCIAL_STORE === '1';

function isFinancialKey(key) {
  return FINANCIAL_KEY_PREFIXES.some(start => String(key).startsWith(start));
}

function financialStorageUnavailable(message) {
  return new Error('Durable financial storage unavailable: ' + message);
}

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
  const financial = isFinancialKey(key);
  if (!config()) {
    if (financial && !ALLOW_MEMORY_FINANCIAL_TESTS()) {
      throw financialStorageUnavailable('Redis is not configured for ' + key);
    }
    return memory.get(key) ?? null;
  }
  try {
    const raw = await command(['GET', prefix + key]);
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
  } catch (error) {
    if (financial) throw financialStorageUnavailable('GET failed for ' + key + ': ' + String(error?.message || error));
    console.warn('AION stack store GET degraded to memory:', String(error?.message || error));
    return memory.get(key) ?? null;
  }
}

export async function setJson(key, value) {
  const financial = isFinancialKey(key);
  if (!config()) {
    if (financial && !ALLOW_MEMORY_FINANCIAL_TESTS()) {
      throw financialStorageUnavailable('Redis is not configured for ' + key);
    }
    memory.set(key, value);
    return value;
  }
  try {
    await command(['SET', prefix + key, JSON.stringify(value)]);
  } catch (error) {
    if (financial) throw financialStorageUnavailable('SET failed for ' + key + ': ' + String(error?.message || error));
    console.warn('AION stack store SET degraded to memory:', String(error?.message || error));
  }
  return value;
}

export async function addToIndex(indexName, id) {
  const financial = FINANCIAL_INDEXES.has(indexName);
  if (!config()) {
    if (financial && !ALLOW_MEMORY_FINANCIAL_TESTS()) {
      throw financialStorageUnavailable('Redis is not configured for index ' + indexName);
    }
    // Preserve the legacy memory behavior for non-financial stack indexes.
    return id;
  }
  const index = indexes[indexName];
  if (!index) throw new Error('Unknown stack index: ' + indexName);
  try {
    await command(['SADD', index, id]);
  } catch (error) {
    if (financial) throw financialStorageUnavailable('index write failed for ' + indexName + ': ' + String(error?.message || error));
    console.warn('AION stack store index degraded to memory:', String(error?.message || error));
  }
  return id;
}

export async function listIndexed(indexName) {
  const index = indexes[indexName];
  if (!index) throw new Error('Unknown stack index: ' + indexName);
  const financial = FINANCIAL_INDEXES.has(indexName);
  if (!config()) {
    if (financial && !ALLOW_MEMORY_FINANCIAL_TESTS()) {
      throw financialStorageUnavailable('Redis is not configured for index ' + indexName);
    }
    const prefixKey = indexName + ':';
    return [...memory.entries()].filter(([key]) => key.startsWith(prefixKey)).map(([, value]) => value);
  }
  try {
    const ids = await command(['SMEMBERS', index]);
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const values = await Promise.all(ids.map(id => getJson(indexName + ':' + id)));
    return values.filter(Boolean);
  } catch (error) {
    if (financial) throw financialStorageUnavailable('index read failed for ' + indexName + ': ' + String(error?.message || error));
    console.warn('AION stack store LIST degraded to memory:', String(error?.message || error));
    const prefixKey = indexName + ':';
    return [...memory.entries()].filter(([key]) => key.startsWith(prefixKey)).map(([, value]) => value);
  }
}


// Atomically creates a customer order and adds it to the order index.
const CUSTOMER_ORDER_CREATE_LUA = `
local orderType = redis.call('TYPE', KEYS[1]).ok
local indexType = redis.call('TYPE', KEYS[2]).ok
if orderType ~= 'none' and orderType ~= 'string' then return -1 end
if indexType ~= 'none' and indexType ~= 'set' then return -1 end
if orderType == 'string' then return 0 end
-- Index first: if a later SET fails, readers ignore this missing order and retries can heal it.
redis.call('SADD', KEYS[2], ARGV[2])
redis.call('SET', KEYS[1], ARGV[1])
return 1
`;

export async function commitCustomerOrder(order) {
  if (!order?.id) throw new Error('Invalid customer order');
  const orderKey = 'customer-orders:' + String(order.id);
  if (!config()) {
    if (!ALLOW_MEMORY_FINANCIAL_TESTS()) {
      throw financialStorageUnavailable('Redis is not configured for customer order creation');
    }
    if (memory.has(orderKey)) throw new Error('Customer order ID already exists');
    memory.set(orderKey, order);
    return order;
  }
  let result;
  try {
    result = await command([
      'EVAL', CUSTOMER_ORDER_CREATE_LUA, '2',
      prefix + orderKey, indexes['customer-orders'],
      JSON.stringify(order), String(order.id)
    ]);
  } catch (error) {
    throw financialStorageUnavailable('atomic customer order creation failed: ' + String(error?.message || error));
  }
  if (Number(result) === -1) throw financialStorageUnavailable('customer order or index key has an unexpected Redis type');
  if (Number(result) !== 1) throw new Error('Customer order ID already exists');
  return order;
}

// Atomically writes the order, revenue record and revenue index in Redis.
// PayPal receives a success response only after this script commits successfully.
const CUSTOMER_PAYMENT_COMMIT_LUA = `
local orderType = redis.call('TYPE', KEYS[1]).ok
local revenueType = redis.call('TYPE', KEYS[2]).ok
local indexType = redis.call('TYPE', KEYS[3]).ok
if orderType ~= 'none' and orderType ~= 'string' then
  return cjson.encode({ status = 'storage_type_mismatch', key = 'order' })
end
if revenueType ~= 'none' and revenueType ~= 'string' then
  return cjson.encode({ status = 'storage_type_mismatch', key = 'revenue' })
end
if indexType ~= 'none' and indexType ~= 'set' then
  return cjson.encode({ status = 'storage_type_mismatch', key = 'index' })
end
local orderRaw = redis.call('GET', KEYS[1])
if not orderRaw then return cjson.encode({ status = 'not_found' }) end
local current = cjson.decode(orderRaw)
local eventId = ARGV[3]
local paymentReference = ARGV[4]
if current.paymentStatus == 'confirmed' then
  if current.paymentProvider == 'paypal' and current.paymentReference == paymentReference then
    return cjson.encode({ status = 'duplicate', order = current })
  end
  return cjson.encode({ status = 'different_payment' })
end
local expectedAmount = tonumber(current.amountUsd)
local receivedAmount = tonumber(ARGV[5])
if not expectedAmount or not receivedAmount or math.floor(expectedAmount * 100 + 0.5) ~= math.floor(receivedAmount * 100 + 0.5) then
  return cjson.encode({ status = 'amount_mismatch' })
end
if string.upper(tostring(current.currency or '')) ~= string.upper(ARGV[6]) then
  return cjson.encode({ status = 'currency_mismatch' })
end
local updated = cjson.decode(ARGV[1])
local revenue = cjson.decode(ARGV[2])
if updated.providerEventId ~= eventId or updated.paymentReference ~= paymentReference then
  return cjson.encode({ status = 'invalid_commit_payload' })
end
redis.call('SET', KEYS[2], ARGV[2])
redis.call('SADD', KEYS[3], revenue.id)
redis.call('SET', KEYS[1], ARGV[1])
return cjson.encode({ status = 'confirmed', order = updated })
`;

export async function commitCustomerPayment({ orderId, updatedOrder, revenue, providerEventId, paymentReference, amountUsd, currency }) {
  const orderKey = 'customer-orders:' + String(orderId);
  const revenueKey = 'customer-revenue:' + String(revenue?.id || '');
  const indexKey = indexes['customer-revenue'];
  if (!revenue?.id || !updatedOrder || !providerEventId || !paymentReference) {
    throw new Error('Invalid customer payment commit payload');
  }

  if (!config()) {
    if (!ALLOW_MEMORY_FINANCIAL_TESTS()) {
      throw financialStorageUnavailable('Redis is not configured for payment confirmation');
    }
    const current = memory.get(orderKey);
    if (!current) return null;
    if (current.paymentStatus === 'confirmed') {
      if (current.paymentProvider === 'paypal' && current.paymentReference === paymentReference) return current;
      throw new Error('AION order already confirmed by a different provider payment');
    }
    if (Math.round(Number(current.amountUsd) * 100) !== Math.round(Number(amountUsd) * 100)) {
      throw new Error('verified payment amount does not match the AION order');
    }
    if (String(current.currency).toUpperCase() !== String(currency).toUpperCase()) {
      throw new Error('verified payment currency does not match the AION order');
    }
    memory.set(revenueKey, revenue);
    memory.set(orderKey, updatedOrder);
    return updatedOrder;
  }

  let raw;
  try {
    raw = await command([
      'EVAL', CUSTOMER_PAYMENT_COMMIT_LUA, '3',
      prefix + orderKey, prefix + revenueKey, indexKey,
      JSON.stringify(updatedOrder), JSON.stringify(revenue),
      String(providerEventId), String(paymentReference), String(amountUsd), String(currency)
    ]);
  } catch (error) {
    throw financialStorageUnavailable('atomic payment commit failed: ' + String(error?.message || error));
  }
  let result;
  try { result = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { throw financialStorageUnavailable('atomic payment commit returned an invalid result'); }
  if (!result || typeof result.status !== 'string') {
    throw financialStorageUnavailable('atomic payment commit returned an empty result');
  }
  if (result.status === 'not_found') return null;
  if (result.status === 'different_payment') throw new Error('AION order already confirmed by a different provider payment');
  if (result.status === 'amount_mismatch') throw new Error('verified payment amount does not match the AION order');
  if (result.status === 'currency_mismatch') throw new Error('verified payment currency does not match the AION order');
  if (result.status === 'invalid_commit_payload') throw new Error('Invalid customer payment commit payload');
  if (result.status === 'storage_type_mismatch') {
    throw financialStorageUnavailable('payment commit encountered an unexpected Redis key type: ' + String(result.key || 'unknown'));
  }
  if (result.status !== 'confirmed' && result.status !== 'duplicate') {
    throw financialStorageUnavailable('atomic payment commit failed with status ' + result.status);
  }
  return result.order || updatedOrder;
}
