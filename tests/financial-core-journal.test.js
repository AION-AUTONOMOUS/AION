import test from "node:test";
import assert from "node:assert/strict";
import { createJournalState, postJournal, verifyJournalChain } from "../financial-core/journal.js";

const command = (overrides = {}) => ({
  idempotencyKey: "order:00000001",
  currency: "USD",
  reference: "test-order-001",
  postings: [
    { accountId: "assets:cash", debitMinor: 1250, creditMinor: 0 },
    { accountId: "income:service", debitMinor: 0, creditMinor: 1250 }
  ],
  ...overrides
});

test("posts balanced integer-minor-unit entries and verifies hash chain", () => {
  const result = postJournal(createJournalState(), command(), { now: "2026-10-10T00:00:00.000Z" });
  assert.equal(result.duplicate, false);
  assert.equal(result.entry.totalMinor, "1250");
  assert.deepEqual(verifyJournalChain(result.state), { valid: true, entriesVerified: 1 });
});

test("same idempotency key and same command does not append twice", () => {
  const first = postJournal(createJournalState(), command());
  const second = postJournal(first.state, command());
  assert.equal(second.duplicate, true);
  assert.equal(second.entry.id, first.entry.id);
  assert.equal(second.state.entries.length, 1);
});

test("rejects reuse of idempotency key with a different command", () => {
  const first = postJournal(createJournalState(), command());
  assert.throws(
    () => postJournal(first.state, command({ reference: "different-order" })),
    /idempotency key reused/
  );
});

test("rejects unbalanced postings", () => {
  assert.throws(() => postJournal(createJournalState(), command({
    postings: [
      { accountId: "assets:cash", debitMinor: 1250, creditMinor: 0 },
      { accountId: "income:service", debitMinor: 0, creditMinor: 1249 }
    ]
  })), /not balanced/);
});

test("rejects floating-point money amounts", () => {
  assert.throws(() => postJournal(createJournalState(), command({
    postings: [
      { accountId: "assets:cash", debitMinor: 12.5, creditMinor: 0 },
      { accountId: "income:service", debitMinor: 0, creditMinor: 12.5 }
    ]
  })), /safe integers/);
});

test("verification detects journal tampering", () => {
  const first = postJournal(createJournalState(), command());
  const tampered = {
    ...first.state,
    entries: first.state.entries.map((entry) => ({
      ...entry,
      postings: entry.postings.map((posting, i) => i === 0 ? { ...posting, debitMinor: 999 } : posting)
    }))
  };
  assert.equal(verifyJournalChain(tampered).valid, false);
});
