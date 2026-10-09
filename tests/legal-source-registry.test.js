import test from "node:test";
import assert from "node:assert/strict";
import { validateLegalSourceRecord, canDisplayAsVerifiedCurrentLaw } from "../legal-source-registry.js";

const recent = "2026-10-08T12:00:00Z";
const validPrimary = {
  source_id: "sa-law-example-001",
  jurisdiction_id: "SA",
  jurisdiction_name: "Saudi Arabia",
  issuing_authority: "Official publishing authority — replace with verified authority",
  source_type: "legislation",
  title: "Example source record — not a legal citation",
  citation_or_case_number: "Example identifier — not verified",
  article_or_paragraph: "Example pinpoint — not verified",
  canonical_url: "https://example.gov.invalid/law",
  language: "ar",
  publication_date: "2026-01-01",
  effective_from: "2026-01-01",
  last_verified_at: recent,
  verification_method: "manual-primary-source-check",
  reviewer_id: "reviewer-placeholder",
  status: "VERIFIED_PRIMARY_SOURCE"
};

test("rejects missing provenance for primary-source status", () => {
  const record = { ...validPrimary };
  delete record.citation_or_case_number;
  const result = validateLegalSourceRecord(record);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("citation_or_case_number")));
});

test("fails closed for unreviewed records", () => {
  const result = canDisplayAsVerifiedCurrentLaw({ ...validPrimary, status: "UNREVIEWED" }, {
    now: new Date("2026-10-09T12:00:00Z")
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "NOT_VERIFIED_PRIMARY_SOURCE");
});

test("fails closed when the last verification is stale", () => {
  const result = canDisplayAsVerifiedCurrentLaw({ ...validPrimary, last_verified_at: "2025-01-01T00:00:00Z" }, {
    now: new Date("2026-10-09T12:00:00Z"), maxAgeDays: 90
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "VERIFICATION_STALE");
});

test("rejects a non-HTTPS source URL", () => {
  const result = validateLegalSourceRecord({ ...validPrimary, canonical_url: "http://example.gov.invalid/law" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("must use HTTPS")));
});

test("rejects an effective end date earlier than its start date", () => {
  const result = validateLegalSourceRecord({
    ...validPrimary,
    effective_from: "2026-02-01",
    effective_to: "2026-01-01"
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("cannot precede")));
});

test("does not let a secondary source claim primary-source status", () => {
  const result = validateLegalSourceRecord({ ...validPrimary, source_type: "secondary_source" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("secondary source")));
});

test("passes metadata gate for a recent complete record but preserves limitation notice", () => {
  const result = canDisplayAsVerifiedCurrentLaw(validPrimary, {
    now: new Date("2026-10-09T12:00:00Z")
  });
  assert.equal(result.allowed, true);
  assert.match(result.disclaimer, /Metadata gate only/);
});
