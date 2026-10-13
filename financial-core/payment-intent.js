import { createHash } from "node:crypto";

const TOKEN = /^[A-Za-z0-9:_-]{8,160}$/;
const CURRENCY = /^[A-Z]{3,12}$/;
const PROVIDER = /^[a-z][a-z0-9_-]{1,39}$/;
const EVENT_TYPES = new Set(["payment.confirmed", "payment.failed", "payment.refunded"]);

function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function assertToken(value, label) {
  if (typeof value !== "string" || !TOKEN.test(value)) {
    throw new TypeError(label + " is invalid");
  }
}

/**
 * Create an internal payment intent only. This does not create a provider checkout,
 * authorize a charge, or prove that funds were received.
 */
export function createPaymentIntent(input, { now = new Date().toISOString() } = {}) {
  if (!input || typeof input !== "object") throw new TypeError("payment intent input is required");
  assertToken(input.id, "id");
  assertToken(input.orderId, "orderId");
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new TypeError("amountMinor must be a positive safe integer");
  }
  if (typeof input.currency !== "string" || !CURRENCY.test(input.currency)) {
    throw new TypeError("currency is invalid");
  }
  if (typeof input.provider !== "string" || !PROVIDER.test(input.provider)) {
    throw new TypeError("provider is invalid");
  }
  if (typeof now !== "string" || Number.isNaN(Date.parse(now))) {
    throw new TypeError("timestamp is invalid");
  }
  return {
    schema: "aion.payment-intent/0.1",
    id: input.id,
    orderId: input.orderId,
    amountMinor: input.amountMinor,
    currency: input.currency,
    provider: input.provider,
    status: "pending",
    providerReference: null,
    createdAt: now,
    updatedAt: now,
    processedEvents: {}
  };
}

/**
 * Apply a provider event only after the service layer has verified its webhook
 * signature or authenticated the event with the provider API. Never pass browser
 * redirects or client-supplied "paid" flags as verified evidence.
 */
export function applyVerifiedPaymentEvent(intent, event, {
  verified = false,
  now = new Date().toISOString()
} = {}) {
  if (verified !== true) throw new Error("verified provider evidence is required");
  if (!intent || intent.schema !== "aion.payment-intent/0.1" ||
      !intent.processedEvents || typeof intent.processedEvents !== "object") {
    throw new TypeError("payment intent is invalid");
  }
  if (!event || typeof event !== "object") throw new TypeError("provider event is required");
  assertToken(event.id, "event id");
  if (!EVENT_TYPES.has(event.type)) throw new TypeError("provider event type is unsupported");
  if (event.provider !== intent.provider) throw new Error("provider mismatch");
  if (event.amountMinor !== intent.amountMinor || event.currency !== intent.currency) {
    throw new Error("provider amount or currency mismatch");
  }
  if (typeof event.providerReference !== "string" ||
      event.providerReference.length < 1 || event.providerReference.length > 200) {
    throw new TypeError("providerReference is invalid");
  }
  if (typeof now !== "string" || Number.isNaN(Date.parse(now))) {
    throw new TypeError("timestamp is invalid");
  }

  const eventFingerprint = fingerprint({
    id: event.id,
    type: event.type,
    provider: event.provider,
    providerReference: event.providerReference,
    amountMinor: event.amountMinor,
    currency: event.currency
  });
  if (Object.hasOwn(intent.processedEvents, event.id)) {
    if (intent.processedEvents[event.id] !== eventFingerprint) {
      throw new Error("provider event id reused with different content");
    }
    return { intent, duplicate: true };
  }

  const allowed = (
    (intent.status === "pending" && ["payment.confirmed", "payment.failed"].includes(event.type)) ||
    (intent.status === "confirmed" && event.type === "payment.refunded")
  );
  if (!allowed) throw new Error("payment status transition is not allowed");

  const status = event.type === "payment.confirmed"
    ? "confirmed"
    : event.type === "payment.failed"
      ? "failed"
      : "refunded";
  const next = {
    ...intent,
    status,
    providerReference: intent.providerReference ?? event.providerReference,
    updatedAt: now,
    processedEvents: {
      ...intent.processedEvents,
      [event.id]: eventFingerprint
    }
  };
  return { intent: next, duplicate: false };
}
