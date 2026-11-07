import { NextRequest, NextResponse } from "next/server";
import { generateAnswer } from "@/lib/ai-provider";
import { searchWeb } from "@/lib/search-provider";
import { validateSearchInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 8;

function allowed(key: string): boolean {
  const now = Date.now();
  for (const [id, value] of hits) if (value.resetAt <= now) hits.delete(id);
  const current = hits.get(key);
  if (!current || current.resetAt <= now) { hits.set(key, { count: 1, resetAt: now + WINDOW_MS }); return true; }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwarded || request.headers.get("x-real-ip") || "unknown";
  if (!allowed(clientKey)) return NextResponse.json({ error: "تم تجاوز حد الطلبات. حاول بعد دقيقة. / Rate limit exceeded." }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "طلب غير صالح / Invalid JSON." }, { status: 400 }); }
  const input = validateSearchInput(body);
  if (!input) return NextResponse.json({ error: "اكتب سؤالًا من حرفين إلى 500 حرف. / Query must be 2–500 characters." }, { status: 400 });
  try {
    const sources = await searchWeb(input.query);
    if (!sources.length) return NextResponse.json({ error: "لم يُعثر على مصادر مناسبة. جرّب صياغة أخرى. / No relevant sources found." }, { status: 502 });
    const answer = await generateAnswer(input.query, input.language, sources);
    return NextResponse.json({ answer, sources: sources.map(({ title, url, content, score }) => ({ title, url, content, score })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code.endsWith("NOT_CONFIGURED") ? 503 : 502;
    const message = status === 503 ? "البحث أو الذكاء الاصطناعي غير مُعدّ بعد. أضف مفاتيح الخدمات في إعدادات الخادم. / Providers are not configured." : "تعذر إكمال البحث الآن. حاول لاحقًا. / Search failed; try again later.";
    console.error("MADAR_SEARCH_ERROR", { code });
    return NextResponse.json({ error: message }, { status });
  }
}
