import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildValueUnitPlan, buildVerifiedValuePortfolio, valuePortfolioTruth } from '../config/aion-ai-vault-value-portfolio.js';

describe('AION AI Vault Value Portfolio', () => {
  it('plans ten unique value units for every asset class', () => {
    const plan = buildValueUnitPlan();
    assert.equal(plan.length, 10);
    assert.ok(plan.every(x => x.uniqueAiValueUnits.length === 10));
    assert.ok(plan.every(x => x.targetClassValuationUsd === 1000000));
  });

  it('counts only independently verified units as value', () => {
    const result = buildVerifiedValuePortfolio({
      verifiedUnits: [
        {
          assetClassId: 'bonds-fixed-income',
          unitNumber: 1,
          evidenceRef: 'verified://bond-001',
          valuationSource: 'independent://valuation-001',
          verified: true
        },
        {
          assetClassId: 'bonds-fixed-income',
          unitNumber: 2,
          verified: false
        }
      ]
    });
    assert.equal(result.verifiedUnitCount, 1);
    assert.equal(result.verifiedValueUsd, 100000);
    assert.equal(result.fakeValue, false);
  });

  it('sets a 10-class target of 10 million USD without claiming it is cash', () => {
    const truth = valuePortfolioTruth();
    assert.equal(truth.totalTargetValuationUsd, 10000000);
    assert.equal(truth.targetIsNotCash, true);
    assert.equal(truth.verifiedValueOnly, true);
  });
});
