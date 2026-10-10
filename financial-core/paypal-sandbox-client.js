const SANDBOX_API = "https://api-m.sandbox.paypal.com";

function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(name + " is required");
  }
  return value;
}

/**
 * Build a sandbox-only PayPal webhook verifier callback for
 * verifyPayPalWebhook(). This is server-side code: never pass credentials or
 * this callback to browser code. It deliberately refuses live mode.
 */
export function createPayPalSandboxVerifier({
  clientId,
  clientSecret,
  fetchImpl = globalThis.fetch
} = {}) {
  requireNonEmptyString(clientId, "PayPal sandbox client ID");
  requireNonEmptyString(clientSecret, "PayPal sandbox client secret");
  if (typeof fetchImpl !== "function") {
    throw new TypeError("server-side fetch implementation is required");
  }

  return async function verifyWithPayPal({
    transmissionId,
    transmissionTime,
    certUrl,
    authAlgo,
    transmissionSig,
    webhookId,
    webhookEvent
  } = {}) {
    requireNonEmptyString(webhookId, "configured PayPal webhook ID");
    const basic = Buffer.from(clientId + ":" + clientSecret, "utf8").toString("base64");
    const tokenResponse = await fetchImpl(SANDBOX_API + "/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + basic,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: "grant_type=client_credentials"
    });
    if (!tokenResponse || !tokenResponse.ok) {
      throw new Error("PayPal sandbox OAuth token request failed");
    }
    const tokenPayload = await tokenResponse.json();
    if (!tokenPayload || typeof tokenPayload.access_token !== "string" || !tokenPayload.access_token) {
      throw new Error("PayPal sandbox OAuth response did not contain an access token");
    }

    const verificationResponse = await fetchImpl(
      SANDBOX_API + "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + tokenPayload.access_token,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: authAlgo,
          transmission_sig: transmissionSig,
          webhook_id: webhookId,
          webhook_event: webhookEvent
        })
      }
    );
    if (!verificationResponse || !verificationResponse.ok) {
      throw new Error("PayPal sandbox webhook verification request failed");
    }
    const verification = await verificationResponse.json();
    if (!verification || !["SUCCESS", "FAILURE"].includes(verification.verification_status)) {
      throw new Error("PayPal sandbox returned an unknown webhook verification status");
    }
    return verification;
  };
}
