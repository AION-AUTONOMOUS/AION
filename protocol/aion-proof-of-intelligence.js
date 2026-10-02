import crypto from "node:crypto";
import { canonicalJson, sha256 } from "./aion-value-ledger.js";

export const POI = Object.freeze({
  name: "AION Proof-of-Intelligence",
  version: "0.1.0",
  minValidators: 3,
  maxEvidenceAgeSeconds: 86400,
  maxQualityBps: 10000,
  maxReproducibilityBps: 10000
});

function requireHex(value, field) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/i.test(value)) throw new TypeError(field + " must be a sha256 hex digest");
}

export function evidenceDigest(evidence) {
  if (!Array.isArray(evidence) || evidence.length === 0) throw new TypeError("evidence required");
  return sha256(evidence.map(x => typeof x === "string" ? x : canonicalJson(x)));
}

export function contributionFingerprint(input) {
  return sha256({
    taskClass: input.taskClass,
    taskSpecHash: input.taskSpecHash,
    inputDigest: input.inputDigest,
    outputDigest: input.outputDigest,
    contributor: input.contributor,
    resourceUnits: input.resourceUnits
  });
}

export function createPoIRecord(input, now = Date.now()) {
  if (!input?.contributor || !input.taskClass || !input.taskSpecHash || !input.inputDigest || !input.outputDigest) {
    throw new TypeError("contributor, taskClass, taskSpecHash, inputDigest and outputDigest are required");
  }
  requireHex(input.taskSpecHash, "taskSpecHash");
  requireHex(input.inputDigest, "inputDigest");
  requireHex(input.outputDigest, "outputDigest");
  if (!Number.isFinite(Number(input.resourceUnits?.quantity)) || Number(input.resourceUnits.quantity) <= 0) {
    throw new TypeError("resourceUnits.quantity must be positive");
  }
  const normalizedEvidence = input.evidence.map(x => typeof x === "string" ? x : canonicalJson(x)).sort();
  const record = {
    schema: "aion.poi-record/0.1",
    recordId: input.recordId || crypto.randomUUID(),
    contributor: input.contributor,
    taskClass: input.taskClass,
    taskSpecHash: input.taskSpecHash,
    inputDigest: input.inputDigest,
    outputDigest: input.outputDigest,
    resourceUnits: input.resourceUnits,
    outcome: {
      qualityBps: Math.max(0, Math.min(POI.maxQualityBps, Number(input.outcome?.qualityBps ?? 0))),
      reproducibilityBps: Math.max(0, Math.min(POI.maxReproducibilityBps, Number(input.outcome?.reproducibilityBps ?? 0))),
      latencyMs: Number(input.outcome?.latencyMs ?? 0)
    },
    evidence: normalizedEvidence,
    evidenceDigest: evidenceDigest(normalizedEvidence),
    contributionFingerprint: contributionFingerprint(input),
    createdAt: input.createdAt || new Date(now).toISOString(),
    metadata: input.metadata || {}
  };
  return Object.freeze({ ...record, recordHash: sha256(record) });
}

export function verifyPoIRecord(record, attestations, options = {}, now = Date.now()) {
  const errors = [];
  if (!record || record.schema !== "aion.poi-record/0.1") errors.push("invalid_schema");
  if (record?.recordHash !== sha256(stripRecordHash(record))) errors.push("invalid_record_hash");
  if (!record?.evidenceDigest || record.evidenceDigest !== evidenceDigest(record.evidence)) errors.push("invalid_evidence_digest");
  if (record?.contributionFingerprint !== contributionFingerprint(record || {})) errors.push("invalid_contribution_fingerprint");

  const age = now - Date.parse(record?.createdAt || "");
  const maxAge = Number(options.maxEvidenceAgeSeconds ?? POI.maxEvidenceAgeSeconds) * 1000;
  if (!Number.isFinite(age) || age < 0 || age > maxAge) errors.push("invalid_or_expired_timestamp");

  const validators = new Map();
  for (const a of attestations || []) {
    if (a?.validatorId && a?.recordHash === record?.recordHash && a?.decision === "accept") validators.set(a.validatorId, a);
  }
  const minValidators = Number(options.minValidators ?? POI.minValidators);
  if (validators.size < minValidators) errors.push("insufficient_independent_validators");

  const requiredScore = Number(options.minimumQualityBps ?? 7000);
  if (Number(record?.outcome?.qualityBps || 0) < requiredScore) errors.push("quality_threshold_failed");
  if (Number(record?.outcome?.reproducibilityBps || 0) < Number(options.minimumReproducibilityBps ?? 7000)) {
    errors.push("reproducibility_threshold_failed");
  }

  return Object.freeze({
    accepted: errors.length === 0,
    recordHash: record?.recordHash,
    contributionFingerprint: record?.contributionFingerprint,
    validatorCount: validators.size,
    errors
  });
}

export function calculatePoIScore(record, verification) {
  if (!verification?.accepted) return 0n;
  const units = BigInt(record.resourceUnits.quantity);
  const quality = BigInt(record.outcome.qualityBps);
  const reproducibility = BigInt(record.outcome.reproducibilityBps);
  const multiplierBps = (quality * 7000n + reproducibility * 3000n) / 10000n;
  return units * multiplierBps / 10000n;
}

export function settlePoI(record, attestations, policy = {}, now = Date.now()) {
  const verification = verifyPoIRecord(record, attestations, policy, now);
  const score = calculatePoIScore(record, verification);
  const rewardPerUnit = BigInt(policy.rewardPerUnitNeuro ?? 1n);
  const cap = BigInt(policy.recordCapNeuro ?? 1_000_000n);
  const gross = score * rewardPerUnit;
  return Object.freeze({
    recordHash: record.recordHash,
    verification,
    valueScore: score,
    rewardNeuro: gross > cap ? cap : gross,
    currency: "AION",
    unit: "neuro",
    settledAt: new Date(now).toISOString()
  });
}

export function stripRecordHash(record) {
  const { recordHash, ...rest } = record || {};
  return rest;
}
