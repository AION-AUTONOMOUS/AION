import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const CODE_BYTES = 16;
const DEFAULT_CODE_COUNT = 8;

/**
 * Generate one-time recovery codes. Show plaintext codes to the user once;
 * persist only hashes and mark each hash consumed after successful use.
 */
export function generateRecoveryCodes(count = DEFAULT_CODE_COUNT) {
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new RangeError('count must be an integer from 1 to 20');
  }

  const codes = Array.from({ length: count }, () =>
    randomBytes(CODE_BYTES).toString('base64url').toUpperCase()
  );
  return {
    codes,
    hashes: codes.map(hashRecoveryCode)
  };
}

export function normalizeRecoveryCode(code) {
  if (typeof code !== 'string') return '';
  return code.replace(/[\s-]/g, '').toUpperCase();
}

export function hashRecoveryCode(code) {
  const normalized = normalizeRecoveryCode(code);
  if (!normalized) throw new TypeError('recovery code required');
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function recoveryCodeMatches(code, storedHash) {
  if (typeof storedHash !== 'string' || !/^[a-f0-9]{64}$/i.test(storedHash)) return false;
  let candidate;
  try {
    candidate = Buffer.from(hashRecoveryCode(code), 'hex');
  } catch {
    return false;
  }
  const expected = Buffer.from(storedHash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
