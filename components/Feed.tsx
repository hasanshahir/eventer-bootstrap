"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MatchBadge from "./MatchBadge";
import RsvpButton from "./RsvpButton";
import { STACK_OPTIONS } from "@/lib/match";
import { demoUser } from "@/lib/demoUser";
import { fmtDate, type EventCard } from "@/lib/ev";

const PK_CITIES: Record<string, { lat: number; lng: number }> = {
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Faisalabad: { lat: 31.4504, lng: 73.1350 },
};

function getNearestCity(lat: number, lng: number): string {
  let closest = "Karachi";
  let minD = Infinity;
  for (const [name, coord] of Object.entries(PK_CITIES)) {
    const d = Math.hypot(lat - coord.lat, lng - coord.lng);
    if (d < minD) {
      minD = d;
      closest = name;
    }
  }
  return closest;
}

export default function Feed({ events }: { events: EventCard[] }) {
  const params = useSearchParams();
  const [stack, setStack] = useState<string[]>(["Next.js", "Python", "AI/ML"]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState(params.get("city") ?? "All");
  const [type, setType] = useState("All");

  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locMsg, setLocMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("eventer_stack");
      if (s) setStack(JSON.parse(s));
      if (!localStorage.getItem("eventer_user")) {
        localStorage.setItem("eventer_user", JSON.stringify(demoUser));
      }
      const savedGeo = localStorage.getItem("eventer_geo_city");
      if (savedGeo) {
        setDetectedCity(savedGeo);
        setCity(savedGeo);
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

  function detectLocation() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocMsg("Geolocation not supported by browser");
      return;
    }
    setLocLoading(true);
    setLocMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = getNearestCity(pos.coords.latitude, pos.coords.longitude);
        setDetectedCity(nearest);
        setCity(nearest);
        setLocLoading(false);
        try {
          localStorage.setItem("eventer_geo_city", nearest);
        } catch {}
      },
      () => {
        setLocMsg("Location permission denied or unavailable");
        setLocLoading(false);
      },
      { timeout: 8000 }
    );
  }

  function turnOffLocation() {
    setDetectedCity(null);
    setCity("All");
    setLocMsg(null);
    try {
      localStorage.removeItem("eventer_geo_city");
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
        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_-2px_rgba(16,185,129,0.3)]"
        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
    }`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Editorial Split Hero Section */}
      <section className="relative border-b-2 border-zinc-800 bg-zinc-950">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,.6fr)]">
          <div className="relative overflow-hidden border-zinc-800 px-4 py-12 sm:px-8 sm:py-16 lg:border-r lg:px-12 lg:py-20">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
            />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-zinc-800 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                <span className="flex items-center gap-2 text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Pakistan Event Radar
                </span>
                <span className="text-zinc-500 font-mono">
                  {events.length} open dispatches &bull; Nationwide circuits
                </span>
              </div>

              <div className="py-8 sm:py-10">
                <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.88] text-white">
                  Har event,
                  <span className="block italic text-emerald-400 font-normal mt-1">
                    har shehar.
                  </span>
                </h1>
                <p className="mt-8 max-w-[55ch] border-l-4 border-emerald-500 pl-4 text-sm sm:text-base font-medium leading-relaxed text-zinc-300">
                  Pakistan&apos;s deadline-first field guide to hackathons, conferences, campus competitions, and developer meetups. AI-parsed and registered in one tap.
                </p>
              </div>

              {/* Actions with Location Toggle */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 border-t border-zinc-800 pt-6">
                <a
                  href="#events-ledger"
                  className="inline-flex items-center justify-center gap-2 h-12 border border-zinc-700 bg-emerald-500 px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.7)] transition-all font-mono"
                >
                  Explore Live Radar
                </a>

                {detectedCity ? (
                  <div className="inline-flex items-center h-12 border border-emerald-500/50 bg-emerald-500/10 px-4 text-xs font-mono text-emerald-400 gap-3">
                    <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      Near Me: {detectedCity}
                    </span>
                    <button
                      onClick={turnOffLocation}
                      className="border border-zinc-700 hover:border-zinc-500 bg-zinc-900 px-2 py-1 text-[10px] uppercase font-semibold text-zinc-300 hover:text-white transition-colors"
                      title="Turn off location"
                    >
                      Turn Off ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={detectLocation}
                    disabled={locLoading}
                    className="inline-flex items-center justify-center gap-2 h-12 border border-zinc-800 bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-colors font-mono"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                      className={`size-4 text-emerald-400 ${locLoading ? "animate-spin" : ""}`}
                    >
                      <path d="M128,64a64,64,0,1,0,64,64A64.07,64.07,0,0,0,128,64Zm0,112a48,48,0,1,1,48-48A48.05,48.05,0,0,1,128,176ZM232,120H207.28A80.19,80.19,0,0,0,136,48.72V24a8,8,0,0,0-16,0V48.72A80.19,80.19,0,0,0,48.72,120H24a8,8,0,0,0,0,16H48.72A80.19,80.19,0,0,0,120,207.28V232a8,8,0,0,0,16,0V207.28A80.19,80.19,0,0,0,207.28,136H232a8,8,0,0,0,0-16Z" />
                    </svg>
                    {locLoading ? "Locating..." : "Find Events Near Me"}
                  </button>
                )}

                <Link
                  href="/organizer/new"
                  className="inline-flex items-center justify-center h-12 border border-zinc-800 bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200 hover:bg-zinc-800 transition-colors font-mono"
                >
                  Submit a campus event
                </Link>
              </div>

              {locMsg && (
                <p className="mt-3 font-mono text-[11px] text-amber-400/90 flex items-center gap-1.5">
                  <span>⚠</span> {locMsg}
                </p>
              )}
            </div>
          </div>

          {/* Right Rail: Signal Ledger */}
          <aside className="flex flex-col justify-between bg-zinc-900/90 border-t lg:border-t-0 lg:border-l border-zinc-800 p-6 sm:p-10 lg:p-12">
            <div>
              <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold">
                    Incoming signal
                  </p>
                  <p className="mt-1 font-serif text-3xl italic text-white">Source ledger</p>
                </div>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  LIVE
                </span>
              </div>

              <div className="divide-y divide-zinc-800/80">
                <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                  <span className="font-mono text-[11px] text-zinc-600">01</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Campus Desks</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      NED, FAST, NUST, GIKI
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-bold text-emerald-400">
                    {events.length}
                  </span>
                </div>

                <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                  <span className="font-mono text-[11px] text-zinc-600">02</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Google Developer Groups</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      GDG Kolachi & DevFests
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-bold text-cyan-400">01</span>
                </div>

                <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                  <span className="font-mono text-[11px] text-zinc-600">03</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">National Olympiads</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      SOFTEC & CodeSprint
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-bold text-white">02</span>
                </div>

                <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                  <span className="font-mono text-[11px] text-zinc-600">04</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Digital Passports</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Tamper-evident QR tokens
                    </p>
                  </div>
                  <span className="font-mono text-xs uppercase px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-8 border-t border-zinc-800 pt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-zinc-500">
              Verified community feeds normalized by Eventer AI parser with instant RFC 5545 calendar export.
            </p>
          </aside>
        </div>
      </section>

      {/* Interactive Ledger Ribbon & Filter Bar */}
      <section id="events-ledger" className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-8 lg:px-12">
        <div className="border-b-2 border-zinc-800 pb-8 space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Personalized affinity radar
              </p>
              <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
                Active Tech Radar
              </h2>
            </div>
            <p className="font-mono text-xs text-zinc-400">
              Showing {shown.length} of {events.length} dispatches
            </p>
          </div>

          {/* Tech Stack Switcher */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-none space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400 font-semibold">
                YOUR TECH STACK (CLICK TO TOGGLE AFFINITY)
              </span>
              <span className="font-mono text-[10px] text-emerald-400">
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
                className="w-full h-11 bg-zinc-950 border border-zinc-800 px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 outline-none font-mono"
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
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 font-semibold"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  {c}
                  {c.toLowerCase() === detectedCity?.toLowerCase() && " (GPS)"}
                </button>
              ))}

              {detectedCity && (
                <button
                  onClick={turnOffLocation}
                  className="h-11 px-3 border border-red-900/60 bg-red-950/40 text-red-400 font-mono text-xs uppercase tracking-[0.1em] hover:bg-red-900/50 hover:text-red-300 transition-colors"
                  title="Turn off location detection"
                >
                  Turn Off GPS ✕
                </button>
              )}
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`h-11 px-3.5 border font-mono text-xs uppercase tracking-[0.1em] transition-colors ${
                    type.toUpperCase() === t.toUpperCase()
                      ? "border-cyan-500 bg-cyan-500/15 text-cyan-400 font-semibold"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Newspaper Event Cards Grid */}
        <div className="grid border-l border-t border-zinc-800 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {shown.map((e, index) => {
            const padIndex = String(index + 1).padStart(2, "0");

            return (
              <article
                key={e.id}
                id={`event-${e.id}`}
                className="group min-h-[22rem] border-b border-r border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 transition-all flex flex-col justify-between p-6 sm:p-7"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                    <span className="font-serif text-3xl italic text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      {padIndex}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                        {e.type}
                      </span>
                      <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        {e.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-serif text-2xl font-bold leading-snug tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    {e.title}
                  </h3>

                  <p className="mt-2 text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                    {[e.organizer, e.venue, e.city].filter(Boolean).join(" • ")}
                  </p>

                  <p className="mt-2 text-xs leading-relaxed text-zinc-400 line-clamp-2">
                    {e.description}
                  </p>

                  <p className="mt-3 font-mono text-[11px] text-zinc-500">
                    Starts: {fmtDate(e.startsAt)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                    <MatchBadge stack={stack} tags={e.tags} seed={e.title} />
                    {e.tags.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[10px] px-2 py-0.5 border border-zinc-800 bg-zinc-900 text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-zinc-800/80 pt-4 flex items-center justify-between">
                  <RsvpButton eventId={e.id} />
                  <Link
                    href={`/passport`}
                    className="font-mono text-[11px] text-zinc-500 hover:text-emerald-400 uppercase tracking-[0.1em] transition-colors"
                  >
                    Pass &rarr;
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {shown.length === 0 && (
          <div className="border border-zinc-800 bg-zinc-950 p-16 text-center mt-8">
            <p className="font-serif text-2xl text-zinc-400">No events matched your filters.</p>
            <p className="font-mono text-xs text-zinc-500 mt-2">
              Try adjusting your tech stack chips, city selection, or toggling location off.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
