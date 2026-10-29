import type { WebSource } from "./search-provider";

export async function generateAnswer(query: string, language: "ar" | "en", sources: WebSource[]): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!key || !model) throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  const sourceText = sources.map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.url}\nExtract: ${s.content}`).join("\n\n");
  const instructions = language === "ar"
    ? "أجب بالعربية الواضحة. اعتمد فقط على مقتطفات المصادر المقدمة، وضع أرقام الاستشهادات مثل [1] بجوار الادعاءات المدعومة. إذا لم تكف الأدلة، صرّح بذلك بوضوح. لا تخترع معلومات أو مصادر."
    : "Answer in clear English. Use only the supplied source excerpts, place numbered citations such as [1] next to supported claims, and clearly state when evidence is insufficient. Never invent facts or sources.";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, instructions, input: `Question: ${query}\n\nWeb sources:\n${sourceText}`, max_output_tokens: 900 }),
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error("AI_PROVIDER_FAILED");
  const payload = await response.json() as { output_text?: unknown; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (typeof payload.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  const text = payload.output?.flatMap((item) => item.content ?? []).filter((part) => part.type === "output_text").map((part) => part.text ?? "").join("\n").trim();
  if (!text) throw new Error("AI_PROVIDER_EMPTY_RESPONSE");
  return text;
}
