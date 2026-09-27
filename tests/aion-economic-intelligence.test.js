import test from 'node:test';
import assert from 'node:assert/strict';
import { economicIntelligenceHealth } from '../config/aion-economic-intelligence-engine.js';

test('economic intelligence engine is configured for real measurable operation', () => {
  const health = economicIntelligenceHealth();
  assert.equal(health.status, 'continuous-engine-ready');
  assert.equal(health.realData, true);
  assert.equal(health.measurableOutcomes, true);
  assert.equal(health.externalMoney, false);
  assert.equal(health.mainnet, false);
});
