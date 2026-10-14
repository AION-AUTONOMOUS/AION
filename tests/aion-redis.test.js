import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRailwayRedis, redisStorageMode } from '../config/aion-redis.js';

test('Redis configuration health reflects the configured URL without exposing secrets', () => {
  const oldUrl = process.env.REDIS_URL;
  try {
    delete process.env.REDIS_URL;
    assert.equal(hasRailwayRedis(), false);
    assert.equal(redisStorageMode(), null);
    process.env.REDIS_URL = 'redis://example.invalid:6379';
    assert.equal(hasRailwayRedis(), true);
    assert.equal(redisStorageMode(), 'railway-redis');
  } finally {
    if (oldUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = oldUrl;
  }
});
