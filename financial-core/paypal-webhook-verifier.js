const REQUIRED_HEADERS = [
  "paypal-transmission-id",
  "paypal-transmission-time",
  "paypal-cert-url",
  "paypal-auth-algo",
  "paypal-transmission-sig"
];

/**
 * Verify a PayPal webhook by delegating signature validation to PayPal's
 * verify-webhook-signature API through a trusted server-side callback.
 *
 * This helper does not make network requests and is not a replacement for the
 * PayPal API client. The callback must authenticate to PayPal server-to-server,
 * submit the original transmission headers/body and configured webhook ID, and
 * return PayPal's response. Never let a browser or untrusted request supply the
 * callback or mark an event verified.
 */
export async function verifyPayPalWebhook({
  headers,
  body,
  webhookId,
  verifyWithPayPal
} = {}) {
  if (!headers || typeof headers !== "object") {
    throw new TypeError("PayPal transmission headers are required");
  }
  const normalized = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[String(key).toLowerCase()] = value;
  }
  for (const name of REQUIRED_HEADERS) {
    if (typeof normalized[name] !== "string" || normalized[name].trim() === "") {
      throw new Error("missing required PayPal transmission header: " + name);
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new TypeError("original PayPal webhook body is required");
  }
  if (typeof webhookId !== "string" || webhookId.trim() === "") {
    throw new TypeError("configured PayPal webhook ID is required");
  }
  if (typeof verifyWithPayPal !== "function") {
    throw new TypeError("trusted PayPal verification callback is required");
  }

  const result = await verifyWithPayPal({
    transmissionId: normalized["paypal-transmission-id"],
    transmissionTime: normalized["paypal-transmission-time"],
    certUrl: normalized["paypal-cert-url"],
    authAlgo: normalized["paypal-auth-algo"],
    transmissionSig: normalized["paypal-transmission-sig"],
    webhookId,
    webhookEvent: body
  });

  if (!result || result.verification_status !== "SUCCESS") {
    throw new Error("PayPal did not confirm webhook authenticity");
  }

  return {
    verified: true,
    provider: "paypal",
    eventId: typeof body.id === "string" ? body.id : null,
    eventType: typeof body.event_type === "string" ? body.event_type : null,
    resource: body.resource ?? null
  };
}
