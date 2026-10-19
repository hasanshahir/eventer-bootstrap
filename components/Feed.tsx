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

  const chip = (on: boolean) =>
    `font-mono text-xs px-3 py-1 border transition-all cursor-pointer ${
      on
        ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-600 dark:border-blue-500/50 shadow-sm dark:shadow-[0_0_12px_-2px_rgba(59,130,246,0.3)] font-semibold"
        : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white dark:selection:bg-blue-500 dark:selection:text-black transition-colors">
      {/* Editorial Split Hero Section */}
      <section className="relative border-b-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#030712] transition-colors">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,.6fr)]">
          {/* Main Hero Desk */}
          <div className="relative overflow-hidden border-slate-200 dark:border-zinc-800 px-4 py-12 sm:px-8 sm:py-16 lg:border-r lg:px-12 lg:py-20">
            {/* Subtle paper grid pattern */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-25 dark:opacity-20 pointer-events-none bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
            />

            <div className="relative">
              {/* Meta wire ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 dark:border-zinc-800 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="size-3.5 animate-pulse"
                  >
                    <path d="M216,64H86.51L194.3,31.67a8,8,0,0,0-4.6-15.33l-160,48h0A8,8,0,0,0,24,72V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64ZM104,176H64a8,8,0,0,1,0-16h40a8,8,0,0,1,0,16Zm0-32H64a8,8,0,0,1,0-16h40a8,8,0,0,1,0,16Zm0-32H64a8,8,0,0,1,0-16h40a8,8,0,0,1,0,16Zm64,56a32,32,0,1,1,32-32A32,32,0,0,1,168,168Z" />
                  </svg>
                  Live Pakistan Event Radar
                </span>
                <span className="text-slate-500 dark:text-zinc-500 font-mono">
                  {events.length} open dispatches &bull; Nationwide circuits
                </span>
              </div>

              {/* Large Editorial Headline */}
              <div className="py-8 sm:py-10">
                <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.88] text-slate-900 dark:text-white">
                  Har event,
                  <span className="block italic text-blue-600 dark:text-blue-400 font-normal mt-1">
                    har shehar.
                  </span>
                </h1>
                <p className="mt-8 max-w-[55ch] border-l-4 border-blue-600 dark:border-blue-500 pl-4 text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
                  Pakistan&apos;s deadline-first field guide to hackathons, conferences, campus competitions, and developer meetups. AI-parsed and registered in one tap.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-200 dark:border-zinc-800 pt-6">
                <a
                  href="#events-ledger"
                  className="inline-flex items-center justify-center gap-2 h-12 border border-blue-600 dark:border-blue-400 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-6 text-xs font-semibold uppercase tracking-[0.12em] text-white dark:text-black shadow-sm dark:shadow-[0_0_20px_-4px_rgba(59,130,246,0.7)] transition-all"
                >
                  Explore Live Radar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="size-4"
                  >
                    <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                  </svg>
                </a>
                <Link
                  href="/organizer/new"
                  className="inline-flex items-center justify-center h-12 border border-slate-300 dark:border-zinc-800 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-6 text-xs font-semibold uppercase tracking-[0.12em] text-slate-800 dark:text-zinc-200 transition-colors"
                >
                  Submit a campus event
                </Link>
              </div>
            </div>
          </div>

          {/* Right Rail: Signal Ledger */}
          <aside className="flex flex-col justify-between bg-slate-50/80 dark:bg-zinc-900/90 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-zinc-800 p-6 sm:p-10 lg:p-12 transition-colors">
            <div>
              <div className="flex items-end justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 font-semibold">
                    Incoming signal
                  </p>
                  <p className="mt-1 font-serif text-3xl italic text-slate-900 dark:text-white">Source ledger</p>
                </div>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded border border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold">
                  LIVE
                </span>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-zinc-800/80">
                <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                  <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-600">01</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Campus Desks</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                      NED, FAST, NUST, GIKI
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {events.length}
                  </span>
                </div>

                <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                  <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-600">02</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Google Developer Groups</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                      GDG Kolachi & DevFests
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-bold text-sky-600 dark:text-sky-400">01</span>
                </div>

                <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                  <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-600">03</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">National Olympiads</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                      SOFTEC & CodeSprint
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-bold text-slate-900 dark:text-white">02</span>
                </div>

                <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                  <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-600">04</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Digital Passports</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                      Tamper-evident QR tokens
                    </p>
                  </div>
                  <span className="font-mono text-xs uppercase px-2 py-0.5 rounded border border-blue-500/30 bg-blue-50 dark:bg-transparent text-blue-700 dark:text-blue-400 font-semibold">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-8 border-t border-slate-200 dark:border-zinc-800 pt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-slate-500 dark:text-zinc-500">
              Verified community feeds normalized by Eventer AI parser with instant RFC 5545 calendar export.
            </p>
          </aside>
        </div>
      </section>

      {/* Interactive Ledger Ribbon & Filter Bar */}
      <section id="events-ledger" className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-8 lg:px-12">
        <div className="border-b-2 border-slate-200 dark:border-zinc-800 pb-8 space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                Personalized affinity radar
              </p>
              <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                Active Tech Radar
              </h2>
            </div>
            <p className="font-mono text-xs text-slate-500 dark:text-zinc-400">
              Showing {shown.length} of {events.length} dispatches
            </p>
          </div>

          {/* Tech Stack Switcher */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 p-5 rounded-none space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-zinc-400 font-semibold">
                YOUR TECH STACK (CLICK TO TOGGLE AFFINITY)
              </span>
              <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                {stack.length} skills selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STACK_OPTIONS.map((t) => (
                <button key={t} onClick={() => toggle(t)} className={chip(stack.includes(t))}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Dimensional Filter Buttons */}
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search events, cities, hackathons, or technologies…"
                className="w-full h-11 bg-white dark:bg-[#030712] border border-slate-200 dark:border-zinc-800 px-4 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-blue-600 dark:focus:border-blue-500 outline-none font-mono shadow-sm transition-colors"
              />
            </div>

            {/* City Filters */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`h-11 px-3.5 border font-mono text-xs uppercase tracking-[0.1em] transition-colors ${
                    city.toLowerCase() === c.toLowerCase()
                      ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-400 font-semibold shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-white dark:hover:border-zinc-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`h-11 px-3.5 border font-mono text-xs uppercase tracking-[0.1em] transition-colors ${
                    type.toUpperCase() === t.toUpperCase()
                      ? "border-sky-600 bg-sky-600 text-white dark:border-sky-400 dark:bg-sky-500/20 dark:text-sky-400 font-semibold shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-white dark:hover:border-zinc-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Connected Newspaper Cards Grid */}
        <div className="grid border-l border-t border-slate-200 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-3 mt-8 shadow-sm">
          {shown.map((e, index) => {
            const padIndex = String(index + 1).padStart(2, "0");

            return (
              <article
                key={e.id}
                id={`event-${e.id}`}
                className="group min-h-[22rem] border-b border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#05070f] hover:bg-blue-50/40 dark:hover:bg-zinc-900 transition-all flex flex-col justify-between p-6 sm:p-7"
              >
                <div>
                  {/* Top card row */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3 mb-4">
                    <span className="font-serif text-3xl italic text-slate-300 dark:text-zinc-700 group-hover:text-blue-600 dark:group-hover:text-zinc-400 transition-colors">
                      {padIndex}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400">
                        {e.type}
                      </span>
                      <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        {e.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Organization */}
                  <h3 className="font-serif text-2xl font-bold leading-snug tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {e.title}
                  </h3>

                  <p className="mt-2 text-xs font-mono text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                      className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0"
                    >
                      <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" />
                    </svg>
                    <span>{[e.organizer, e.venue, e.city].filter(Boolean).join(" • ")}</span>
                  </p>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-zinc-400 line-clamp-2">
                    {e.description}
                  </p>

                  {/* Date Badge */}
                  <p className="mt-3 font-mono text-[11px] text-slate-500 dark:text-zinc-500">
                    Starts: {fmtDate(e.startsAt)}
                  </p>

                  {/* Tags & Match Score */}
                  <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                    <MatchBadge stack={stack} tags={e.tags} seed={e.title} />
                    {e.tags.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[10px] px-2 py-0.5 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="mt-6 border-t border-slate-100 dark:border-zinc-800/80 pt-4 flex items-center justify-between">
                  <RsvpButton eventId={e.id} />
                  <Link
                    href={`/passport`}
                    className="font-mono text-[11px] text-slate-500 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-[0.1em] transition-colors"
                  >
                    Pass &rarr;
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {shown.length === 0 && (
          <div className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-16 text-center mt-8">
            <p className="font-serif text-2xl text-slate-600 dark:text-zinc-400">No events matched your filters.</p>
            <p className="font-mono text-xs text-slate-500 dark:text-zinc-500 mt-2">
              Try adjusting your tech stack chips or city selection.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
