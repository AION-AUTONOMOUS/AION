import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchEarthOverview, searchCopernicusMetadata } from '../server-api/earth-data.js';

test('free Earth overview reads NASA, NOAA, and Copernicus using live public endpoints', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    calls.push({ target, options });
    if (target.includes('eonet.gsfc.nasa.gov')) {
      return new Response(JSON.stringify({
        events: [{
          id: 'EONET-1',
          title: 'Test wildfire',
          categories: [{ id: 'wildfires', title: 'Wildfires' }],
          geometry: [{ date: '2026-10-14T00:00:00Z', type: 'Point', coordinates: [10, 20] }],
          link: 'https://eonet.gsfc.nasa.gov/'
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (target.includes('swpc.noaa.gov')) {
      return new Response(JSON.stringify([{ proton_speed: 618, time_tag: '2026-10-14T04:51:00Z' }]), {
        status: 200, headers: { 'content-type': 'application/json' }
      });
    }
    if (target.includes('stac.dataspace.copernicus.eu')) {
      return new Response(JSON.stringify({
        features: [{
          id: 'catalogue-item-1',
          properties: { datetime: '2026-10-13T10:00:00Z', platform: 'sentinel-2a' },
          bbox: [10, 20, 11, 21],
          assets: { thumbnail: { href: 'https://example.invalid/thumbnail.png' } },
          links: [{ rel: 'self', href: 'https://example.invalid/item' }]
        }]
      }), { status: 200, headers: { 'content-type': 'application/geo+json' } });
    }
    throw new Error('Unexpected public data source');
  };

  try {
    const result = await fetchEarthOverview({ bbox: [10, 20, 11, 21], limit: 3 });
    assert.equal(result.success, true);
    assert.equal(result.status, 'ok');
    assert.equal(result.availableSources, 3);
    assert.equal(result.sources.events.events[0].title, 'Test wildfire');
    assert.equal(result.sources.spaceWeather.measurements[0].proton_speed, 618);
    assert.equal(result.sources.satelliteCatalog.items[0].platform, 'sentinel-2a');
    assert.equal(calls.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Copernicus query validates bounding boxes before making network calls', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return new Response('{}', { status: 200 }); };
  try {
    await assert.rejects(
      searchCopernicusMetadata({ bbox: [190, -10, 200, 10] }),
      /bbox bounds are invalid/
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Earth overview degrades gracefully when one free source is unavailable', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('eonet.gsfc.nasa.gov')) return new Response('upstream unavailable', { status: 503 });
    if (target.includes('swpc.noaa.gov')) {
      return new Response(JSON.stringify([{ proton_speed: 500, time_tag: '2026-10-14T00:00:00Z' }]), { status: 200 });
    }
    if (target.includes('stac.dataspace.copernicus.eu')) return new Response(JSON.stringify({ features: [] }), { status: 200 });
    throw new Error('Unexpected public data source');
  };
  try {
    const result = await fetchEarthOverview();
    assert.equal(result.success, true);
    assert.equal(result.status, 'partial');
    assert.equal(result.availableSources, 2);
    assert.equal(result.sources.events.status, 'unavailable');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
