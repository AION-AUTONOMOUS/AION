import test from "node:test";
import assert from "node:assert/strict";
import { AionMempool } from "./aion-mempool.js";
import { sha256 } from "../protocol/aion-value-ledger.js";

const tx = (nonce, hash) => {
  const unsigned = { sender: "aion1sender", nonce, amountNeuro: "1", feeNeuro: "1", signature: "sig" };
  return { ...unsigned, txHash: hash || sha256(unsigned) };
};

test("mempool rejects duplicate hashes and sender nonce conflicts", () => {
  const pool = new AionMempool();
  assert.equal(pool.add(tx(0)).accepted, true);
  assert.equal(pool.add(tx(0, "other")).reason, "nonce_conflict");
  assert.equal(pool.add(tx(1, tx(0).txHash)).reason, "duplicate");
  assert.equal(pool.size(), 1);
});

test("mempool orders transactions deterministically", () => {
  const pool = new AionMempool();
  pool.add(tx(2, "tx-2"));
  pool.add(tx(0, "tx-0"));
  assert.deepEqual(pool.list().map(x => x.nonce), [0,2]);
});
