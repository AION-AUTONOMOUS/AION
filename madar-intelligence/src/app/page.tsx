"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Source = { title: string; url: string; content: string; score?: number };
type SearchResponse = { answer?: string; sources?: Source[]; error?: string };

export default function Home() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const isArabic = language === "ar";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || query.trim().length < 2) return;
    setLoading(true); setResult(null);
    try {
      const response = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: query.trim(), language }) });
      const data = await response.json() as SearchResponse;
      if (!response.ok) throw new Error(data.error || (isArabic ? "حدث خطأ غير متوقع." : "Something went wrong."));
      setResult(data);
    } catch (error) { setResult({ error: error instanceof Error ? error.message : (isArabic ? "تعذر الاتصال." : "Connection failed.") }); }
    finally { setLoading(false); }
  }

  return <main className="shell" dir={isArabic ? "rtl" : "ltr"}>
    <header className="topbar"><Link className="brand" href="/" aria-label="MADAR home"><span className="brand-mark">م</span><span>MADAR <b>INTELLIGENCE</b></span></Link><button className="language" type="button" onClick={() => setLanguage(isArabic ? "en" : "ar")} aria-label="Switch language">{isArabic ? "EN" : "عربي"} <span aria-hidden="true">↗</span></button></header>
    <section className="hero"><div className="eyebrow"><span className="pulse" /> {isArabic ? "محرك بحث ذكي — من العالم إلى المعنى" : "INTELLIGENT SEARCH — FROM THE WEB TO INSIGHT"}</div><h1>{isArabic ? <>العالم أوسع من <em>إجابة واحدة.</em></> : <>The world is bigger than <em>one answer.</em></>}</h1><p className="subtitle">{isArabic ? "اكتشف العالم. افهم ما وراءه. ابحث، قارن، وتحقق من المصادر." : "The World, Better Understood. Search, compare, and verify with sources."}</p>
    <form className="searchbox" onSubmit={submit}><label className="sr-only" htmlFor="query">{isArabic ? "اكتب سؤالك" : "Ask a question"}</label><span className="search-icon" aria-hidden="true">⌕</span><input id="query" value={query} onChange={e => setQuery(e.target.value)} maxLength={500} minLength={2} placeholder={isArabic ? "ما الذي تريد فهمه اليوم؟" : "What would you like to understand today?"} required autoComplete="off" /><button type="submit" disabled={loading || query.trim().length < 2}>{loading ? (isArabic ? "جارٍ البحث…" : "Searching…") : (isArabic ? "ابحث" : "Search")} <span aria-hidden="true">↗</span></button></form>
    <div className="hint">{isArabic ? "إجابات بمصادر • عربي وإنجليزي • لا نخفي عدم اليقين" : "Sourced answers • Arabic & English • Uncertainty made visible"}</div></section>
    {loading && <section className="status" role="status" aria-live="polite"><span className="loader" />{isArabic ? "نبحث في الويب ونراجع المصادر…" : "Searching the web and reviewing sources…"}</section>}
    {result?.error && <section className="error" role="alert"><b>{isArabic ? "لم يكتمل البحث" : "Search incomplete"}</b><p>{result.error}</p></section>}
    {result?.answer && <section className="results" aria-live="polite"><div className="section-head"><div><span className="eyebrow">{isArabic ? "ملخص مدعوم بالمصادر" : "SOURCE-BACKED SUMMARY"}</span><h2>{isArabic ? "ما وجدناه" : "What we found"}</h2></div><span className="source-count">{result.sources?.length ?? 0} {isArabic ? "مصادر" : "sources"}</span></div><article className="answer">{result.answer.split(/(\\[\\d+\\])/g).map((part, i) => /^\\[\\d+\\]$/.test(part) ? <sup key={i} className="citation">{part}</sup> : <span key={i}>{part}</span>)}</article><div className="sources"><h3>{isArabic ? "المصادر الأصلية" : "Original sources"}</h3>{result.sources?.map((source, index) => <a className="source" href={source.url} target="_blank" rel="noopener noreferrer" key={source.url}><span className="source-number">[{index + 1}]</span><span className="source-body"><b>{source.title}</b><small>{new URL(source.url).hostname}</small><span>{source.content}</span></span><span aria-hidden="true" className="external">↗</span></a>)}</div><p className="disclaimer">{isArabic ? "تحقق من المصدر الأصلي قبل اتخاذ قرارات مهمة. قد تحتوي المصادر على معلومات ناقصة أو متعارضة." : "Check original sources before making important decisions. Sources may be incomplete or conflicting."}</p></section>}
    <footer><span>© {new Date().getFullYear()} MADAR Intelligence</span><span>{isArabic ? "الوضوح يبدأ بالسؤال الصحيح." : "Clarity begins with the right question."}</span></footer>
  </main>;
}
