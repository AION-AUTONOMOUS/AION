import test from "node:test";
import assert from "node:assert/strict";
import { reconcileStatements } from "../financial-core/reconciliation.js";

const internal = [
  { reference: "PAY-1", amountMinor: 1500, currency: "USD" },
  { reference: "PAY-2", amountMinor: 2300, currency: "GBP" }
];

test("allows reconciliation only when every reference, amount, and currency matches", () => {
  const result = reconcileStatements({
    internalEntries: internal,
    externalEntries: [
      { reference: "PAY-2", amountMinor: 2300, currency: "GBP" },
      { reference: "PAY-1", amountMinor: 1500, currency: "USD" }
    ]
  });
  assert.equal(result.status, "matched");
  assert.equal(result.settlementAllowed, true);
  assert.deepEqual(result.discrepancies, []);
});

test("blocks settlement for missing provider entries", () => {
  const result = reconcileStatements({
    internalEntries: internal,
    externalEntries: [{ reference: "PAY-1", amountMinor: 1500, currency: "USD" }]
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.settlementAllowed, false);
  assert.deepEqual(result.discrepancies, [{ reference: "PAY-2", type: "missing_external" }]);
});

test("blocks settlement for unexpected external entries", () => {
  const result = reconcileStatements({
    internalEntries: [],
    externalEntries: [{ reference: "EXTRA", amountMinor: 100, currency: "EUR" }]
  });
  assert.equal(result.settlementAllowed, false);
  assert.equal(result.discrepancies[0].type, "missing_internal");
});

test("blocks settlement for amount or currency mismatches", () => {
  const result = reconcileStatements({
    internalEntries: internal,
    externalEntries: [
      { reference: "PAY-1", amountMinor: 1501, currency: "USD" },
      { reference: "PAY-2", amountMinor: 2300, currency: "EUR" }
    ]
  });
  assert.equal(result.settlementAllowed, false);
  assert.equal(result.discrepancies.length, 2);
  assert.ok(result.discrepancies.every(item => item.type === "amount_or_currency_mismatch"));
});

test("rejects duplicate references and malformed statement entries", () => {
  assert.throws(() => reconcileStatements({
    internalEntries: [internal[0], internal[0]], externalEntries: []
  }), /duplicate internal reference/);
  assert.throws(() => reconcileStatements({
    internalEntries: [{ reference: "bad", amountMinor: 1.2, currency: "USD" }],
    externalEntries: []
  }), /non-negative safe integer/);
  assert.throws(() => reconcileStatements({ internalEntries: null, externalEntries: [] }), /must be arrays/);
});


test("rejects duplicate external references", () => {
  const duplicate = { reference: "EXT-1", amountMinor: 500, currency: "USD" };
  assert.throws(() => reconcileStatements({
    internalEntries: [],
    externalEntries: [duplicate, duplicate]
  }), /duplicate external reference/);
});

test("rejects blank references, negative amounts, and malformed currencies", () => {
  assert.throws(() => reconcileStatements({
    internalEntries: [{ reference: "", amountMinor: 100, currency: "USD" }],
    externalEntries: []
  }), /reference is required/);
  assert.throws(() => reconcileStatements({
    internalEntries: [{ reference: "NEG-1", amountMinor: -1, currency: "USD" }],
    externalEntries: []
  }), /non-negative safe integer/);
  assert.throws(() => reconcileStatements({
    internalEntries: [{ reference: "CUR-1", amountMinor: 100, currency: "usd" }],
    externalEntries: []
  }), /uppercase ISO-style code/);
});
