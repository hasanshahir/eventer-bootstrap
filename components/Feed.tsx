"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fmtDate,
  fmtDeadline,
  calculateDistance,
  CITY_COORDS,
  type EventCard,
  type SourcePlatform,
} from "@/lib/ev";

export default function Feed({ events }: { events: EventCard[] }) {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [city, setCity] = useState(params.get("city") ?? "All");
  const [type, setType] = useState("All");
  const [source, setSource] = useState("All");
  const [sortBy, setSortBy] = useState<"deadline" | "recent" | "date">("deadline");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // Geolocation & Proximity State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | "all">("all");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  // Detailed modal inspection state
  const [selectedEvent, setSelectedEvent] = useState<EventCard | null>(null);

  function requestLocation() {
    setGeoLoading(true);
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setRadiusKm(10); // default to 10km radius when enabled
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message || "Unable to retrieve your location.");
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  }

  // Pre-calculate distance for all events when user coordinates exist
  const eventsWithDistance = useMemo(() => {
    return events.map((e) => {
      if (!userCoords) return e;
      const dist = calculateDistance(
        userCoords.lat,
        userCoords.lng,
        e.coordinates.lat,
        e.coordinates.lng
      );
      return { ...e, distanceKm: dist };
    });
  }, [events, userCoords]);

  const cities = ["All", ...Array.from(new Set(events.map((e) => e.city)))];
  const types = ["All", ...Array.from(new Set(events.map((e) => e.type)))];
  const sources = ["All", ...Array.from(new Set(events.map((e) => e.sourcePlatform)))];

  // Filtering
  const filtered = useMemo(() => {
    return eventsWithDistance.filter((e) => {
      const matchCity = city === "All" || e.city.toLowerCase() === city.toLowerCase();
      const matchType = type === "All" || e.type.toUpperCase() === type.toUpperCase();
      const matchSource = source === "All" || e.sourcePlatform === source;
      const matchQuery =
        !q ||
        (e.title + e.organizer + e.city + e.venue + e.description + e.tags.join(" "))
          .toLowerCase()
          .includes(q.toLowerCase());

      const matchRadius =
        radiusKm === "all" ||
        (e.distanceKm !== undefined && e.distanceKm <= radiusKm);

      return matchCity && matchType && matchSource && matchQuery && matchRadius;
    });
  }, [eventsWithDistance, city, type, source, q, radiusKm]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "deadline") {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }
      if (sortBy === "recent") {
        const pa = new Date(a.publishedAt).getTime();
        const pb = new Date(b.publishedAt).getTime();
        return pb - pa;
      }
      const sa = a.startsAt ? new Date(a.startsAt).getTime() : Infinity;
      const sb = b.startsAt ? new Date(b.startsAt).getTime() : Infinity;
      return sa - sb;
    });
  }, [filtered, sortBy]);

  function getPlatformBadge(p: SourcePlatform) {
    switch (p) {
      case "Instagram":
        return "border-pink-500/40 bg-pink-500/10 text-pink-600 dark:text-pink-400";
      case "WhatsApp":
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "Discord":
        return "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
      case "Devpost":
        return "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "Google Form":
        return "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default:
        return "border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white dark:selection:bg-blue-500 dark:selection:text-black transition-colors">
      {/* Editorial Hero Radar Header */}
      <section className="relative border-b-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#030712] transition-colors">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,.6fr)]">
          {/* Main Hero Column */}
          <div className="relative overflow-hidden border-slate-200 dark:border-zinc-800 px-4 py-10 sm:px-8 sm:py-14 lg:border-r lg:px-12 lg:py-16">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-25 dark:opacity-20 pointer-events-none bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
            />

            <div className="relative">
              {/* Wire dispatch ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 dark:border-zinc-800 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <span className="size-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                  Pakistan Tech Event & Hackathon Radar
                </span>
                <span className="text-slate-500 dark:text-zinc-500 font-mono">
                  {events.length} Live Dispatches Scraped
                </span>
              </div>

              {/* Title */}
              <div className="py-6 sm:py-8">
                <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.92] text-slate-900 dark:text-white">
                  Pakistan Hackathon
                  <span className="block italic text-blue-600 dark:text-blue-400 font-normal mt-1">
                    Radar & Deadline Tracker.
                  </span>
                </h1>
                <p className="mt-6 max-w-[58ch] border-l-4 border-blue-600 dark:border-blue-500 pl-4 text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
                  Automated intelligence aggregating hackathons, AI workshops, and university competitions across Pakistan from Instagram, WhatsApp, Discord, and Devpost. Apply directly at the source.
                </p>
              </div>

              {/* Proximity / Nearest Near Me Actions */}
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 dark:border-zinc-800 pt-5">
                <button
                  onClick={requestLocation}
                  disabled={geoLoading}
                  className="inline-flex items-center gap-2 h-11 border border-blue-600 dark:border-blue-400 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white dark:text-black shadow-sm dark:shadow-[0_0_15px_-3px_rgba(59,130,246,0.7)] transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="size-4"
                  >
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-88a40,40,0,1,1-40-40A40,40,0,0,1,168,128Z" />
                  </svg>
                  {geoLoading
                    ? "Locating you…"
                    : userCoords
                    ? "✓ Location Active (GPS)"
                    : "📍 Find Events Near Me"}
                </button>

                {userCoords && (
                  <div className="flex items-center gap-1.5 border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-900 px-3 h-11 font-mono text-xs">
                    <span className="text-slate-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mr-1">
                      Radius:
                    </span>
                    {([5, 10, 25, 50, "all"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRadiusKm(r)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                          radiusKm === r
                            ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-black"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {r === "all" ? "All" : `${r}km`}
                      </button>
                    ))}
                  </div>
                )}

                {geoError && (
                  <span className="font-mono text-xs text-red-500 block w-full mt-1">
                    {geoError}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Rail: Quick Ingestion Ledger */}
          <aside className="flex flex-col justify-between bg-slate-50/80 dark:bg-zinc-900/90 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-zinc-800 p-6 sm:p-8 lg:p-10 transition-colors">
            <div>
              <div className="flex items-end justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 font-semibold">
                    Discovery channels
                  </p>
                  <p className="mt-1 font-serif text-2xl italic text-slate-900 dark:text-white">
                    Scraped Sources
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded border border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold">
                  LIVE
                </span>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-zinc-800/80 my-4 text-xs">
                <div className="flex items-center justify-between py-3">
                  <span className="font-mono text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-pink-500" /> Instagram Posts & Stories
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">2 Active</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="font-mono text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" /> WhatsApp Tech Channels
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">1 Active</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="font-mono text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-indigo-500" /> Discord Society Servers
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">1 Active</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="font-mono text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500" /> Devpost & Google Forms
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">2 Active</span>
                </div>
              </div>
            </div>

            <p className="border-t border-slate-200 dark:border-zinc-800 pt-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-slate-500 dark:text-zinc-500">
              Direct source links take you straight to registration forms, Instagram pages, or official WhatsApp channels.
            </p>
          </aside>
        </div>
      </section>

      {/* Control Ribbon: Sorts, Filters & View Toggle */}
      <section className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-8 lg:px-12">
        <div className="border-b-2 border-slate-200 dark:border-zinc-800 pb-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 font-semibold block">
                Dispatches
              </span>
              <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                All Verified Events ({sorted.length})
              </h2>
            </div>

            {/* View Mode & Sort By Switches */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort Switcher */}
              <div className="flex items-center border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1">
                {(
                  [
                    { key: "deadline", label: "⏰ Deadline Soonest" },
                    { key: "recent", label: "⚡ Recently Scraped" },
                    { key: "date", label: "📅 Event Date" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                      sortBy === s.key
                        ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-black font-semibold shadow-sm"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-black font-semibold"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  ▦ Grid
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                    viewMode === "map"
                      ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-black font-semibold"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  🗺️ Map Radar
                </button>
              </div>
            </div>
          </div>

          {/* Search bar & Category filters */}
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hackathons, FAST, NED, NUST, AI, Web3, robotics…"
              className="w-full h-11 bg-white dark:bg-[#030712] border border-slate-200 dark:border-zinc-800 px-4 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-blue-600 dark:focus:border-blue-500 outline-none font-mono shadow-sm transition-colors"
            />

            {/* City Filter */}
            <div className="flex flex-wrap gap-1 items-center">
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`h-11 px-3 border font-mono text-xs uppercase tracking-[0.08em] transition-colors ${
                    city.toLowerCase() === c.toLowerCase()
                      ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-400 font-semibold"
                      : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Source Platform Filter */}
            <div className="flex flex-wrap gap-1 items-center">
              {sources.map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`h-11 px-3 border font-mono text-xs uppercase tracking-[0.08em] transition-colors ${
                    source === s
                      ? "border-sky-600 bg-sky-600 text-white dark:border-sky-400 dark:bg-sky-500/20 dark:text-sky-400 font-semibold"
                      : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAP RADAR VIEW */}
        {viewMode === "map" && (
          <div className="mt-8 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                  Pakistan Regional Radar Map
                </h3>
                <p className="font-mono text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Click on any city node to filter hackathons in that perimeter.
                </p>
              </div>
              {userCoords && (
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                  📍 User GPS: {userCoords.lat.toFixed(2)}, {userCoords.lng.toFixed(2)}
                </span>
              )}
            </div>

            {/* Interactive Vector Radar Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
              {Object.entries(CITY_COORDS)
                .filter(([c]) => c !== "Remote")
                .map(([cityName, coords]) => {
                  const cityEvents = eventsWithDistance.filter(
                    (e) => e.city.toLowerCase() === cityName.toLowerCase()
                  );
                  const isSelected = city.toLowerCase() === cityName.toLowerCase();
                  const distance = userCoords
                    ? calculateDistance(userCoords.lat, userCoords.lng, coords.lat, coords.lng)
                    : null;

                  return (
                    <div
                      key={cityName}
                      onClick={() => setCity(isSelected ? "All" : cityName)}
                      className={`p-4 border cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/15 shadow-md"
                          : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {cityName}
                        </span>
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                            cityEvents.length > 0
                              ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-black"
                              : "bg-slate-200 dark:bg-zinc-800 text-slate-500"
                          }`}
                        >
                          {cityEvents.length} events
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                        {coords.lat.toFixed(2)}°N, {coords.lng.toFixed(2)}°E
                      </p>
                      {distance !== null && (
                        <p className="mt-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                          📍 {distance} km from you
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* CONNECTED EVENT CARDS GRID */}
        <div className="grid border-l border-t border-slate-200 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-3 mt-8 shadow-sm">
          {sorted.map((e, index) => {
            const padIndex = String(index + 1).padStart(2, "0");

            return (
              <article
                key={e.id}
                className="group min-h-[24rem] border-b border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#05070f] hover:bg-blue-50/30 dark:hover:bg-zinc-900/80 transition-all flex flex-col justify-between p-6 sm:p-7 shadow-sm dark:shadow-none"
              >
                <div>
                  {/* Top card row: Index, Source Platform badge, and Type badge */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3 mb-4">
                    <span className="font-serif text-3xl italic text-slate-300 dark:text-zinc-700 group-hover:text-blue-600 dark:group-hover:text-zinc-400 transition-colors">
                      {padIndex}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getPlatformBadge(
                          e.sourcePlatform
                        )}`}
                      >
                        {e.sourcePlatform}
                      </span>
                      <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        {e.type}
                      </span>
                    </div>
                  </div>

                  {/* Deadline Urgency Banner */}
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                        className="size-3"
                      >
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
                      </svg>
                      {fmtDeadline(e.deadline)}
                    </span>
                  </div>

                  {/* Title & Organizer */}
                  <h3 className="font-serif text-2xl font-bold leading-snug tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {e.title}
                  </h3>

                  {/* Location & Distance */}
                  <p className="mt-2 text-xs font-mono text-slate-600 dark:text-zinc-400 flex flex-wrap items-center gap-1.5">
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
                    {e.distanceKm !== undefined && (
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        ({e.distanceKm} km away)
                      </span>
                    )}
                  </p>

                  {/* Short Description */}
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-zinc-400 line-clamp-2">
                    {e.description}
                  </p>

                  {/* Prize pool & Date */}
                  {e.prizePool && (
                    <p className="mt-2.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      🏆 Prize: {e.prizePool}
                    </p>
                  )}

                  <p className="mt-1.5 font-mono text-[11px] text-slate-500 dark:text-zinc-500">
                    Event Date: {fmtDate(e.startsAt)}
                  </p>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
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

                {/* Bottom Card Actions */}
                <div className="mt-6 border-t border-slate-100 dark:border-zinc-800/80 pt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedEvent(e)}
                    className="font-mono text-[11px] text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-[0.1em] transition-colors"
                  >
                    View Details 🔍
                  </button>

                  <a
                    href={e.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-semibold text-xs uppercase tracking-[0.1em] rounded px-4 py-2 shadow-sm transition-all"
                  >
                    Apply at Source
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                      className="size-3.5"
                    >
                      <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                    </svg>
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <div className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-16 text-center mt-8 shadow-sm">
            <p className="font-serif text-2xl text-slate-600 dark:text-zinc-400">
              No hackathons matched your filters or radius.
            </p>
            <p className="font-mono text-xs text-slate-500 dark:text-zinc-500 mt-2">
              Try switching your city selection or increasing the radius slider.
            </p>
          </div>
        )}
      </section>

      {/* QUICK DETAILS MODAL */}
      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
              <div>
                <span
                  className={`font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getPlatformBadge(
                    selectedEvent.sourcePlatform
                  )}`}
                >
                  Source: {selectedEvent.sourcePlatform}
                </span>
                <h3 className="font-serif text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {selectedEvent.title}
                </h3>
                <p className="font-mono text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Hosted by {selectedEvent.organizer} &bull; {selectedEvent.city}
                </p>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="font-mono text-sm text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700 dark:text-zinc-300">
              <p className="leading-relaxed">{selectedEvent.description}</p>

              <div className="border-y border-slate-200 dark:border-zinc-800 py-3 space-y-1.5 font-mono text-xs">
                <p>
                  📍 <strong>Venue:</strong> {selectedEvent.venue}
                </p>
                <p>
                  📅 <strong>Starts:</strong> {fmtDate(selectedEvent.startsAt)}
                </p>
                <p>
                  🏁 <strong>Ends:</strong> {fmtDate(selectedEvent.endsAt)}
                </p>
                <p className="text-amber-600 dark:text-amber-400 font-bold">
                  ⏰ <strong>Deadline:</strong> {fmtDeadline(selectedEvent.deadline)}
                </p>
                {selectedEvent.prizePool && (
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                    🏆 <strong>Prize Pool:</strong> {selectedEvent.prizePool}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedEvent.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-xs px-2.5 py-1 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-500">
                Direct external link to {selectedEvent.sourcePlatform}
              </span>
              <a
                href={selectedEvent.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-semibold font-mono text-xs uppercase px-5 py-2.5 shadow-sm transition-all"
              >
                Open {selectedEvent.sourcePlatform} ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
