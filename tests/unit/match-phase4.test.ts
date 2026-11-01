import { describe, expect, it } from "vitest";
import { deriveTags, matchesKeywordToken, matchScore } from "@/lib/match";

describe("Phase 4 — Word-Boundary Tag Matching & Honest Stack Affinity (F-06)", () => {
  it("1. matchesKeywordToken uses strict word boundaries so 'ai' and 'ml' never match inside 'email', 'domain', 'main', or 'html'", () => {
    expect(matchesKeywordToken("Send your email to register", "ai")).toBe(false);
    expect(matchesKeywordToken("Custom domain and main stage", "ai")).toBe(false);
    expect(matchesKeywordToken("Static HTML and YAML workshop", "ml")).toBe(false);

    expect(matchesKeywordToken("National AI Summit 2026", "ai")).toBe(true);
    expect(matchesKeywordToken("Applied AI/ML Bootcamp", "ai/ml")).toBe(true);
    expect(matchesKeywordToken("Hands-on ML with Python", "ml")).toBe(true);
  });

  it("2. deriveTags extracts accurate tags without false-positive substring matches", () => {
    const falsePositiveCandidate = deriveTags(
      "Main Stage Orientation",
      "Confirm your email and domain before joining the HTML session."
    );
    expect(falsePositiveCandidate).not.toContain("AI/ML");

    const aiNextCandidate = deriveTags(
      "Karachi GenAI & Next.js Build Sprint",
      "Build production LLM agents with Next.js and Python."
    );
    expect(aiNextCandidate).toContain("AI/ML");
    expect(aiNextCandidate).toContain("Next.js");
    expect(aiNextCandidate).toContain("Python");
  });

  it("3. matchScore returns 0% when user stack has zero overlap with event tags (never fabricates 41-55% random scores)", () => {
    const noOverlap = matchScore(
      ["Flutter", "Cybersecurity"],
      ["Next.js", "Python", "AI/ML"],
      "Any Event Title"
    );
    expect(noOverlap.pct).toBe(0);
    expect(noOverlap.overlap).toEqual([]);

    const partialOverlap = matchScore(
      ["Next.js", "Flutter"],
      ["Next.js", "AI/ML"],
      "Any Event Title"
    );
    expect(partialOverlap.pct).toBeGreaterThanOrEqual(55);
    expect(partialOverlap.overlap).toEqual(["Next.js"]);

    const fullOverlap = matchScore(
      ["Next.js", "AI/ML", "Python"],
      ["Next.js", "AI/ML"],
      "Any Event Title"
    );
    expect(fullOverlap.pct).toBeGreaterThanOrEqual(90);
    expect(fullOverlap.overlap).toEqual(["Next.js", "AI/ML"]);
  });
});

