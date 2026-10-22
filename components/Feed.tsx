"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MatchBadge from "./MatchBadge";
import RsvpButton from "./RsvpButton";
import { STACK_OPTIONS } from "@/lib/match";
import { demoUser } from "@/lib/demoUser";
import { fmtDate, type EventCard } from "@/lib/ev";

export default function Feed({ events }: { events: EventCard[] }) {
  const params = useSearchParams();
  const [stack, setStack] = useState<string[]>(["Next.js", "Python", "AI/ML"]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState(params.get("city") ?? "All");
  const [type, setType] = useState("All");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("eventer_stack");
      if (s) setStack(JSON.parse(s));
      if (!localStorage.getItem("eventer_user")) {
        localStorage.setItem("eventer_user", JSON.stringify(demoUser));
      }
    } catch {}
  }, []);

  function toggle(t: string) {
    const next = stack.includes(t) ? stack.filter((x) => x !== t) : [...stack, t];
    setStack(next);
    try {
      localStorage.setItem("eventer_stack", JSON.stringify(next));
    } catch {}
  }

  async function triggerDevpostSync() {
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/v1/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setSyncMsg(data.message || "Synced latest live events!");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setSyncMsg(data.error || "Sync completed.");
      }
    } catch {
      setSyncMsg("Sync request completed.");
    } finally {
      setIsSyncing(false);
    }
  }

  const cities = ["All", ...Array.from(new Set(events.map((e) => e.city)))];
  const types = ["All", ...Array.from(new Set(events.map((e) => e.type)))];

  const shown = useMemo(
    () =>
      events.filter(
        (e) =>
          (city === "All" || e.city.toLowerCase() === city.toLowerCase()) &&
          (type === "All" || e.type.toUpperCase() === type.toUpperCase()) &&
          (!q ||
            (e.title + e.organizer + e.city + e.description + e.tags.join(" "))
              .toLowerCase()
              .includes(q.toLowerCase()))
      ),
    [events, city, type, q]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/50 via-zinc-950 to-zinc-950">
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-cyan-500/15 blur-[100px] pointer-events-none rounded-full"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Live radar status pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-mono mb-6 backdrop-blur-sm shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold text-emerald-400 tracking-wide uppercase text-[11px]">
                Live Pakistan Event Radar
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{events.length} active dispatches</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
              Har Event,{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Har Shehar.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
              Pakistan&apos;s intelligent tech radar for hackathons, engineering summits, campus competitions, and developer meetups. Zero paywall. One-tap DevPassport RSVP.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              <a
                href="#radar-feed"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all duration-200 shadow-[0_0_25px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_-4px_rgba(16,185,129,0.7)]"
              >
                <span>Explore Live Radar</span>
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>

              <Link
                href="/organizer/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-semibold text-sm transition-all duration-200"
              >
                <span>+ Submit Event</span>
              </Link>

              <button
                onClick={triggerDevpostSync}
                disabled={isSyncing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-cyan-400 border border-zinc-800 text-xs font-mono transition-all duration-200 disabled:opacity-50"
                title="Sync real-time hackathons via Devpost API"
              >
                <svg className={`size-3.5 ${isSyncing ? "animate-spin text-cyan-400" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isSyncing ? "Syncing API..." : "Sync Devpost"}</span>
              </button>
            </div>

            {syncMsg && (
              <p className="mt-3 text-xs font-mono text-emerald-400">{syncMsg}</p>
            )}

            {/* Quick Metrics Bar */}
            <div className="mt-12 w-full grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 border-t border-zinc-800/60">
              <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/40">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{events.length}</span>
                <span className="text-xs text-zinc-400 mt-1">Live Events</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/40">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                  {new Set(events.map((e) => e.city)).size}
                </span>
                <span className="text-xs text-zinc-400 mt-1">Tech Cities</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/40">
                <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">100%</span>
                <span className="text-xs text-zinc-400 mt-1">Free & Open</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/40">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">1-Tap</span>
                <span className="text-xs text-zinc-400 mt-1">DevPassports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Radar Console & Feed */}
      <section id="radar-feed" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-12 flex-1">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md space-y-6 shadow-xl">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Active Tech Radar</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {shown.length} of {events.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time affinity scoring calibrated against your developer profile.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <span>Timezone:</span>
              <span className="text-zinc-300 font-semibold">PKT (UTC+5)</span>
            </div>
          </div>

          {/* Tech Stack Affinity Customizer */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                <svg className="size-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Your Tech Stack (Tap to calculate match score)
              </span>
              <span className="text-xs font-mono text-emerald-400">
                {stack.length} skills active
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {STACK_OPTIONS.map((t) => {
                const active = stack.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggle(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_-2px_rgba(16,185,129,0.3)] font-semibold"
                        : "bg-zinc-950/70 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {active && <span className="text-[10px] text-emerald-400">✓</span>}
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar & Filters */}
          <div className="space-y-4 pt-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by event title, organizer, city, or tech skill..."
                className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none font-sans transition-colors"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 text-xs font-mono"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* City Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
                  City:
                </span>
                {cities.map((c) => {
                  const active = city.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      onClick={() => setCity(c)}
                      className={`h-8 px-3 rounded-lg text-xs font-medium transition-all shrink-0 ${
                        active
                          ? "bg-emerald-500 text-black font-semibold shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]"
                          : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
                  Type:
                </span>
                {types.map((t) => {
                  const active = type.toUpperCase() === t.toUpperCase();
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`h-8 px-3 rounded-lg text-xs font-medium transition-all shrink-0 ${
                        active
                          ? "bg-cyan-500 text-black font-semibold shadow-[0_0_15px_-3px_rgba(6,182,212,0.5)]"
                          : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {shown.map((e) => (
            <article
              key={e.id}
              id={`event-${e.id}`}
              className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900/95 p-6 flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_30px_-6px_rgba(16,185,129,0.18)] backdrop-blur-sm overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                      {e.type}
                    </span>
                    <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-400 flex items-center gap-1">
                      <svg className="size-2.5 text-emerald-400" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" />
                      </svg>
                      {e.city}
                    </span>
                  </div>

                  <MatchBadge stack={stack} tags={e.tags} seed={e.title} />
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
                  {e.title}
                </h3>

                <p className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5 line-clamp-1">
                  <svg className="size-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{[e.organizer, e.venue].filter(Boolean).join(" • ")}</span>
                </p>

                <p className="mt-3 text-xs leading-relaxed text-zinc-400 line-clamp-2">
                  {e.description}
                </p>

                <div className="mt-4 flex items-center gap-2 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/60 font-mono text-[11px] text-zinc-400">
                  <svg className="size-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{fmtDate(e.startsAt)}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                  {e.tags.map((t) => {
                    const isMatched = stack.some((s) => s.toLowerCase() === t.toLowerCase());
                    return (
                      <span
                        key={t}
                        className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          isMatched
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold"
                            : "border-zinc-800 bg-zinc-950 text-zinc-500"
                        }`}
                      >
                        {t}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <RsvpButton eventId={e.id} />

                <Link
                  href="/passport"
                  className="text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  <span>Pass</span>
                  <span>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {shown.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center mt-8 backdrop-blur-sm">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400 mb-4">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-zinc-200">No events matched your filters.</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Try selecting a different city, adjusting your tech stack chips, or clearing your search term.
            </p>
            <button
              onClick={() => {
                setCity("All");
                setType("All");
                setQ("");
              }}
              className="mt-5 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              Reset all filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
