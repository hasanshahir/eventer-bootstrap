"use client";
import { matchScore } from "@/lib/match";

export default function MatchBadge({
  stack,
  tags,
  seed,
}: {
  stack: string[];
  tags: string[];
  seed: string;
}) {
  const { pct, overlap } = matchScore(stack, tags, seed);
  const cls =
    pct >= 80
      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_14px_-4px_rgba(16,185,129,0.7)]"
      : pct >= 60
      ? "text-cyan-400 border-cyan-500/40 bg-cyan-500/10"
      : "text-zinc-400 border-zinc-700 bg-zinc-800/50";

  return (
    <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full border ${cls}`}>
      {pct}% Match{overlap.length ? ` • ${overlap.join(", ")}` : ""}
    </span>
  );
}
