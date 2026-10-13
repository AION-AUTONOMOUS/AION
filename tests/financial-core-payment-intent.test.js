import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  applyVerifiedPaymentEvent
} from "../financial-core/payment-intent.js";

const intent = () => createPaymentIntent({
  id: "intent:00000001",
  orderId: "order:00000001",
  amountMinor: 1500,
  currency: "USD",
  provider: "paypal"
}, { now: "2026-10-10T00:00:00.000Z" });

const event = (overrides = {}) => ({
  id: "event:00000001",
  type: "payment.confirmed",
  provider: "paypal",
  providerReference: "provider-order-123",
  amountMinor: 1500,
  currency: "USD",
  ...overrides
});

test("creates a pending internal intent without claiming payment success", () => {
  const created = intent();
  assert.equal(created.status, "pending");
  assert.equal(created.providerReference, null);
  assert.deepEqual(created.processedEvents, {});
});

test("rejects payment events without verified provider evidence", () => {
  assert.throws(
    () => applyVerifiedPaymentEvent(intent(), event()),
    /verified provider evidence/
  );
});

test("confirms only a matching provider amount and currency", () => {
  const result = applyVerifiedPaymentEvent(intent(), event(), {
    verified: true,
    now: "2026-10-10T00:01:00.000Z"
  });
  assert.equal(result.intent.status, "confirmed");
  assert.equal(result.intent.providerReference, "provider-order-123");
  assert.equal(result.duplicate, false);
});

test("rejects amount, currency, and provider mismatches", () => {
  assert.throws(() => applyVerifiedPaymentEvent(intent(), event({ amountMinor: 1499 }), {
    verified: true
  }), /amount or currency mismatch/);
  assert.throws(() => applyVerifiedPaymentEvent(intent(), event({ currency: "EUR" }), {
    verified: true
  }), /amount or currency mismatch/);
  assert.throws(() => applyVerifiedPaymentEvent(intent(), event({ provider: "other" }), {
    verified: true
  }), /provider mismatch/);
});

test("deduplicates the same verified event and rejects event-id reuse", () => {
  const first = applyVerifiedPaymentEvent(intent(), event(), { verified: true });
  const duplicate = applyVerifiedPaymentEvent(first.intent, event(), { verified: true });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.intent.status, "confirmed");
  assert.throws(() => applyVerifiedPaymentEvent(first.intent, event({
    providerReference: "different-reference"
  }), { verified: true }), /reused with different content/);
});

test("allows refund only after confirmation and does not allow a second terminal transition", () => {
  const confirmed = applyVerifiedPaymentEvent(intent(), event(), { verified: true });
  const refunded = applyVerifiedPaymentEvent(confirmed.intent, event({
    id: "event:00000002",
    type: "payment.refunded"
  }), { verified: true });
  assert.equal(refunded.intent.status, "refunded");
  assert.throws(() => applyVerifiedPaymentEvent(refunded.intent, event({
    id: "event:00000003",
    type: "payment.confirmed"
  }), { verified: true }), /transition is not allowed/);
});

test("rejects invalid money amounts", () => {
  assert.throws(() => createPaymentIntent({
    id: "intent:00000002",
    orderId: "order:00000002",
    amountMinor: 0,
    currency: "USD",
    provider: "paypal"
  }), /positive safe integer/);
});
