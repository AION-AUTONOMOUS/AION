import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRecoveryCodes, hashRecoveryCode, recoveryCodeMatches } from '../server-api/identity-core.js';

test('identity recovery codes are unique, hash-only storage can verify a code', () => {
  const result = generateRecoveryCodes(8);
  assert.equal(result.codes.length, 8);
  assert.equal(new Set(result.codes).size, 8);
  assert.equal(result.hashes.length, 8);
  assert.ok(result.hashes.every((hash) => /^[a-f0-9]{64}$/.test(hash)));
  assert.equal(recoveryCodeMatches(result.codes[0], result.hashes[0]), true);
  assert.equal(recoveryCodeMatches('wrong-code', result.hashes[0]), false);
  assert.equal(recoveryCodeMatches(result.codes[0], 'bad-hash'), false);
});

test('identity code normalization ignores spaces and hyphens', () => {
  assert.equal(hashRecoveryCode(' ab-cd '), hashRecoveryCode('ABCD'));
});

test('identity recovery code count is bounded', () => {
  assert.throws(() => generateRecoveryCodes(0), /count must be/);
  assert.throws(() => generateRecoveryCodes(21), /count must be/);
});
