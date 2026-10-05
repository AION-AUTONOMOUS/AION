import { createClient } from 'redis';

const GLOBAL_KEY = Symbol.for('aion.railway.redis.client');

function getUrl() {
  return String(process.env.REDIS_URL || '').trim();
}

export function hasRailwayRedis() {
  return Boolean(getUrl());
}

export function redisStorageMode() {
  return hasRailwayRedis() ? 'railway-redis' : null;
}

async function getClient() {
  const url = getUrl();
  if (!url) return null;

  let client = globalThis[GLOBAL_KEY];
  if (!client) {
    client = createClient({ url, socket: { connectTimeout: 2500, reconnectStrategy: false } });
    client.on('error', error => {
      console.error('AION Railway Redis client error:', error);
    });
    globalThis[GLOBAL_KEY] = client;
  }

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

export async function railwayRedisCommand(command) {
  const client = await getClient();
  const run = async () => {
  if (!client) return null;

  const [name, ...rawArgs] = command.map(argument => String(argument));
  switch (name) {
    case 'GET':
      return client.get(rawArgs[0]);
    case 'SET':
      return client.set(rawArgs[0], rawArgs[1]);
    case 'SADD':
      return client.sAdd(rawArgs[0], rawArgs.slice(1));
    case 'SMEMBERS':
      return client.sMembers(rawArgs[0]);
    case 'ZADD':
      return client.zAdd(rawArgs[0], [{ score: Number(rawArgs[1]), value: rawArgs[2] }]);
    case 'ZRANGE': {
      const start = Number(rawArgs[1]);
      const stop = Number(rawArgs[2]);
      const options = rawArgs[3] === 'REV' ? { REV: true } : undefined;
      return client.zRange(rawArgs[0], start, stop, options);
    }
    case 'RPUSH':
      return client.rPush(rawArgs[0], rawArgs.slice(1));
    case 'LPUSH':
      return client.lPush(rawArgs[0], rawArgs.slice(1));
    case 'LRANGE':
      return client.lRange(rawArgs[0], Number(rawArgs[1]), Number(rawArgs[2]));
    case 'LREM':
      return client.lRem(rawArgs[0], Number(rawArgs[1]), rawArgs[2]);
    case 'HSET': {
      const values = rawArgs.slice(1);
      const hash = {};
      for (let index = 0; index < values.length; index += 2) hash[values[index]] = values[index + 1];
      return client.hSet(rawArgs[0], hash);
    }
    case 'HGETALL':
      return client.hGetAll(rawArgs[0]);
    case 'BLMOVE': {
      const timeout = Math.max(1, Number(rawArgs[5]) || 1);
      return client.blMove(rawArgs[0], rawArgs[1], rawArgs[2], rawArgs[3], timeout);
    }
    default:
      throw new Error('Unsupported Railway Redis command: ' + name);
  }
  };
  return await Promise.race([run(), new Promise((_, reject) => setTimeout(() => reject(new Error('Redis command timeout')), 3000))]);
}

export async function railwayRedisPing() {
  const client = await getClient();
  if (!client) return null;
  return client.ping();
}
