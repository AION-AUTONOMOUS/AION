export type SearchInput = { query: string; language: "ar" | "en" };

export function validateSearchInput(value: unknown): SearchInput | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (typeof body.query !== "string") return null;
  const query = body.query.trim();
  if (query.length < 2 || query.length > 500) return null;
  const language = body.language === "en" ? "en" : "ar";
  return { query, language };
}
