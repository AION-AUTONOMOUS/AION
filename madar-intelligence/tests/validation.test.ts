import { describe, expect, it } from "vitest";
import { validateSearchInput } from "../src/lib/validation";

describe("validateSearchInput", () => {
  it("accepts a valid Arabic query", () => expect(validateSearchInput({ query: "ما آخر أخبار الفضاء؟", language: "ar" })).toEqual({ query: "ما آخر أخبار الفضاء؟", language: "ar" }));
  it("trims whitespace and defaults to Arabic", () => expect(validateSearchInput({ query: "  hello  " })).toEqual({ query: "hello", language: "ar" }));
  it("rejects too-short, too-long, and non-string queries", () => {
    expect(validateSearchInput({ query: "x" })).toBeNull();
    expect(validateSearchInput({ query: "a".repeat(501) })).toBeNull();
    expect(validateSearchInput({ query: 42 })).toBeNull();
    expect(validateSearchInput(null)).toBeNull();
  });
  it("supports English", () => expect(validateSearchInput({ query: "latest climate report", language: "en" })?.language).toBe("en"));
});
