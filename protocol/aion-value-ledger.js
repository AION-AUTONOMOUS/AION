import crypto from "node:crypto";

export const PROTOCOL = Object.freeze({
  name: "AION Proof-of-Intelligence Ledger",
  version: "0.2.0",
  symbol: "AION",
  decimals: 8,
  maxSupplyNeuro: 10_000_000_000n * 10n ** 8n,
  minValidators: 3,
  maxVerificationAgeSeconds: 86400
});

export function canonicalJson(value) {
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + canonicalJson(value[k])).join(",") + "}";
}

export function sha256(value) {
  const input = typeof value === "string" ? value : canonicalJson(value);
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function createValueRecord(input, now = Date.now()) {
  validateValueRecordInput(input);
  const record = {
    schema: "aion.value-record/0.2",
    recordId: input.recordId || crypto.randomUUID(),
    subject: input.subject,
    contributor: input.contributor,
    category: input.category,
    resourceUnits: input.resourceUnits,
    outcome: input.outcome,
    evidence: [...input.evidence].sort(),
    createdAt: input.createdAt || new Date(now).toISOString(),
    expiresAt: input.expiresAt || null,
    metadata: input.metadata || {}
  };
  return Object.freeze({ ...record, recordHash: sha256(record) });
}

export function verifyValueRecord(record, validators, now = Date.now()) {
  const errors = [];
  if (!record || !["aion.value-record/0.1","aion.value-record/0.2"].includes(record.schema)) errors.push("invalid_schema");
  if (record.recordHash !== sha256(stripHash(record))) errors.push("invalid_record_hash");
  if (!Array.isArray(record.evidence) || record.evidence.length === 0) errors.push("missing_evidence");
  if (!Array.isArray(validators) || validators.length < PROTOCOL.minValidators) errors.push("insufficient_validators");
  const uniqueValidators = new Set();
  for (const v of validators || []) {
    if (!v?.validatorId || !v?.signature || !v?.attestationHash) continue;
    uniqueValidators.add(v.validatorId);
  }
  if (uniqueValidators.size < PROTOCOL.minValidators) errors.push("validator_diversity_failed");
  const age = now - Date.parse(record.createdAt || "");
  if (!Number.isFinite(age) || age < 0) errors.push("invalid_timestamp");
  if (age > PROTOCOL.maxVerificationAgeSeconds * 1000) errors.push("record_too_old");
  return Object.freeze({ accepted: errors.length === 0, recordHash: record.recordHash, validatorCount: uniqueValidators.size, errors });
}

export function calculateValueScore(record, verification) {
  if (!verification?.accepted) return 0n;
  const units = BigInt(record.resourceUnits?.quantity || 0);
  if (units <= 0n) return 0n;
  const qualityBps = BigInt(Math.max(1, Math.min(10000, Number(record.outcome?.qualityBps || 10000))));
  return (units * qualityBps) / 10000n;
}

export function calculateSettlement(record, verification, policy = {}) {
  const score = calculateValueScore(record, verification);
  const rewardPerUnitNeuro = BigInt(policy.rewardPerUnitNeuro ?? 1n);
  const capNeuro = BigInt(policy.recordCapNeuro ?? 100_000n);
  const reward = score * rewardPerUnitNeuro;
  return Object.freeze({ valueScore: score, grossRewardNeuro: reward > capNeuro ? capNeuro : reward, currency: PROTOCOL.symbol, unit: "neuro" });
}

export function settleValueRecord(record, validators, policy = {}, now = Date.now()) {
  const verification = verifyValueRecord(record, validators, now);
  const settlement = calculateSettlement(record, verification, policy);
  return Object.freeze({ recordHash: record.recordHash, verification, settlement, settledAt: new Date(now).toISOString() });
}

export function stripHash(record) {
  const { recordHash, ...withoutHash } = record;
  return withoutHash;
}

export function validateValueRecordInput(input) {
  if (!input || typeof input !== "object") throw new TypeError("record input required");
  for (const field of ["subject", "contributor", "category", "resourceUnits", "outcome", "evidence"]) {
    if (input[field] === undefined || input[field] === null) throw new TypeError(`missing_${field}`);
  }
  if (!Number.isFinite(Number(input.resourceUnits.quantity)) || Number(input.resourceUnits.quantity) <= 0) {
    throw new TypeError("resource quantity must be positive");
  }
  if (!Array.isArray(input.evidence) || input.evidence.length === 0) throw new TypeError("evidence required");
  return true;
}
