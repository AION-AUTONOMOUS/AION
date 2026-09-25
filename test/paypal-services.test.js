import test from 'node:test';
import assert from 'node:assert/strict';
import { SERVICE_CATALOG, getService } from '../api/paypal/services.js';

test('service catalog has unique ids and positive prices', () => {
  const entries = Object.entries(SERVICE_CATALOG);
  assert.equal(entries.length, 21);

  const ids = new Set();
  for (const [title, service] of entries) {
    assert.ok(title.length > 0);
    assert.ok(service.id.length > 0);
    assert.ok(!ids.has(service.id), 'duplicate service id: ' + service.id);
    ids.add(service.id);
    assert.ok(Number.isFinite(service.price));
    assert.ok(service.price > 0);
  }
});

test('service lookup is server authoritative', () => {
  assert.equal(getService('تحضير درس كامل').price, 1.33);
  assert.equal(getService('ملخص شامل لمادة').price, 0.8);
  assert.equal(getService('unknown'), null);
});

test('service lookup trims harmless surrounding whitespace', () => {
  assert.equal(getService('  اختبار نهائي  ').id, 'final-test');
});
