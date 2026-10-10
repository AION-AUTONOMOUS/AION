import test from "node:test";
import assert from "node:assert/strict";
import { verifyPayPalWebhook } from "../financial-core/paypal-webhook-verifier.js";

const headers = {
  "paypal-transmission-id": "transmission-123",
  "paypal-transmission-time": "2026-10-10T12:00:00Z",
  "paypal-cert-url": "https://api.paypal.com/certs/CERT-123",
  "paypal-auth-algo": "SHA256withRSA",
  "paypal-transmission-sig": "signature-value"
};
const body = {
  id: "WH-00000001",
  event_type: "PAYMENT.CAPTURE.COMPLETED",
  resource: { id: "capture-123", status: "COMPLETED" }
};

test("accepts only a successful response from the trusted PayPal verifier", async () => {
  let submitted;
  const result = await verifyPayPalWebhook({
    headers,
    body,
    webhookId: "configured-webhook-id",
    verifyWithPayPal: async (input) => {
      submitted = input;
      return { verification_status: "SUCCESS" };
    }
  });
  assert.equal(result.verified, true);
  assert.equal(result.provider, "paypal");
  assert.equal(result.eventId, body.id);
  assert.equal(result.eventType, body.event_type);
  assert.deepEqual(submitted.webhookEvent, body);
  assert.equal(submitted.webhookId, "configured-webhook-id");
  assert.equal(submitted.transmissionSig, headers["paypal-transmission-sig"]);
});

test("normalizes header names but requires every PayPal transmission header", async () => {
  const mixedCase = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toUpperCase(), value])
  );
  const result = await verifyPayPalWebhook({
    headers: mixedCase,
    body,
    webhookId: "configured-webhook-id",
    verifyWithPayPal: async () => ({ verification_status: "SUCCESS" })
  });
  assert.equal(result.verified, true);

  const missing = { ...headers };
  delete missing["paypal-transmission-sig"];
  await assert.rejects(() => verifyPayPalWebhook({
    headers: missing,
    body,
    webhookId: "configured-webhook-id",
    verifyWithPayPal: async () => ({ verification_status: "SUCCESS" })
  }), /missing required PayPal transmission header/);
});

test("rejects failed, absent, or unknown PayPal verification results", async () => {
  for (const response of [
    { verification_status: "FAILURE" },
    {},
    null
  ]) {
    await assert.rejects(() => verifyPayPalWebhook({
      headers,
      body,
      webhookId: "configured-webhook-id",
      verifyWithPayPal: async () => response
    }), /did not confirm webhook authenticity/);
  }
});

test("requires original event body, configured webhook ID, and trusted verifier", async () => {
  await assert.rejects(() => verifyPayPalWebhook({
    headers, body: null, webhookId: "configured-webhook-id",
    verifyWithPayPal: async () => ({ verification_status: "SUCCESS" })
  }), /original PayPal webhook body/);
  await assert.rejects(() => verifyPayPalWebhook({
    headers, body, webhookId: " ",
    verifyWithPayPal: async () => ({ verification_status: "SUCCESS" })
  }), /webhook ID/);
  await assert.rejects(() => verifyPayPalWebhook({
    headers, body, webhookId: "configured-webhook-id"
  }), /trusted PayPal verification callback/);
});

test("does not convert verification service errors into a verified event", async () => {
  await assert.rejects(() => verifyPayPalWebhook({
    headers,
    body,
    webhookId: "configured-webhook-id",
    verifyWithPayPal: async () => { throw new Error("PayPal API unavailable"); }
  }), /PayPal API unavailable/);
});
