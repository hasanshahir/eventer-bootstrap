"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MatchBadge from "./MatchBadge";
import RsvpButton from "./RsvpButton";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import { STACK_OPTIONS } from "@/lib/match";
import { fmtDate, isRegistrationClosed, type EventCard } from "@/lib/ev";
import { CITY_DESK_MAP, findNearestCityDesk } from "@/lib/constants/geo";
import {
  countByCityDesk,
  countByFormat,
  countBySource,
  countOpenAndArchived,
  sortEventsDeadlineFirst,
} from "@/lib/events/selectors";

const FEATURED_CITY_SLUGS = [
  "karachi",
  "lahore",
  "islamabad",
  "rawalpindi",
  "faisalabad",
  "peshawar",
  "multan",
  "quetta",
  "hyderabad",
  "sukkur",
  "online",
];

function isOnlineOrVirtualEvent(e: EventCard): boolean {
  const cityLower = (e.city || "").toLowerCase();
  const modeUpper = (e.mode || "").toUpperCase();
  return (
    modeUpper === "ONLINE" ||
    e.scope === "global" ||
    cityLower.includes("global") ||
    cityLower.includes("virtual") ||
    cityLower.includes("online")
  );
}

export default function Feed({ events }: { events: EventCard[] }) {
  const params = useSearchParams();
  const [feedEvents, setFeedEvents] = useState<EventCard[]>(events);
  const [scope, setScope] = useState<"ALL" | "PAKISTAN" | "GLOBAL">("ALL");
  const [attendanceMode, setAttendanceMode] = useState<
    "ALL" | "PHYSICAL" | "ONLINE"
  >("ALL");
  const [openOnly, setOpenOnly] = useState(false);
  const [showStackDrawer, setShowStackDrawer] = useState(false);

  const [stack, setStack] = useState<string[]>(["Next.js", "Python", "AI/ML"]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState(params.get("city") ?? "All");
  const [type, setType] = useState("All");
  const [selectedCityDeskSlug, setSelectedCityDeskSlug] = useState("karachi");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, [scope, attendanceMode, openOnly, city, type, q, showSavedOnly]);

  useEffect(() => {
    setFeedEvents(events);
  }, [events]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("eventr_stack");
      if (s) setStack(JSON.parse(s));
      const b = localStorage.getItem("eventr_bookmarks");
      if (b) setBookmarks(JSON.parse(b));
      localStorage.removeItem("eventr_user");
    } catch {}
  }, []);

  useEffect(() => {
    const c = params.get("city");
    const s = params.get("scope");
    const t = params.get("type");
    const m = params.get("mode");
    const queryParam = params.get("q");
    if (t) setType(t);
    if (queryParam) setQ(queryParam);
    if (m) {
      const upperM = m.toUpperCase();
      if (
        upperM === "PHYSICAL" ||
        upperM === "ONLINE" ||
        upperM === "ALL"
      ) {
        setAttendanceMode(upperM);
      }
    }
    if (s) {
      const upper = s.toUpperCase();
      if (upper === "PAKISTAN" || upper === "GLOBAL" || upper === "ALL") {
        setScope(upper);
      }
    }
    if (c) {
      const lower = c.toLowerCase();
      if (
        lower.includes("online") ||
        lower.includes("virtual") ||
        lower.includes("global")
      ) {
        setCity("Online");
        setSelectedCityDeskSlug("online");
        setScope("GLOBAL");
        setAttendanceMode("ONLINE");
      } else {
        setCity(c);
        const matchedDesk = Object.values(CITY_DESK_MAP).find(
          (d) =>
            d.city.toLowerCase() === lower ||
            d.slug === lower ||
            lower.includes(d.slug)
        );
        if (matchedDesk) {
          setSelectedCityDeskSlug(matchedDesk.slug);
        }
        setScope("PAKISTAN");
      }
    } else if (!s) {
      setCity("All");
    }
  }, [params]);

  useEffect(() => {
    try {
      const nextParams = new URLSearchParams();
      if (scope !== "ALL") nextParams.set("scope", scope.toLowerCase());
      if (attendanceMode !== "ALL")
        nextParams.set("mode", attendanceMode.toLowerCase());
      if (city && city !== "All") nextParams.set("city", city);
      if (type && type !== "All") nextParams.set("type", type);
      if (q.trim()) nextParams.set("q", q.trim());
      const qs = nextParams.toString();
      const targetUrl = qs
        ? `${window.location.pathname}?${qs}${window.location.hash}`
        : `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState(null, "", targetUrl);
    } catch {}
  }, [scope, attendanceMode, city, type, q]);

  function handleScopeChange(nextScope: "ALL" | "PAKISTAN" | "GLOBAL") {
    setScope(nextScope);
    if (nextScope === "PAKISTAN") {
      if (city.toLowerCase() === "online") setCity("All");
      if (attendanceMode === "ONLINE") setAttendanceMode("ALL");
    } else if (nextScope === "GLOBAL") {
      setCity("Online");
      setAttendanceMode("ONLINE");
    }
  }

  function handleModeChange(nextMode: "ALL" | "PHYSICAL" | "ONLINE") {
    setAttendanceMode(nextMode);
    if (nextMode === "PHYSICAL") {
      if (city.toLowerCase() === "online") setCity("All");
      if (scope === "GLOBAL") setScope("PAKISTAN");
    } else if (nextMode === "ONLINE") {
      setCity("Online");
    } else if (city.toLowerCase() === "online" && scope !== "GLOBAL") {
      setCity("All");
    }
  }

  function resetAllFilters() {
    setScope("ALL");
    setAttendanceMode("ALL");
    setOpenOnly(false);
    setCity("All");
    setType("All");
    setQ("");
    setShowSavedOnly(false);
    setGpsStatus(null);
  }

  function toggle(t: string) {
    const next = stack.includes(t)
      ? stack.filter((x) => x !== t)
      : [...stack, t];
    setStack(next);
    try {
      localStorage.setItem("eventr_stack", JSON.stringify(next));
    } catch {}
  }

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      try {
        localStorage.setItem("eventr_bookmarks", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setGpsStatus("GPS not supported");
      return;
    }
    setGpsStatus("Detecting…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const result = findNearestCityDesk(latitude, longitude, 150);

        if (!result.withinCutoff) {
          setCity("Online");
          setSelectedCityDeskSlug("online");
          setScope("ALL");
          setAttendanceMode("ONLINE");
          setGpsStatus("Outside 150km hub — showing Online");
          return;
        }

        setCity(result.desk.city);
        setSelectedCityDeskSlug(result.desk.slug);
        setScope("PAKISTAN");
        setAttendanceMode("ALL");
        setGpsStatus(
          `Near ${result.desk.city} (~${Math.round(result.distanceKm)}km)`
        );
      },
      (err) => {
        console.error("GPS error:", err);
        setGpsStatus("Location denied");
      },
      { timeout: 10000 }
    );
  }

  const cities = useMemo(() => {
    const pkCities = Array.from(
      new Set(
        feedEvents
          .filter((e) => !isOnlineOrVirtualEvent(e))
          .map((e) => e.city)
      )
    ).sort();
    return ["All", ...pkCities, "Online"];
  }, [feedEvents]);

  const types = [
    "All",
    ...Array.from(new Set(feedEvents.map((e) => e.type))),
  ];

  // Unified selectors (F-05)
  const { open: openEventsCount, archived: archivedEventsCount } = useMemo(
    () => countOpenAndArchived(feedEvents),
    [feedEvents]
  );

  const sourceCounts = useMemo(
    () => countBySource(feedEvents, { openOnly: false }),
    [feedEvents]
  );

  const openFormatCounts = useMemo(
    () => countByFormat(feedEvents, { openOnly: true }),
    [feedEvents]
  );

  const totalFormatCounts = useMemo(
    () => countByFormat(feedEvents, { openOnly: false }),
    [feedEvents]
  );

  const openCityDeskCounts = useMemo(
    () => countByCityDesk(feedEvents, { openOnly: true }),
    [feedEvents]
  );

  const totalCityDeskCounts = useMemo(
    () => countByCityDesk(feedEvents, { openOnly: false }),
    [feedEvents]
  );

  const physicalEventsCount = useMemo(
    () => feedEvents.filter((e) => !isOnlineOrVirtualEvent(e)).length,
    [feedEvents]
  );

  const onlineEventsCount = useMemo(
    () => feedEvents.filter((e) => isOnlineOrVirtualEvent(e)).length,
    [feedEvents]
  );

  const shown = useMemo(() => {
    const filtered = feedEvents.filter((e) => {
      const isOnline = isOnlineOrVirtualEvent(e);

      if (scope === "PAKISTAN" && isOnline) return false;
      if (scope === "GLOBAL" && !isOnline) return false;

      if (attendanceMode === "PHYSICAL" && isOnline) return false;
      if (attendanceMode === "ONLINE" && !isOnline) return false;

      if (openOnly && isRegistrationClosed(e)) return false;

      let matchesCity = city === "All";
      if (!matchesCity) {
        if (city.toLowerCase() === "online") {
          matchesCity = isOnline;
        } else {
          matchesCity =
            !isOnline && e.city.toLowerCase() === city.toLowerCase();
        }
      }
      if (!matchesCity) return false;

      const matchesType =
        type === "All" || e.type.toUpperCase() === type.toUpperCase();
      if (!matchesType) return false;

      const matchesSaved = !showSavedOnly || bookmarks.includes(e.id);
      if (!matchesSaved) return false;

      const matchesQ =
        !q ||
        (
          e.title +
          " " +
          e.organizer +
          " " +
          e.city +
          " " +
          e.description +
          " " +
          e.tags.join(" ")
        )
          .toLowerCase()
          .includes(q.toLowerCase());
      return matchesQ;
    });

    return sortEventsDeadlineFirst(filtered);
  }, [
    feedEvents,
    scope,
    attendanceMode,
    openOnly,
    city,
    type,
    q,
    showSavedOnly,
    bookmarks,
  ]);

  const hasActiveFilters =
    scope !== "ALL" ||
    attendanceMode !== "ALL" ||
    openOnly ||
    city !== "All" ||
    type !== "All" ||
    Boolean(q.trim()) ||
    showSavedOnly;

  const activeDesk =
    CITY_DESK_MAP[selectedCityDeskSlug] || CITY_DESK_MAP["karachi"];
  const activeCityOpenCount = openCityDeskCounts[activeDesk.slug] ?? 0;
  const activeCityTotalCount = totalCityDeskCounts[activeDesk.slug] ?? 0;

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground transition-colors duration-200">
      {/* 1. Compact Header Bar — Zero Scroll Bloat */}
      <section className="border-b-2 border-foreground bg-card/40 pt-[4.5rem]">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span>Pakistan Tech Event Radar</span>
                <span className="text-muted-foreground">&bull;</span>
                <span className="text-foreground">
                  <strong>{openEventsCount}</strong> Open &bull;{" "}
                  {archivedEventsCount} Archived
                </span>
              </div>
              <h1 className="mt-1 font-heading text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
                Har event,{" "}
                <span className="italic text-primary">har shehar.</span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Find hackathons, conferences, workshops, and meetups near you,
                in your city, across Pakistan, or online.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={detectLocation}
                title="Detect your nearest Pakistan city via GPS"
                className="inline-flex h-10 items-center gap-2 border-2 border-foreground bg-primary px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-white shadow-[2px_2px_0px_0px_currentColor] hover:bg-blue-600 transition-all cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="size-4"
                >
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm0-128a40,40,0,1,0,40,40A40,40,0,0,0,128,88Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,152Z" />
                </svg>
                <span>{gpsStatus || "📍 Events Near Me"}</span>
              </button>

              <Link
                href="/organizer/new"
                className="inline-flex h-10 items-center justify-center border border-foreground bg-background px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-foreground hover:bg-foreground hover:text-background transition-colors shadow-[2px_2px_0px_0px_currentColor]"
              >
                + Submit Event
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Immediate Filter Bar & Event Cards Grid (Above the Fold) */}
      <section
        id="radar-index"
        className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 flex-1"
      >
        <div className="border-2 border-foreground/40 bg-card p-4 sm:p-5 space-y-4 shadow-[2px_2px_0px_0px_currentColor]">
          {/* Row 1: Where (Scope) + Mode (Physical vs Online) + Open Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/20 pb-3.5">
            {/* Where / Location Scope */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                Where:
              </span>
              <button
                type="button"
                onClick={() => {
                  setScope("PAKISTAN");
                  setCity("All");
                  if (attendanceMode === "ONLINE") setAttendanceMode("ALL");
                }}
                className={`h-9 px-3 border font-mono text-xs uppercase tracking-[0.08em] transition-all cursor-pointer ${
                  scope === "PAKISTAN" && city === "All"
                    ? "border-primary bg-primary text-white font-bold shadow-[1px_1px_0px_0px_currentColor]"
                    : "border-foreground/30 bg-background text-foreground hover:border-primary"
                }`}
              >
                🇵🇰 All Pakistan ({physicalEventsCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  handleScopeChange("ALL");
                  setCity("All");
                  setAttendanceMode("ALL");
                }}
                className={`h-9 px-3 border font-mono text-xs uppercase tracking-[0.08em] transition-all cursor-pointer ${
                  scope === "ALL" &&
                  city === "All" &&
                  attendanceMode === "ALL"
                    ? "border-primary bg-primary text-white font-bold shadow-[1px_1px_0px_0px_currentColor]"
                    : "border-foreground/30 bg-background text-foreground hover:border-primary"
                }`}
              >
                🌍 All + Global ({feedEvents.length})
              </button>
            </div>

            {/* Physical vs Online Switcher */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                Mode:
              </span>
              <button
                type="button"
                onClick={() => handleModeChange("ALL")}
                className={`h-9 px-3 border font-mono text-xs uppercase tracking-[0.08em] transition-all cursor-pointer ${
                  attendanceMode === "ALL"
                    ? "border-foreground bg-foreground text-background font-bold"
                    : "border-foreground/30 bg-background text-foreground hover:border-primary"
                }`}
              >
                All Modes
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("PHYSICAL")}
                className={`h-9 px-3 border font-mono text-xs uppercase tracking-[0.08em] transition-all cursor-pointer ${
                  attendanceMode === "PHYSICAL"
                    ? "border-primary bg-primary text-white font-bold shadow-[1px_1px_0px_0px_currentColor]"
                    : "border-foreground/30 bg-background text-foreground hover:border-primary"
                }`}
              >
                🏢 Physical / In-Person ({physicalEventsCount})
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("ONLINE")}
                className={`h-9 px-3 border font-mono text-xs uppercase tracking-[0.08em] transition-all cursor-pointer ${
                  attendanceMode === "ONLINE"
                    ? "border-primary bg-primary text-white font-bold shadow-[1px_1px_0px_0px_currentColor]"
                    : "border-foreground/30 bg-background text-foreground hover:border-primary"
                }`}
              >
                💻 Online / Virtual ({onlineEventsCount})
              </button>
            </div>

            {/* Open Only Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpenOnly(!openOnly)}
                className={`h-9 px-3 border font-mono text-xs uppercase tracking-[0.08em] transition-all cursor-pointer ${
                  openOnly
                    ? "border-emerald-600 bg-emerald-600 text-white font-bold"
                    : "border-foreground/30 bg-background text-foreground hover:border-primary"
                }`}
              >
                {openOnly
                  ? `✓ Open Only (${openEventsCount})`
                  : `🟢 Open Only (${openEventsCount})`}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="h-9 px-2.5 border border-foreground/30 bg-background font-mono text-[11px] uppercase text-muted-foreground hover:text-foreground hover:border-foreground cursor-pointer"
                >
                  ✕ Reset
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Pick a City */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              City:
            </span>
            {cities.map((c) => {
              const isCityActive =
                city.toLowerCase() === c.toLowerCase() ||
                (c === "Online" &&
                  (attendanceMode === "ONLINE" ||
                    city.toLowerCase() === "online"));

              const countForCity = feedEvents.filter((e) => {
                const isOnline = isOnlineOrVirtualEvent(e);
                if (c === "All") return true;
                if (c === "Online") return isOnline;
                return !isOnline && e.city.toLowerCase() === c.toLowerCase();
              }).length;

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    if (c === "Online") {
                      setCity("Online");
                      setSelectedCityDeskSlug("online");
                      setAttendanceMode("ONLINE");
                    } else if (c === "All") {
                      setCity("All");
                      if (attendanceMode === "ONLINE") {
                        setAttendanceMode("ALL");
                      }
                    } else {
                      setCity(c);
                      setScope("PAKISTAN");
                      if (attendanceMode === "ONLINE") {
                        setAttendanceMode("ALL");
                      }
                      const found = Object.values(CITY_DESK_MAP).find(
                        (d) => d.city.toLowerCase() === c.toLowerCase()
                      );
                      if (found) setSelectedCityDeskSlug(found.slug);
                    }
                  }}
                  className={`h-8 px-2.5 border font-mono text-xs uppercase tracking-[0.08em] transition-colors cursor-pointer flex items-center gap-1 ${
                    isCityActive
                      ? "border-primary bg-primary text-white font-bold shadow-[1px_1px_0px_0px_currentColor]"
                      : "border-foreground/30 bg-background text-foreground hover:bg-foreground hover:text-background"
                  }`}
                >
                  <span>{c === "All" ? "All Cities" : c}</span>
                  <span
                    className={`text-[10px] ${
                      isCityActive ? "text-white/80" : "text-muted-foreground"
                    }`}
                  >
                    ({countForCity})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Row 3: Search + Format + Saved + Optional Tech Stack Drawer */}
          <div className="flex flex-col gap-3 pt-1 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search event, university (FAST, NUST, GIKI), city, or topic…"
                className="w-full h-10 bg-background border border-foreground/40 px-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`h-10 px-3 border font-mono text-xs uppercase tracking-[0.08em] shrink-0 transition-all cursor-pointer ${
                  showSavedOnly
                    ? "border-primary bg-primary text-white font-bold"
                    : "border-foreground/30 bg-background text-foreground hover:border-primary"
                }`}
              >
                ★ Saved ({bookmarks.length})
              </button>
              <button
                type="button"
                onClick={() => setShowStackDrawer(!showStackDrawer)}
                className={`h-10 px-3 border font-mono text-xs uppercase tracking-[0.08em] shrink-0 transition-all cursor-pointer ${
                  showStackDrawer
                    ? "border-foreground bg-foreground text-background font-bold"
                    : "border-foreground/30 bg-background text-foreground hover:border-primary"
                }`}
              >
                ⚙ Skills ({stack.length})
              </button>
            </div>

            {/* Format Filters */}
            <div className="flex flex-wrap gap-1 items-center">
              <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground mr-1">
                Type:
              </span>
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`h-8 px-2.5 border font-mono text-[11px] uppercase tracking-[0.08em] transition-colors cursor-pointer ${
                    type.toUpperCase() === t.toUpperCase()
                      ? "border-foreground bg-foreground text-background font-bold"
                      : "border-foreground/30 bg-background text-foreground hover:bg-foreground hover:text-background"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Tech Stack Affinity Drawer */}
          {showStackDrawer && (
            <div className="border-t border-foreground/20 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                  Your Tech Stack (Personalizes Match % Badge on Each Event)
                </span>
                <span className="font-mono text-[10px] text-primary font-bold">
                  {stack.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STACK_OPTIONS.map((t) => {
                  const on = stack.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggle(t)}
                      className={`font-mono text-xs px-2.5 py-1 border transition-all cursor-pointer ${
                        on
                          ? "bg-primary text-white border-primary font-bold"
                          : "border-foreground/30 bg-background text-foreground hover:bg-foreground hover:text-background"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Summary Line */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="font-mono text-xs text-muted-foreground">
            Showing{" "}
            <strong className="text-foreground">
              {Math.min(visibleCount, shown.length)}
            </strong>{" "}
            of <strong className="text-foreground">{shown.length}</strong>{" "}
            matching events
            {city !== "All" ? ` in ${city}` : ""}
            {attendanceMode !== "ALL"
              ? ` (${attendanceMode === "PHYSICAL" ? "Physical / In-Person" : "Online / Virtual"})`
              : ""}
          </p>
        </div>

        {/* Event Cards Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {shown.slice(0, visibleCount).map((e, index) => {
            const padIndex = String(index + 1).padStart(2, "0");
            const isSaved = bookmarks.includes(e.id);
            const isOnline = isOnlineOrVirtualEvent(e);
            const isClosed = isRegistrationClosed(e);

            return (
              <article
                key={e.id}
                id={`event-${e.id}`}
                className={`group min-h-[20rem] border transition-all flex flex-col justify-between p-5 sm:p-6 ${
                  isClosed
                    ? "border-zinc-800 bg-zinc-950/60 opacity-60 grayscale-[60%] hover:opacity-95 hover:grayscale-0 hover:border-zinc-700 shadow-none text-zinc-400"
                    : "border-foreground/30 bg-card hover:border-primary hover:bg-background shadow-[2px_2px_0px_0px_currentColor]"
                }`}
              >
                <div>
                  {/* Top card row: Clear Physical/City vs Online Badge */}
                  <div className="flex items-center justify-between border-b border-foreground/20 pb-3 mb-3.5 gap-2">
                    <span
                      className={`font-mono text-xs font-bold uppercase px-2.5 py-1 border ${
                        isOnline
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "border-primary bg-primary/15 text-primary"
                      }`}
                    >
                      {isOnline
                        ? "💻 Online / Virtual"
                        : `🏢 Physical • ${e.city}`}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isClosed ? (
                        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-zinc-700 bg-zinc-800/90 text-zinc-400">
                          Closed
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                          <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Open
                        </span>
                      )}
                      <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 border border-foreground/40 bg-background text-foreground">
                        {e.type}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        #{padIndex}
                      </span>
                    </div>
                  </div>

                  {/* Title & Organization */}
                  <h3
                    className={`font-heading text-2xl sm:text-3xl font-bold leading-tight tracking-tight transition-colors ${
                      isClosed
                        ? "text-zinc-400"
                        : "text-foreground group-hover:text-primary"
                    }`}
                  >
                    <Link
                      href={`/events/${encodeURIComponent(e.slug || e.id)}`}
                      className="hover:underline"
                    >
                      {e.title}
                    </Link>
                  </h3>

                  <p className="mt-2 text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                      className="size-3.5 text-primary shrink-0"
                    >
                      <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" />
                    </svg>
                    <span className="truncate">
                      {[e.organizer, e.venue].filter(Boolean).join(" • ")}
                    </span>
                  </p>

                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {e.description}
                  </p>

                  {isClosed ? (
                    <p className="mt-3 font-mono text-[11px] text-zinc-500 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold text-[9px] uppercase border border-zinc-700">
                        Ended
                      </span>
                      <span>
                        {fmtDate(e.endsAt || e.startsAt, Boolean(e.dateOnly))}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-3 font-mono text-[11px] text-emerald-400/90 font-medium flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold text-[9px] uppercase border border-emerald-500/30">
                        Date
                      </span>
                      <span>
                        {fmtDate(e.startsAt, Boolean(e.dateOnly))}
                      </span>
                    </p>
                  )}

                  {/* Tags & Match Score */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5 items-center">
                    <MatchBadge stack={stack} tags={e.tags} seed={e.title} />
                    {e.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[10px] px-2 py-0.5 border border-foreground/30 bg-background text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Footer: 1-Tap RSVP, External Host Link & Calendar Sync */}
                <div className="mt-5 border-t border-foreground/20 pt-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {isClosed ? (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-10 border border-zinc-700 bg-zinc-800/80 px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-all cursor-pointer"
                      >
                        <span className="text-zinc-500 line-through">
                          Register
                        </span>
                        <span>Closed</span>
                      </a>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <RsvpButton eventId={e.id} />
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-10 border border-foreground/40 bg-background px-3 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-foreground hover:border-primary hover:text-primary transition-all"
                        >
                          <span>Host Link</span>
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
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <a
                        href={`/api/v1/calendar/event/${encodeURIComponent(e.id)}.ics`}
                        download
                        className="font-mono text-[10px] uppercase tracking-[0.08em] border border-foreground/30 px-2 py-1 text-foreground hover:border-primary hover:text-primary transition-colors"
                        title="Download .ics calendar file"
                      >
                        .ICS
                      </a>
                      <a
                        href={buildGoogleCalendarUrl(e)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground hover:text-primary transition-colors"
                        title="Add to Google Calendar"
                      >
                        + GCal
                      </a>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(e.id)}
                        title={
                          isSaved
                            ? "Saved to your bookmarks"
                            : "Save this event"
                        }
                        className={`size-9 border flex items-center justify-center transition-all ${
                          isSaved
                            ? "border-primary bg-primary text-white"
                            : "border-foreground/30 bg-background text-foreground hover:border-primary"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          fill={isSaved ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          className="size-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {shown.length > visibleCount && (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 border-t border-foreground/20 pt-8">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              Showing {Math.min(visibleCount, shown.length)} of {shown.length}{" "}
              dispatches
            </p>
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="inline-flex items-center gap-2 border-2 border-foreground bg-primary px-8 py-3 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-[2px_2px_0px_0px_currentColor] transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Load More Events ({shown.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {shown.length === 0 && (
          <div className="border-2 border-foreground/30 bg-card p-12 text-center mt-6 shadow-[2px_2px_0px_0px_currentColor]">
            <p className="font-heading text-2xl text-foreground">
              No events matched your current filters.
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-2">
              Try switching Mode between Physical / Online or resetting filters.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 inline-flex items-center border border-foreground bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-white cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </section>

      {/* 3. Below-the-Fold Compact Regional & Format Directory */}
      <section className="border-t-2 border-foreground/40 bg-card/50 mt-10">
        <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 space-y-12">
          {/* City Dispatches & Source Ledger Row */}
          <div className="grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
            <div>
              <div className="flex items-end justify-between border-b border-foreground/30 pb-3">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    Regional wire / Pakistan
                  </p>
                  <h2 className="mt-1 font-heading text-3xl sm:text-4xl font-medium text-foreground">
                    City dispatches
                  </h2>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {activeDesk.city}: {activeCityOpenCount} open /{" "}
                  {activeCityTotalCount} total
                </span>
              </div>

              <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 mt-4">
                {FEATURED_CITY_SLUGS.map((slug) => {
                  const desk = CITY_DESK_MAP[slug];
                  if (!desk) return null;
                  const isSelected = selectedCityDeskSlug === slug;
                  const openCount = openCityDeskCounts[slug] ?? 0;

                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => {
                        setSelectedCityDeskSlug(slug);
                        if (desk.isVirtual) {
                          setScope("GLOBAL");
                          setCity("Online");
                          setAttendanceMode("ONLINE");
                        } else {
                          setScope("PAKISTAN");
                          setCity(desk.city);
                          setAttendanceMode("ALL");
                        }
                        const el = document.getElementById("radar-index");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`flex items-center justify-between border px-3 py-2.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-foreground text-background border-foreground font-bold"
                          : "border-foreground/30 bg-background hover:border-primary text-foreground"
                      }`}
                    >
                      <span className="font-heading text-base font-semibold truncate">
                        {desk.isVirtual ? "Online" : desk.city}
                      </span>
                      <span className="font-mono text-xs px-1.5 py-0.5 border border-foreground/30">
                        {openCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact Source Ledger */}
            <aside className="border border-foreground/30 bg-background p-5">
              <div className="flex items-center justify-between border-b border-foreground/20 pb-3">
                <h2 className="font-heading text-2xl italic text-foreground">
                  Source ledger
                </h2>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-primary bg-primary/10 text-primary font-bold">
                  LIVE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 font-mono text-xs">
                <div className="border border-foreground/20 p-3">
                  <p className="text-muted-foreground text-[10px] uppercase">
                    Devpost
                  </p>
                  <p className="font-heading text-2xl font-bold text-primary mt-1">
                    {sourceCounts.devpost}
                  </p>
                </div>
                <div className="border border-foreground/20 p-3">
                  <p className="text-muted-foreground text-[10px] uppercase">
                    Luma PK
                  </p>
                  <p className="font-heading text-2xl font-bold text-foreground mt-1">
                    {sourceCounts.luma}
                  </p>
                </div>
                <div className="border border-foreground/20 p-3">
                  <p className="text-muted-foreground text-[10px] uppercase">
                    GDG Chapters
                  </p>
                  <p className="font-heading text-2xl font-bold text-foreground mt-1">
                    {sourceCounts.gdg}
                  </p>
                </div>
                <div className="border border-foreground/20 p-3">
                  <p className="text-muted-foreground text-[10px] uppercase">
                    Campus Desks
                  </p>
                  <p className="font-heading text-2xl font-bold text-primary mt-1">
                    {sourceCounts.campus + sourceCounts.manual}
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* Compact Format Arena */}
          <div>
            <div className="flex items-end justify-between border-b border-foreground/30 pb-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Browse by format
                </p>
                <h2 className="mt-1 font-heading text-3xl sm:text-4xl font-medium text-foreground">
                  Pick your arena.
                </h2>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mt-4">
              {(
                [
                  { title: "Hackathons", category: "HACKATHON" },
                  { title: "Conferences", category: "CONFERENCE" },
                  { title: "Workshops", category: "WORKSHOP" },
                  { title: "Meetups", category: "MEETUP" },
                  { title: "Competitions", category: "COMPETITION" },
                  { title: "Tech talks", category: "TECH_TALK" },
                ] as const
              ).map((f) => {
                const openCount = openFormatCounts[f.category] ?? 0;
                const totalCount = totalFormatCounts[f.category] ?? 0;
                return (
                  <button
                    key={f.title}
                    type="button"
                    onClick={() => {
                      setType(f.category);
                      const el = document.getElementById("radar-index");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="border border-foreground/30 bg-background p-4 text-left transition-all hover:border-primary hover:bg-foreground hover:text-background cursor-pointer"
                  >
                    <p className="font-heading text-xl font-semibold">
                      {f.title}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">
                      {openCount} open &bull; {totalCount} total
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
