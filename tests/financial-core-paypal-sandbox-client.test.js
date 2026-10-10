import test from "node:test";
import assert from "node:assert/strict";
import { createPayPalSandboxVerifier } from "../financial-core/paypal-sandbox-client.js";

const eventInput = {
  transmissionId: "transmission-123",
  transmissionTime: "2026-10-10T12:00:00Z",
  certUrl: "https://api.paypal.com/certs/CERT-123",
  authAlgo: "SHA256withRSA",
  transmissionSig: "signature-value",
  webhookId: "configured-webhook-id",
  webhookEvent: { id: "WH-123", event_type: "PAYMENT.CAPTURE.COMPLETED" }
};

function response(payload, ok = true) {
  return { ok, json: async () => payload };
}

test("uses sandbox OAuth then calls PayPal webhook verification endpoint", async () => {
  const calls = [];
  const verify = createPayPalSandboxVerifier({
    clientId: "sandbox-client",
    clientSecret: "sandbox-secret",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/v1/oauth2/token")) {
        return response({ access_token: "sandbox-access-token" });
      }
      return response({ verification_status: "SUCCESS" });
    }
  });

  const result = await verify(eventInput);
  assert.equal(result.verification_status, "SUCCESS");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://api-m.sandbox.paypal.com/v1/oauth2/token");
  assert.equal(calls[0].options.method, "POST");
  assert.match(calls[0].options.headers.Authorization, /^Basic /);
  assert.equal(calls[0].options.body, "grant_type=client_credentials");
  assert.equal(calls[1].url, "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature");
  assert.equal(calls[1].options.headers.Authorization, "Bearer sandbox-access-token");
  const body = JSON.parse(calls[1].options.body);
  assert.equal(body.transmission_id, eventInput.transmissionId);
  assert.equal(body.webhook_id, eventInput.webhookId);
  assert.deepEqual(body.webhook_event, eventInput.webhookEvent);
});

test("does not continue when PayPal OAuth fails or omits an access token", async () => {
  const oauthFailure = createPayPalSandboxVerifier({
    clientId: "id", clientSecret: "secret",
    fetchImpl: async () => response({}, false)
  });
  await assert.rejects(() => oauthFailure(eventInput), /OAuth token request failed/);

  const noToken = createPayPalSandboxVerifier({
    clientId: "id", clientSecret: "secret",
    fetchImpl: async () => response({})
  });
  await assert.rejects(() => noToken(eventInput), /did not contain an access token/);
});

test("fails closed when PayPal verification API errors or returns unknown status", async () => {
  let calls = 0;
  const apiFailure = createPayPalSandboxVerifier({
    clientId: "id", clientSecret: "secret",
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? response({ access_token: "token" }) : response({}, false);
    }
  });
  await assert.rejects(() => apiFailure(eventInput), /verification request failed/);

  calls = 0;
  const unknownStatus = createPayPalSandboxVerifier({
    clientId: "id", clientSecret: "secret",
    fetchImpl: async () => {
      calls += 1;
      return calls === 1
        ? response({ access_token: "token" })
        : response({ verification_status: "UNKNOWN" });
    }
  });
  await assert.rejects(() => unknownStatus(eventInput), /unknown webhook verification status/);
});

test("requires server-side credentials and a fetch implementation", () => {
  assert.throws(() => createPayPalSandboxVerifier({ clientSecret: "secret" }), /client ID is required/);
  assert.throws(() => createPayPalSandboxVerifier({ clientId: "id" }), /client secret is required/);
  assert.throws(() => createPayPalSandboxVerifier({
    clientId: "id", clientSecret: "secret", fetchImpl: null
  }), /fetch implementation is required/);
});
