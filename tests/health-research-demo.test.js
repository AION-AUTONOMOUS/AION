import test from 'node:test';
import assert from 'node:assert/strict';
import { SYNTHETIC_HEALTH_FIXTURES, summarizeSyntheticFixture } from '../server-api/health-research-demo.js';

test('health research fixtures are explicitly synthetic and non-clinical', () => {
  assert.ok(SYNTHETIC_HEALTH_FIXTURES.length >= 1);
  for (const fixture of SYNTHETIC_HEALTH_FIXTURES) {
    const summary = summarizeSyntheticFixture(fixture);
    assert.equal(summary.synthetic, true);
    assert.equal(summary.clinicalUse, false);
    assert.match(summary.warning, /Not medical advice/);
  }
});

test('health demo rejects invalid or non-synthetic fixture identifiers', () => {
  assert.throws(() => summarizeSyntheticFixture({ id: 'real-patient-1', sleepHours: 7 }));
  assert.throws(() => summarizeSyntheticFixture({ id: 'synthetic-case-bad', sleepHours: 30 }));
});
