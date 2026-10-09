import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCaseUploadReadiness, REQUIRED_CASE_UPLOAD_CONTROLS, validateCaseUploadMetadata } from "../server-api/global-counsel-security-gate.js";

test("confidential uploads fail closed when controls are missing", () => {
  const result = evaluateCaseUploadReadiness({});
  assert.equal(result.enabled, false);
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.missingControls.length, REQUIRED_CASE_UPLOAD_CONTROLS.length);
});

test("a single missing or non-true control blocks confidential uploads", () => {
  const controls = Object.fromEntries(REQUIRED_CASE_UPLOAD_CONTROLS.map(key => [key, true]));
  controls.caseLevelAuthorization = false;
  const result = evaluateCaseUploadReadiness(controls);
  assert.equal(result.enabled, false);
  assert.deepEqual(result.missingControls, ["caseLevelAuthorization"]);
});

test("all declared controls only qualify for security review, not automatic approval", () => {
  const controls = Object.fromEntries(REQUIRED_CASE_UPLOAD_CONTROLS.map(key => [key, true]));
  const result = evaluateCaseUploadReadiness(controls);
  assert.equal(result.enabled, true);
  assert.equal(result.status, "READY_FOR_SECURITY_REVIEW");
  assert.match(result.message, /independent security review/i);
});

test("upload metadata rejects path-like filenames, missing MIME and invalid sizes", () => {
  assert.equal(validateCaseUploadMetadata({ filename: "../case.pdf", mimeType: "application/pdf", sizeBytes: 100 }).valid, false);
  assert.equal(validateCaseUploadMetadata({ filename: "case.pdf", mimeType: "", sizeBytes: 100 }).valid, false);
  assert.equal(validateCaseUploadMetadata({ filename: "case.pdf", mimeType: "application/pdf", sizeBytes: -1 }).valid, false);
  assert.equal(validateCaseUploadMetadata({ filename: "case.pdf", mimeType: "application/pdf", sizeBytes: 21 * 1024 * 1024 }).valid, false);
});

test("upload metadata accepts a bounded plain filename and positive size", () => {
  assert.deepEqual(validateCaseUploadMetadata({ filename: "case-evidence.pdf", mimeType: "application/pdf", sizeBytes: 4096 }), { valid: true, errors: [] });
});
