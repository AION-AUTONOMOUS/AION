import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { caseFileIntakeStatus } from '../server-api/case-files/upload.js';

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    end() { this.ended = true; return this; }
  };
}

test('intake remains closed regardless of feature flag and lists all unverified controls', () => {
  for (const env of [{}, { CASE_FILES_ENABLED: 'true' }]) {
    const state = caseFileIntakeStatus(env);
    assert.equal(state.enabled, false);
    assert.ok(state.blockers.includes('identity-and-case-authorization-not-verified'));
    assert.ok(state.blockers.includes('private-encrypted-object-storage-not-verified'));
    assert.ok(state.blockers.includes('malware-scanning-and-quarantine-not-verified'));
    assert.ok(state.blockers.includes('retention-and-audit-controls-not-verified'));
    assert.ok(state.maxFileBytes <= 10 * 1024 * 1024);
  }
});

test('anonymous POST fails closed without reading request body', async () => {
  const req = { method: 'POST' };
  Object.defineProperty(req, 'body', { get() { throw new Error('request body must not be read'); } });
  const res = mockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'CASE_FILE_INTAKE_CLOSED');
  assert.equal(res.body.safeToUploadSensitiveFiles, false);
  assert.equal(res.headers['cache-control'], 'no-store, max-age=0');
  assert.equal(res.headers['pragma'], 'no-cache');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['referrer-policy'], 'no-referrer');
  assert.equal(res.headers['content-security-policy'], "default-src 'none'; frame-ancestors 'none'");
  assert.equal(res.headers['vary'], 'Origin');
});

test('GET reports intake disabled and is not cacheable', async () => {
  const res = mockResponse();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.enabled, false);
  assert.equal(res.body.status, 'BLOCKED');
  assert.equal(res.body.safeToUploadSensitiveFiles, false);
  assert.ok(res.body.blockers.includes('cross-tenant-isolation-not-verified'));
  assert.equal(res.headers['cache-control'], 'no-store, max-age=0');
});

test('HEAD fails closed without returning a response body', async () => {
  const res = mockResponse();
  await handler({ method: 'HEAD' }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.ended, true);
  assert.equal(res.body, undefined);
});

test('OPTIONS preflight returns no content and does not open intake', async () => {
  const res = mockResponse();
  await handler({ method: 'OPTIONS' }, res);
  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
  assert.equal(res.body, undefined);
});

test('unsupported methods are rejected', async () => {
  const res = mockResponse();
  await handler({ method: 'DELETE' }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.body.error, 'Method not allowed');
});
