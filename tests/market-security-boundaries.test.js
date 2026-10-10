import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../server-api/market.js';

function response() {
  return {
    code: 200, headers: {}, body: undefined, ended: false,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    end() { this.ended = true; return this; }
  };
}

test('market health reports no real provider and keeps trading disabled', async () => {
  const prior = process.env.AION_MARKET_PROVIDER_ADAPTER;
  delete process.env.AION_MARKET_PROVIDER_ADAPTER;
  try {
    const res = response();
    await handler({ method: 'GET', url: '/api/market?path=health' }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.market.realDataBacked, false);
    assert.equal(res.body.market.tradingEnabled, false);
    assert.equal(res.body.market.orderRouting, 'disabled');
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  } finally {
    if (prior === undefined) delete process.env.AION_MARKET_PROVIDER_ADAPTER;
    else process.env.AION_MARKET_PROVIDER_ADAPTER = prior;
  }
});

test('market quotes fail closed when no provider is configured', async () => {
  const prior = process.env.AION_MARKET_PROVIDER_ADAPTER;
  delete process.env.AION_MARKET_PROVIDER_ADAPTER;
  try {
    const res = response();
    await handler({ method: 'GET', url: '/api/market?path=quotes&assetId=crypto%3Abtc' }, res);
    assert.equal(res.code, 503);
    assert.equal(res.body.error, 'market_data_provider_not_configured');
  } finally {
    if (prior === undefined) delete process.env.AION_MARKET_PROVIDER_ADAPTER;
    else process.env.AION_MARKET_PROVIDER_ADAPTER = prior;
  }
});

test('market API rejects mutation methods', async () => {
  const res = response();
  await handler({ method: 'POST', url: '/api/market?path=quotes' }, res);
  assert.equal(res.code, 405);
  assert.equal(res.headers.Allow, 'GET, OPTIONS');
});

test('preflight is empty and advertises only safe methods', async () => {
  const res = response();
  await handler({ method: 'OPTIONS', url: '/api/market?path=health' }, res);
  assert.equal(res.code, 204);
  assert.equal(res.ended, true);
  assert.equal(res.headers['Access-Control-Allow-Methods'], 'GET, OPTIONS');
});

test('unknown market paths are not treated as valid data routes without a provider', async () => {
  const prior = process.env.AION_MARKET_PROVIDER_ADAPTER;
  delete process.env.AION_MARKET_PROVIDER_ADAPTER;
  try {
    const res = response();
    await handler({ method: 'GET', url: '/api/market?path=executeOrder' }, res);
    assert.equal(res.code, 404);
    assert.equal(res.body.error, 'unknown_market_path');
  } finally {
    if (prior === undefined) delete process.env.AION_MARKET_PROVIDER_ADAPTER;
    else process.env.AION_MARKET_PROVIDER_ADAPTER = prior;
  }
});
