import test from 'node:test';
import assert from 'node:assert/strict';
import { satelliteProviderHealth } from '../config/aion-satellite-providers.js';
import { processSentinelImage } from '../server-api/space-sentinel.js';

test('Sentinel Hub adapter is authorization-gated without credentials', () => {
  const h = satelliteProviderHealth();
  assert.equal(h.provider, 'sentinel-hub');
  assert.equal(h.mock, false);
  if (!process.env.SENTINEL_HUB_CLIENT_ID || !process.env.SENTINEL_HUB_CLIENT_SECRET) {
    assert.equal(h.configured, false);
    assert.equal(h.execution, 'authorization-gated');
  }
});

test('Sentinel Hub supports Sentinel-1 and Sentinel-2 collections', () => {
  const h = satelliteProviderHealth();
  assert.deepEqual(h.supportedCollections.sort(), ['sentinel-1-grd', 'sentinel-2-l2a']);
});

test('Process API consumes binary image output rather than JSON', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    if (String(url).includes('/token')) {
      return new Response(JSON.stringify({ access_token: 'test-token' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      status: 200,
      headers: { 'content-type': 'image/png' }
    });
  };

  const oldId = process.env.SENTINEL_HUB_CLIENT_ID;
  const oldSecret = process.env.SENTINEL_HUB_CLIENT_SECRET;
  process.env.SENTINEL_HUB_CLIENT_ID = 'test-client';
  process.env.SENTINEL_HUB_CLIENT_SECRET = 'test-secret';

  try {
    const result = await processSentinelImage({
      bbox: [6.1, 46.1, 6.2, 46.2],
      from: '2026-09-01T00:00:00Z',
      to: '2026-09-02T00:00:00Z',
      collection: 'sentinel-1-grd',
      width: 64,
      height: 64
    });
    assert.equal(result.contentType, 'image/png');
    assert.equal(Buffer.isBuffer(result.bytes), true);
    assert.deepEqual([...result.bytes], [137, 80, 78, 71]);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldId === undefined) delete process.env.SENTINEL_HUB_CLIENT_ID;
    else process.env.SENTINEL_HUB_CLIENT_ID = oldId;
    if (oldSecret === undefined) delete process.env.SENTINEL_HUB_CLIENT_SECRET;
    else process.env.SENTINEL_HUB_CLIENT_SECRET = oldSecret;
  }
});
