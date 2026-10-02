import test from "node:test";
import assert from "node:assert/strict";
import { createPoIRecord, verifyPoIRecord, settlePoI } from "./aion-proof-of-intelligence.js";
import { sha256 } from "./aion-value-ledger.js";

test("PoI accepts independently attested quality work", () => {
  const record = createPoIRecord({
    contributor: "aion1worker",
    taskClass: "inference",
    taskSpecHash: sha256("spec"),
    inputDigest: sha256("input"),
    outputDigest: sha256("output"),
    resourceUnits: { unit: "inference", quantity: 100 },
    outcome: { qualityBps: 9500, reproducibilityBps: 9800 },
    evidence: [sha256("trace"), sha256("artifact")]
  }, Date.parse("2026-09-27T00:00:00Z"));
  const attestations = ["v1","v2","v3"].map(validatorId => ({
    validatorId, recordHash: record.recordHash, decision: "accept"
  }));
  const verification = verifyPoIRecord(record, attestations, {}, Date.parse("2026-09-27T01:00:00Z"));
  assert.equal(verification.accepted, true);
  assert.ok(settlePoI(record, attestations, {}, Date.parse("2026-09-27T01:00:00Z")).rewardNeuro > 0n);
});

test("PoI rejects duplicate validator identity", () => {
  const record = createPoIRecord({
    contributor: "aion1worker",
    taskClass: "training",
    taskSpecHash: sha256("spec2"),
    inputDigest: sha256("input2"),
    outputDigest: sha256("output2"),
    resourceUnits: { unit: "sample", quantity: 10 },
    outcome: { qualityBps: 9000, reproducibilityBps: 9000 },
    evidence: [sha256("trace2")]
  });
  const attestations = ["v1","v1","v2"].map(validatorId => ({
    validatorId, recordHash: record.recordHash, decision: "accept"
  }));
  assert.equal(verifyPoIRecord(record, attestations).accepted, false);
});
