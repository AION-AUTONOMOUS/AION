import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAssetIntelligenceProduct } from '../config/aion-asset-product-engine.js';

test('product engine is available',()=>assert.equal(typeof buildAssetIntelligenceProduct,'function'));
