export type WebSource = { title: string; url: string; content: string; score?: number };

export async function searchWeb(query: string): Promise<WebSource[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("SEARCH_PROVIDER_NOT_CONFIGURED");
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, query, search_depth: "basic", max_results: 6, include_answer: false }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("SEARCH_PROVIDER_FAILED");
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { results?: unknown }).results)) {
    throw new Error("SEARCH_PROVIDER_INVALID_RESPONSE");
  }
  return ((payload as { results: Record<string, unknown>[] }).results).flatMap((item) => {
    if (typeof item.url !== "string" || typeof item.title !== "string") return [];
    try {
      const parsed = new URL(item.url);
      if (!["https:", "http:"].includes(parsed.protocol)) return [];
      return [{ title: item.title.slice(0, 300), url: parsed.toString(), content: typeof item.content === "string" ? item.content.slice(0, 4000) : "", score: typeof item.score === "number" ? item.score : undefined }];
    } catch { return []; }
  });
}
