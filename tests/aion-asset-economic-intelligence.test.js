import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAssetEconomicIntelligence } from '../config/aion-asset-economic-intelligence.js';

test('module exports economic intelligence builder',()=>{
  assert.equal(typeof buildAssetEconomicIntelligence,'function');
});
