import test from "node:test";
import assert from "node:assert/strict";
import { finalizeBlock, quorumRequired, createAttestation } from "./aion-consensus.js";

const block = {
  height: 7,
  previousHash: "prev",
  stateRoot: "state",
  txHashes: ["tx1"],
  proposer: "v1",
  timestamp: "2026-09-27T00:00:00.000Z",
  blockHash: "block-7"
};

test("BFT quorum requires at least two thirds", () => {
  assert.equal(quorumRequired(3), 2);
  assert.equal(quorumRequired(4), 3);
  assert.equal(quorumRequired(7), 5);
});

test("duplicate and unknown validators cannot increase quorum", () => {
  const validators = ["v1","v2","v3","v4"];
  const a1 = createAttestation({ validatorId:"v1", block, signature:"s1" });
  const a2 = createAttestation({ validatorId:"v1", block, signature:"s2" });
  const a3 = createAttestation({ validatorId:"v9", block, signature:"s9" });
  const result = finalizeBlock(block, validators, [a1,a2,a3]);
  assert.equal(result.finalized, false);
  assert.equal(result.attestations.length, 1);
});

test("two thirds attestations finalize a block", () => {
  const validators = ["v1","v2","v3","v4"];
  const attestations = validators.slice(0,3).map(v =>
    createAttestation({ validatorId:v, block, signature:"sig-"+v })
  );
  const result = finalizeBlock(block, validators, attestations);
  assert.equal(result.finalized, true);
  assert.match(result.certificateHash, /^[a-f0-9]{64}$/);
});
