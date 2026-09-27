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
    client = createClient({ url });
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
  if (!client) return null;
  const args = command.map((argument) => String(argument));
  return client.sendCommand(args);
}

export async function railwayRedisPing() {
  const client = await getClient();
  if (!client) return null;
  return client.ping();
}
