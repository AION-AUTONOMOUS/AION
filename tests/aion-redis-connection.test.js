import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const redisUrl = process.env.AION_TEST_REDIS_URL;

test('Redis wrapper shares one connection attempt across concurrent cold-start commands', {
  skip: !redisUrl && 'AION_TEST_REDIS_URL is required; run through the Redis integration workflow'
}, async () => {
  process.env.REDIS_URL = redisUrl;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;

  const clientKey = Symbol.for('aion.railway.redis.client');
  const connectKey = Symbol.for('aion.railway.redis.connect-promise');
  const oldClient = globalThis[clientKey];
  if (oldClient?.isOpen) await oldClient.quit();
  delete globalThis[clientKey];
  delete globalThis[connectKey];

  const { railwayRedisCommand } = await import('../config/aion-redis.js');
  const suffix = crypto.randomUUID();
  const results = await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      railwayRedisCommand(['GET', 'aion:redis-cold-start-test:' + suffix + ':' + index])
    )
  );

  assert.deepEqual(results, Array(12).fill(null));
  const client = globalThis[clientKey];
  assert.ok(client?.isOpen, 'shared Redis connection should remain open after concurrent cold start');

  await client.quit();
  delete globalThis[clientKey];
  delete globalThis[connectKey];
});
