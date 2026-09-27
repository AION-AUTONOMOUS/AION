import test from "node:test";
import assert from "node:assert/strict";
import {
  PROTOCOL,
  createValueRecord,
  verifyValueRecord,
  calculateValueScore,
  settleValueRecord
} from "./aion-value-ledger.js";

const baseInput = {
  recordId: "vr-test-001",
  subject: "aion-worker-runtime",
  contributor: "worker-0001",
  category: "compute",
  resourceUnits: { unit: "compute-unit", quantity: 100 },
  outcome: { qualityBps: 9500, digest: "result-digest" },
  evidence: ["sha256:evidence-1", "sha256:evidence-2"],
  metadata: { test: true }
};

function validators(record) {
  return [1,2,3].map(id => ({
    validatorId: `validator-${id}`,
    attestationHash: `attestation-${id}-${record.recordHash}`,
    signature: `signature-${id}`
  }));
}

test("protocol constants define a bounded monetary supply", () => {
  assert.equal(PROTOCOL.symbol, "AION");
  assert.equal(PROTOCOL.decimals, 8);
  assert.equal(PROTOCOL.maxSupplyNeuro, 21_000_000n * 10n ** 8n);
});

test("value records are deterministic and hash-bound", () => {
  const record = createValueRecord(baseInput, Date.parse("2026-09-27T00:00:00Z"));
  assert.match(record.recordHash, /^[a-f0-9]{64}$/);
  const result = verifyValueRecord(record, validators(record), Date.parse("2026-09-27T00:01:00Z"));
  assert.equal(result.accepted, true);
});

test("validator diversity is mandatory", () => {
  const record = createValueRecord(baseInput);
  const result = verifyValueRecord(record, validators(record).slice(0, 2));
  assert.equal(result.accepted, false);
  assert.ok(result.errors.includes("insufficient_validators"));
});

test("value score is quality adjusted", () => {
  const record = createValueRecord(baseInput);
  const verification = verifyValueRecord(record, validators(record));
  assert.equal(calculateValueScore(record, verification), 95n);
});

test("settlement is capped and does not invent supply", () => {
  const record = createValueRecord(baseInput);
  const result = settleValueRecord(record, validators(record), {
    rewardPerUnitNeuro: 10n,
    recordCapNeuro: 500n
  });
  assert.equal(result.settlement.grossRewardNeuro, 500n);
  assert.equal(result.settlement.currency, "AION");
});
