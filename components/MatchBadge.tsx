"use client";

import { matchScore } from "@/lib/match";

export default function MatchBadge({
  stack,
  tags,
  seed,
}: {
  stack: string[];
  tags: string[];
  seed?: string;
}) {
  const { pct, overlap } = matchScore(stack, tags, seed);

  if (overlap.length === 0 || pct === 0) {
    return (
      <span
        className="font-mono text-[10px] uppercase px-2 py-0.5 border border-foreground/30 bg-background text-muted-foreground"
        title="None of your selected tech stack skills match this event's tags"
      >
        0% • No stack match
      </span>
    );
  }

  const cls =
    pct >= 75
      ? "border-primary bg-primary text-white font-bold shadow-[1px_1px_0px_0px_currentColor]"
      : "border-foreground bg-card text-foreground font-semibold";

  return (
    <span className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${cls}`}>
      {pct}% Match • {overlap.join(", ")}
    </span>
  );
}
