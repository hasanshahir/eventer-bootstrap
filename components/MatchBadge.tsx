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
      ? "text-blue-700 dark:text-blue-400 border-blue-500/40 bg-blue-50 dark:bg-blue-500/15 dark:shadow-[0_0_14px_-4px_rgba(59,130,246,0.7)]"
      : pct >= 60
      ? "text-sky-700 dark:text-sky-400 border-sky-400/40 bg-sky-50 dark:bg-sky-500/15"
      : "text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800/50";

  return (
    <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${cls}`}>
      {pct}% Match{overlap.length ? ` • ${overlap.join(", ")}` : ""}
    </span>
  );
}
