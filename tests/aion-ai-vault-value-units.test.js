import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createValueUnit, classValueSummary } from '../config/aion-ai-vault-value-units.js';

describe('AION AI Vault Value Units', () => {
  it('defines ten verified AI value units at 100,000 USD each', () => {
    const unit = createValueUnit({
      assetClassId: 'bonds-fixed-income',
      unitNumber: 1,
      evidenceRef: 'verified://bond-evidence-001',
      valuationSource: 'independent://valuation-001',
      verified: true
    });
    assert.equal(unit.valueUsd, 100000);
    assert.equal(unit.fakeValue, false);
    assert.equal(unit.legalOwnershipInference, false);
  });

  it('totals ten units to one million USD', () => {
    const summary = classValueSummary({assetClassId: 'bonds-fixed-income', units: 10});
    assert.equal(summary.totalValueUsd, 1000000);
    assert.equal(summary.unitCount, 10);
    assert.equal(summary.valuationIsNotRevenue, true);
  });

  it('fails closed without real evidence', () => {
    assert.throws(() => createValueUnit({
      assetClassId: 'bonds-fixed-income',
      unitNumber: 1,
      verified: true
    }), /real evidence/);
  });
});
