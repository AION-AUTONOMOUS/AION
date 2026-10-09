/**
 * AION GLOBAL COUNSEL — legal source integrity primitives.
 *
 * These helpers validate source-record metadata and fail closed when required
 * provenance is missing. They do NOT fetch official sources, establish legal
 * validity, or replace a qualified human review.
 */

export const LEGAL_SOURCE_STATUSES = Object.freeze([
  "UNREVIEWED",
  "VERIFIED_PRIMARY_SOURCE",
  "VERIFIED_OFFICIAL_GUIDANCE",
  "SECONDARY_SOURCE",
  "STALE",
  "CONFLICT",
  "UNAVAILABLE",
  "SUPERSEDED"
]);

const nonEmpty = value => typeof value === "string" && value.trim().length > 0;
const validIsoDate = value =>
  nonEmpty(value) && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(value)
  && Number.isFinite(Date.parse(value));

export function validateLegalSourceRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { valid: false, errors: ["record must be an object"] };
  }

  for (const field of [
    "source_id", "jurisdiction_id", "jurisdiction_name", "issuing_authority",
    "source_type", "title", "canonical_url", "language", "status"
  ]) {
    if (!nonEmpty(record[field])) errors.push(`${field} is required`);
  }

  if (record.source_type && ![
    "legislation", "regulation", "court_decision", "official_guidance",
    "treaty", "secondary_source"
  ].includes(record.source_type)) errors.push("source_type is not supported");

  if (record.status && !LEGAL_SOURCE_STATUSES.includes(record.status)) {
    errors.push("status is not supported");
  }

  if (nonEmpty(record.canonical_url)) {
    try {
      const url = new URL(record.canonical_url);
      if (url.protocol !== "https:") errors.push("canonical_url must use HTTPS");
    } catch {
      errors.push("canonical_url must be a valid absolute URL");
    }
  }

  for (const field of ["publication_date", "effective_from", "effective_to", "last_amended_date", "retrieved_at", "last_verified_at"]) {
    if (record[field] != null && record[field] !== "" && !validIsoDate(record[field])) {
      errors.push(`${field} must be an ISO date or UTC timestamp`);
    }
  }

  if (record.effective_from && record.effective_to
      && Date.parse(record.effective_to) < Date.parse(record.effective_from)) {
    errors.push("effective_to cannot precede effective_from");
  }

  if (record.status === "VERIFIED_PRIMARY_SOURCE") {
    for (const field of ["citation_or_case_number", "article_or_paragraph", "last_verified_at", "verification_method", "reviewer_id"]) {
      if (!nonEmpty(record[field])) errors.push(`${field} is required for VERIFIED_PRIMARY_SOURCE`);
    }
    if (!validIsoDate(record.last_verified_at)) {
      errors.push("last_verified_at must be a valid ISO date or UTC timestamp");
    }
    if (record.source_type === "secondary_source") {
      errors.push("a secondary source cannot be marked VERIFIED_PRIMARY_SOURCE");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Metadata gate only. The caller must still confirm the actual source text,
 * legal status, amendments, and pinpoint citation against the official source.
 */
export function canDisplayAsVerifiedCurrentLaw(record, { now = new Date(), maxAgeDays = 90 } = {}) {
  const validation = validateLegalSourceRecord(record);
  if (!validation.valid) return { allowed: false, reason: "INVALID_METADATA", errors: validation.errors };
  if (record.status !== "VERIFIED_PRIMARY_SOURCE") {
    return { allowed: false, reason: "NOT_VERIFIED_PRIMARY_SOURCE" };
  }
  if (!validIsoDate(record.last_verified_at)) {
    return { allowed: false, reason: "MISSING_VERIFICATION_DATE" };
  }

  const verifiedAt = Date.parse(record.last_verified_at);
  const ageMs = now.getTime() - verifiedAt;
  if (ageMs < 0) return { allowed: false, reason: "VERIFICATION_DATE_IN_FUTURE" };
  if (ageMs > maxAgeDays * 24 * 60 * 60 * 1000) {
    return { allowed: false, reason: "VERIFICATION_STALE" };
  }
  if (record.status === "SUPERSEDED" || record.status === "CONFLICT" || record.status === "UNAVAILABLE" || record.status === "STALE") {
    return { allowed: false, reason: record.status };
  }
  if (record.effective_to && Date.parse(record.effective_to) < now.getTime()) {
    return { allowed: false, reason: "OUTSIDE_EFFECTIVE_PERIOD" };
  }

  return {
    allowed: true,
    reason: "METADATA_GATE_PASSED",
    disclaimer: "Metadata gate only: independently confirm the official text, current legal force, amendments, and pinpoint citation before legal reliance."
  };
}
