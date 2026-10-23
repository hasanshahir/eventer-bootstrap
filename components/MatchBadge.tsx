"use client";

import { matchScore } from "@/lib/match";

export default function MatchBadge({ stack, tags, seed }: { stack: string[]; tags: string[]; seed: string }) {
  const { pct, overlap } = matchScore(stack, tags, seed);
  const cls =
    pct >= 75
      ? "border-blue-600 bg-blue-600 text-white font-bold shadow-[1px_1px_0px_0px_currentColor]"
      : pct >= 50
      ? "border-foreground bg-card text-foreground font-semibold"
      : "border-foreground/40 bg-background text-muted-foreground";

  return (
    <span className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${cls}`}>
      {pct}% Match{overlap.length ? ` • ${overlap.join(", ")}` : ""}
    </span>
  );
}