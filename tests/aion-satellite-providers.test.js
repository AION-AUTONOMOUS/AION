import test from 'node:test';
import assert from 'node:assert/strict';
import { satelliteProviderHealth } from '../config/aion-satellite-providers.js';
test('Sentinel Hub adapter is authorization-gated without credentials',()=>{const h=satelliteProviderHealth();assert.equal(h.provider,'sentinel-hub');assert.equal(h.mock,false);if(!process.env.SENTINEL_HUB_CLIENT_ID||!process.env.SENTINEL_HUB_CLIENT_SECRET){assert.equal(h.configured,false);assert.equal(h.execution,'authorization-gated');}});
