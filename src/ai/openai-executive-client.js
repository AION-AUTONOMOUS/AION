/**
 * Server-side OpenAI Responses API adapter for AION.
 *
 * Disabled by default. Enable only after configuring OPENAI_API_KEY,
 * OPENAI_MODEL, and AION_OPENAI_ENABLED=true in the deployment environment.
 * Never import this module into browser code.
 */
const DEFAULT_TIMEOUT_MS = 20_000;

export async function requestExecutiveAnalysis(input, options = {}) {
  if (process.env.AION_OPENAI_ENABLED !== "true") {
    throw new Error("AION OpenAI integration is disabled");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) {
    throw new Error("OpenAI integration requires OPENAI_API_KEY and OPENAI_MODEL");
  }
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new TypeError("input must be a non-empty string");
  }
  if (input.length > 20_000) {
    throw new RangeError("input exceeds the 20000-character limit");
  }

  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.min(Math.max(options.timeoutMs, 1_000), 30_000)
    : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: input,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Do not include credentials or provider response bodies in thrown errors.
      throw new Error(`OpenAI API request failed with HTTP ${response.status}`);
    }

    const data = await response.json();
    if (typeof data.output_text !== "string" || !data.output_text.trim()) {
      throw new Error("OpenAI API returned no output text");
    }

    return {
      text: data.output_text,
      responseId: typeof data.id === "string" ? data.id : null,
      model,
    };
  } finally {
    clearTimeout(timeout);
  }
}
