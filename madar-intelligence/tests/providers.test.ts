import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAnswer } from "../src/lib/ai-provider";
import { searchWeb } from "../src/lib/search-provider";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Tavily search provider", () => {
  it("returns original source URLs from real-shaped search results", async () => {
    vi.stubEnv("TAVILY_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      results: [{ title: "Example source", url: "https://example.com/report", content: "Source excerpt", score: 0.91 }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchWeb("climate report")).resolves.toEqual([
      { title: "Example source", url: "https://example.com/report", content: "Source excerpt", score: 0.91 },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.tavily.com/search");
  });

  it("fails closed when the key is missing", async () => {
    vi.stubEnv("TAVILY_API_KEY", "");
    await expect(searchWeb("climate report")).rejects.toThrow("SEARCH_PROVIDER_NOT_CONFIGURED");
  });

  it("returns a generic provider error for an upstream failure", async () => {
    vi.stubEnv("TAVILY_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private upstream details", { status: 500 })));
    await expect(searchWeb("climate report")).rejects.toThrow("SEARCH_PROVIDER_FAILED");
  });

  it("propagates a timeout abort without exposing credentials", async () => {
    vi.stubEnv("TAVILY_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("The operation was aborted", "TimeoutError")));
    await expect(searchWeb("climate report")).rejects.toMatchObject({ name: "TimeoutError" });
  });
});

describe("OpenAI answer provider", () => {
  it("returns generated answer text from the Responses API", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_MODEL", "gpt-4.1-mini");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output_text: "Evidence-based answer [1]" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const sources = [{ title: "Example source", url: "https://example.com/report", content: "Source excerpt" }];

    await expect(generateAnswer("question", "en", sources)).resolves.toBe("Evidence-based answer [1]");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.openai.com/v1/responses");
  });

  it("fails closed when API configuration is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_MODEL", "");
    await expect(generateAnswer("question", "en", [])).rejects.toThrow("AI_PROVIDER_NOT_CONFIGURED");
  });

  it("returns a generic error when OpenAI rejects the request", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_MODEL", "gpt-4.1-mini");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private upstream details", { status: 500 })));
    await expect(generateAnswer("question", "en", [])).rejects.toThrow("AI_PROVIDER_FAILED");
  });

  it("propagates a timeout abort", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_MODEL", "gpt-4.1-mini");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("The operation was aborted", "TimeoutError")));
    await expect(generateAnswer("question", "en", [])).rejects.toMatchObject({ name: "TimeoutError" });
  });
});
