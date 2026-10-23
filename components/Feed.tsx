"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MatchBadge from "./MatchBadge";
import RsvpButton from "./RsvpButton";
import { STACK_OPTIONS } from "@/lib/match";
import { demoUser } from "@/lib/demoUser";
import { fmtDate, type EventCard } from "@/lib/ev";

const CITY_DOSSIERS: Record<string, { latLng: string; subtitle: string; tags: string[]; desc: string }> = {
  Karachi: {
    latLng: "24.8607° N / 67.0011° E",
    subtitle: "Mega coastal tech hub",
    tags: ["#Fintech", "#Hackathons", "#AI / ML"],
    desc: "Home to NED, FAST, IBA, and Pakistan's largest developer density.",
  },
  Lahore: {
    latLng: "31.5204° N / 74.3587° E",
    subtitle: "Startup & Dev Valley",
    tags: ["#Startups", "#SaaS", "#DeepTech"],
    desc: "LUMS, FAST, ITU, and PUCIT collegiate hackathon circuits.",
  },
  Islamabad: {
    latLng: "33.6844° N / 73.0479° E",
    subtitle: "Federal AI & DeepTech",
    tags: ["#GenerativeAI", "#Robotics", "#Policy"],
    desc: "NUST, FAST, COMSATS, and national cyber olympiads.",
  },
  Rawalpindi: {
    latLng: "33.5651° N / 73.0169° E",
    subtitle: "Twin Cities Circuit",
    tags: ["#Cybersecurity", "#CTF", "#Hardware"],
    desc: "Military colleges, engineering summits, and security conferences.",
  },
  Faisalabad: {
    latLng: "31.4504° N / 73.1350° E",
    subtitle: "Industrial Tech Center",
    tags: ["#AgriTech", "#Industrial", "#Youth"],
    desc: "University of Agriculture, FAST CFD, and emerging developer meetups.",
  },
  Peshawar: {
    latLng: "34.0151° N / 71.5249° E",
    subtitle: "Frontier Tech Hub",
    tags: ["#OpenSource", "#Cloud", "#YouthDev"],
    desc: "UET Peshawar, IM|Sciences, and KP IT Board hackathons.",
  },
  Multan: {
    latLng: "30.1575° N / 71.5249° E",
    subtitle: "South Punjab Devs",
    tags: ["#MobileDev", "#Flutter", "#Web"],
    desc: "Bahauddin Zakariya University tech societies and Google Developer Groups.",
  },
  Quetta: {
    latLng: "30.1798° N / 66.9750° E",
    subtitle: "Balochistan Tech Hub",
    tags: ["#Innovation", "#Digital", "#Access"],
    desc: "BUITEMS & UoB developer incubators and hackathons.",
  },
  Hyderabad: {
    latLng: "25.3960° N / 68.3578° E",
    subtitle: "Sindh Univ Circuit",
    tags: ["#Engineering", "#IoT", "#Python"],
    desc: "Mehran UET and Sindh University technology competitions.",
  },
  Sukkur: {
    latLng: "27.7052° N / 68.8574° E",
    subtitle: "Upper Sindh Tech Oasis",
    tags: ["#Fintech", "#AI", "#CampusHack"],
    desc: "Sukkur IBA University and regional Sindh developer initiatives.",
  },
  Online: {
    latLng: "Nationwide / Global Circuit",
    subtitle: "Virtual Hackathons & Summits",
    tags: ["#Remote", "#Global", "#Web3"],
    desc: "Worldwide virtual hackathons, online code sprints, and global livestreams.",
  },
};

const PAK_COORDS: Record<string, { lat: number; lng: number }> = {
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Faisalabad: { lat: 31.4504, lng: 73.135 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Quetta: { lat: 30.1798, lng: 66.975 },
  Hyderabad: { lat: 25.396, lng: 68.3578 },
  Sukkur: { lat: 27.7052, lng: 68.8574 },
};

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildGoogleCalendarUrl(e: EventCard) {
  const start = e.startsAt ? new Date(e.startsAt).toISOString().replace(/-|:|\.\d\d\d/g, "") : "";
  const end = e.endsAt ? new Date(e.endsAt).toISOString().replace(/-|:|\.\d\d\d/g, "") : start;
  const dates = start && end ? `${start}/${end}` : "";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    location: [e.venue, e.city, "Pakistan"].filter(Boolean).join(", "),
    details: `${e.description}\n\nOfficial Host Registration:\n${e.url}`,
  });
  if (dates) params.set("dates", dates);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function Feed({ events }: { events: EventCard[] }) {
  const params = useSearchParams();
  const [feedEvents, setFeedEvents] = useState<EventCard[]>(events);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scope, setScope] = useState<"ALL" | "PAKISTAN" | "GLOBAL">("ALL");

  const [stack, setStack] = useState<string[]>(["Next.js", "Python", "AI/ML"]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState(params.get("city") ?? "All");
  const [type, setType] = useState("All");
  const [selectedCityDesk, setSelectedCityDesk] = useState("Karachi");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  useEffect(() => {
    setFeedEvents(events);
  }, [events]);

  async function handleSyncRadar() {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/discover", { method: "POST" });
      const data = await res.json();
      if (data?.events && Array.isArray(data.events)) {
        const { toCard } = await import("@/lib/ev");
        setFeedEvents(data.events.map(toCard));
      }
    } catch (err) {
      console.error("Live radar sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    try {
      const s = localStorage.getItem("eventer_stack");
      if (s) setStack(JSON.parse(s));
      const b = localStorage.getItem("eventer_bookmarks");
      if (b) setBookmarks(JSON.parse(b));
      if (!localStorage.getItem("eventer_user")) {
        localStorage.setItem("eventer_user", JSON.stringify(demoUser));
      }
    } catch {}
  }, []);

  // Sync city & scope filters dynamically whenever URL parameters change
  useEffect(() => {
    const c = params.get("city");
    const s = params.get("scope");
    if (s) {
      const upper = s.toUpperCase();
      if (upper === "PAKISTAN" || upper === "GLOBAL" || upper === "ALL") {
        setScope(upper as any);
      }
    }
    if (c) {
      if (c.toLowerCase().includes("online") || c.toLowerCase().includes("virtual") || c.toLowerCase().includes("global")) {
        setCity("Online");
        setSelectedCityDesk("Online");
        setScope("GLOBAL");
      } else {
        setCity(c);
        setSelectedCityDesk(c);
        setScope("PAKISTAN");
      }
    } else if (!s) {
      setCity("All");
    }
  }, [params]);

  function handleScopeChange(nextScope: "ALL" | "PAKISTAN" | "GLOBAL") {
    setScope(nextScope);
    if (nextScope === "PAKISTAN" && city.toLowerCase() === "online") {
      setCity("All");
    } else if (nextScope === "GLOBAL" && city !== "All" && city.toLowerCase() !== "online") {
      setCity("All");
    }
  }

  function toggle(t: string) {
    const next = stack.includes(t) ? stack.filter((x) => x !== t) : [...stack, t];
    setStack(next);
    try {
      localStorage.setItem("eventer_stack", JSON.stringify(next));
    } catch {}
  }

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem("eventer_bookmarks", JSON.stringify(next));
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
        let nearestCity = "Karachi";
        let minDistance = Infinity;

        for (const [cityName, coords] of Object.entries(PAK_COORDS)) {
          const dist = getDistanceKm(latitude, longitude, coords.lat, coords.lng);
          if (dist < minDistance) {
            minDistance = dist;
            nearestCity = cityName;
          }
        }
        setCity(nearestCity);
        setSelectedCityDesk(nearestCity);
        setScope("PAKISTAN");
        setGpsStatus(`Near ${nearestCity} (~${Math.round(minDistance)}km)`);
        const el = document.getElementById("radar-index");
        el?.scrollIntoView({ behavior: "smooth" });
      },
      (err) => {
        console.error("GPS error:", err);
        setGpsStatus("Location denied");
      },
      { timeout: 10000 }
    );
  }

  // City buttons for the filter bar:
  // When scope is PAKISTAN: list only Pakistani cities that have events
  // When scope is GLOBAL: list "All" and "Online"
  // When scope is ALL: list "All", "Online", and Pakistani cities
  const cities = useMemo(() => {
    if (scope === "GLOBAL") {
      return ["All", "Online"];
    }
    const pkCities = Array.from(
      new Set(
        feedEvents
          .filter((e) => e.scope !== "global" && !e.city.toLowerCase().includes("global") && !e.city.toLowerCase().includes("virtual") && !e.city.toLowerCase().includes("online"))
          .map((e) => e.city)
      )
    ).sort();
    if (scope === "PAKISTAN") {
      return ["All", ...pkCities];
    }
    return ["All", "Online", ...pkCities];
  }, [feedEvents, scope]);

  const types = ["All", ...Array.from(new Set(feedEvents.map((e) => e.type)))];

  const devpostCount = feedEvents.filter((e) => e.source === "devpost" || e.url.includes("devpost.com")).length;
  const lumaCount = feedEvents.filter((e) => e.source === "luma" || e.url.includes("lu.ma")).length;
  const gdgCount = feedEvents.filter((e) => e.source === "gdg" || e.url.includes("gdg.community.dev")).length;
  const campusCount = feedEvents.filter((e) => e.source === "campus" || e.url.includes("unstop.com")).length;

  const pakistanEventsCount = feedEvents.filter(
    (e) => e.scope !== "global" && !e.city.toLowerCase().includes("global") && !e.city.toLowerCase().includes("virtual") && !e.city.toLowerCase().includes("online")
  ).length;

  const globalEventsCount = feedEvents.filter(
    (e) => e.scope === "global" || e.city.toLowerCase().includes("global") || e.city.toLowerCase().includes("virtual") || e.city.toLowerCase().includes("online")
  ).length;

  const shown = useMemo(
    () =>
      feedEvents.filter((e) => {
        const isGlobal =
          e.scope === "global" ||
          e.city.toLowerCase().includes("global") ||
          e.city.toLowerCase().includes("virtual") ||
          e.city.toLowerCase().includes("online");

        // 1. Scope Filter
        if (scope === "PAKISTAN" && isGlobal) return false;
        if (scope === "GLOBAL" && !isGlobal) return false;

        // 2. City Filter (Strict isolation: local cities only match local events)
        let matchesCity = city === "All";
        if (!matchesCity) {
          if (city.toLowerCase() === "online") {
            matchesCity = isGlobal;
          } else {
            matchesCity = !isGlobal && e.city.toLowerCase() === city.toLowerCase();
          }
        }
        if (!matchesCity) return false;

        // 3. Format / Type Filter
        const matchesType = type === "All" || e.type.toUpperCase() === type.toUpperCase();
        if (!matchesType) return false;

        // 4. Saved Bookmarks
        const matchesSaved = !showSavedOnly || bookmarks.includes(e.id);
        if (!matchesSaved) return false;

        // 5. Search Query
        const matchesQ =
          !q ||
          (e.title + " " + e.organizer + " " + e.city + " " + e.description + " " + e.tags.join(" "))
            .toLowerCase()
            .includes(q.toLowerCase());
        return matchesQ;
      }),
    [feedEvents, scope, city, type, q, showSavedOnly, bookmarks]
  );

  const activeDossier = CITY_DOSSIERS[selectedCityDesk] || CITY_DOSSIERS["Karachi"];
  const activeCityCount = feedEvents.filter((e) => {
    if (selectedCityDesk === "Online") {
      return e.scope === "global" || e.city.toLowerCase().includes("global") || e.city.toLowerCase().includes("virtual") || e.city.toLowerCase().includes("online");
    }
    return (
      e.city.toLowerCase() === selectedCityDesk.toLowerCase() &&
      e.scope !== "global" &&
      !e.city.toLowerCase().includes("global") &&
      !e.city.toLowerCase().includes("virtual") &&
      !e.city.toLowerCase().includes("online")
    );
  }).length;

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground transition-colors duration-200">
      {/* 1. Hero Split Desk */}
      <section className="relative border-b-2 border-foreground pt-[4.5rem]">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,.5fr)]">
          {/* Main Editorial Desk */}
          <div className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:border-r lg:border-foreground/30 lg:px-10 lg:py-20">
            <div className="relative">
              {/* Wire Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-foreground/30 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em]">
                <span className="flex items-center gap-2 text-primary font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-3.5 animate-pulse">
                    <path d="M216,64H86.51L194.3,31.67a8,8,0,0,0-4.6-15.33l-160,48h0A8,8,0,0,0,24,72V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64ZM104,176H64a8,8,0,0,1,0-16h40a8,8,0,0,1,0,16Zm0-32H64a8,8,0,0,1,0-16h40a8,8,0,0,1,0,16Zm0-32H64a8,8,0,0,1,0-16h40a8,8,0,0,1,0,16Zm64,56a32,32,0,1,1,32-32A32,32,0,0,1,168,168Z" />
                  </svg>
                  Live Pakistan event radar
                </span>
                <span className="font-mono text-muted-foreground">
                  {events.length} open registrations &bull; Nationwide circuit
                </span>
              </div>

              {/* Editorial Title */}
              <div className="grid gap-8 py-10 md:grid-cols-[minmax(0,1fr)_12rem] md:items-end">
                <h1 className="max-w-[12ch] font-heading text-[clamp(4rem,10vw,9rem)] font-medium leading-[0.78] tracking-[-0.065em] text-foreground">
                  Har event,
                  <span className="block italic text-primary">har shehar.</span>
                </h1>
                <p className="max-w-[24ch] border-l-4 border-primary pl-4 text-sm font-medium leading-relaxed text-foreground/80 md:mb-2">
                  Pakistan&apos;s deadline-first field guide to hackathons, conferences, campus competitions and developer meetups.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 border-t border-foreground/30 pt-5 sm:flex-row">
                <a
                  href="#radar-index"
                  className="inline-flex items-center justify-center gap-2 h-12 rounded-none border border-foreground bg-primary px-6 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-blue-600 transition-all shadow-[2px_2px_0px_0px_currentColor]"
                >
                  <span>Open the live index</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-4">
                    <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                  </svg>
                </a>
                <Link
                  href="/organizer/new"
                  className="inline-flex items-center justify-center h-12 rounded-none border border-foreground bg-transparent px-6 text-xs font-semibold uppercase tracking-[0.12em] text-foreground hover:bg-foreground hover:text-background transition-colors shadow-[2px_2px_0px_0px_currentColor]"
                >
                  Submit a campus event
                </Link>
              </div>
            </div>
          </div>

          {/* Right Rail: Source Ledger */}
          <aside className="bg-foreground text-background dark:bg-card dark:text-foreground dark:border-l dark:border-foreground/30 px-5 py-8 sm:px-8 lg:py-12 border-t lg:border-t-0 border-foreground/30">
            <div className="flex items-end justify-between border-b border-background/20 dark:border-foreground/20 pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-background/60 dark:text-muted-foreground">
                  Incoming signal
                </p>
                <p className="mt-1 font-heading text-3xl italic text-background dark:text-foreground">Source ledger</p>
              </div>
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-primary bg-primary/20 text-primary font-bold">
                LIVE
              </span>
            </div>

            <div className="divide-y divide-background/15 dark:divide-foreground/15">
              <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                <span className="font-mono text-[10px] text-background/50 dark:text-muted-foreground">01</span>
                <div>
                  <p className="text-sm font-semibold text-background dark:text-foreground">Devpost Hackathons</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-background/60 dark:text-muted-foreground">Global virtual</p>
                </div>
                <span className="font-heading text-4xl text-primary font-bold">{devpostCount}</span>
              </div>

              <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                <span className="font-mono text-[10px] text-background/50 dark:text-muted-foreground">02</span>
                <div>
                  <p className="text-sm font-semibold text-background dark:text-foreground">Luma PK Circles</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-background/60 dark:text-muted-foreground">Live community</p>
                </div>
                <span className="font-heading text-4xl text-background dark:text-foreground font-bold">{lumaCount}</span>
              </div>

              <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                <span className="font-mono text-[10px] text-background/50 dark:text-muted-foreground">03</span>
                <div>
                  <p className="text-sm font-semibold text-background dark:text-foreground">GDG Chapters</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-background/60 dark:text-muted-foreground">Pakistan official</p>
                </div>
                <span className="font-heading text-4xl text-background dark:text-foreground font-bold">{gdgCount}</span>
              </div>

              <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                <span className="font-mono text-[10px] text-background/50 dark:text-muted-foreground">04</span>
                <div>
                  <p className="text-sm font-semibold text-background dark:text-foreground">Campus Desks</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-background/60 dark:text-muted-foreground">Unstop + Collegiate</p>
                </div>
                <span className="font-heading text-4xl text-primary font-bold">{campusCount}</span>
              </div>
            </div>

            <p className="mt-8 border-t border-background/20 dark:border-foreground/20 pt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-background/60 dark:text-muted-foreground">
              Automated collection with human verification for campus and community listings across Pakistan.
            </p>
          </aside>
        </div>
      </section>

      {/* 2. The Missed-Signal Problem Section */}
      <section className="border-b-2 border-foreground/40 bg-card text-foreground">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[.78fr_1.22fr]">
          <div className="border-foreground/20 px-4 py-14 sm:px-6 lg:border-r lg:px-10 lg:py-20">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              The missed-signal problem
            </p>
            <h2 className="mt-4 max-w-[9ch] font-heading text-5xl font-medium leading-[0.9] tracking-[-0.05em] sm:text-7xl">
              Great events hide in plain sight.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2">
            <article className="border-b border-foreground/20 p-6 sm:border-r sm:p-10">
              <span className="font-heading text-6xl italic text-primary font-bold">01</span>
              <h3 className="mt-10 font-heading text-2xl font-semibold">The announcement is scattered.</h3>
              <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
                One event lives on LinkedIn, another in a society WhatsApp group, and the next on a platform you do not check.
              </p>
            </article>

            <article className="border-b border-foreground/20 p-6 sm:p-10">
              <span className="font-heading text-6xl italic text-primary font-bold">02</span>
              <h3 className="mt-10 font-heading text-2xl font-semibold">The deadline arrives first.</h3>
              <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
                By the time the right post reaches your feed, team formation, early bird, or registration may already be closed.
              </p>
            </article>

            <div className="p-6 sm:col-span-2 sm:p-10">
              <p className="max-w-[52ch] font-heading text-3xl leading-tight tracking-[-0.02em] sm:text-4xl text-foreground">
                HackScout turns those scattered posts into one city-by-city, deadline-first index.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive City Dispatches & Dossier Section */}
      <section className="border-b-2 border-foreground/40 bg-background">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid lg:grid-cols-[1.08fr_.92fr]">
            {/* City Selector Grid */}
            <div className="px-4 py-14 sm:px-6 lg:border-r lg:border-foreground/30 lg:px-10 lg:py-20">
              <div className="flex items-end justify-between gap-5 border-b-2 border-foreground/30 pb-5">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    Regional wire / Pakistan
                  </p>
                  <h2 className="mt-2 font-heading text-5xl font-medium tracking-[-0.05em] sm:text-7xl text-foreground">
                    City dispatches
                  </h2>
                </div>
                <p className="hidden max-w-[24ch] text-right text-xs leading-relaxed text-muted-foreground sm:block">
                  Select a desk for its active registrations and trending formats.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mt-6">
                {[
                  "Karachi",
                  "Lahore",
                  "Islamabad",
                  "Rawalpindi",
                  "Faisalabad",
                  "Peshawar",
                  "Multan",
                  "Quetta",
                  "Hyderabad",
                  "Sukkur",
                  "Online",
                ].map((cName, i) => {
                  const isSelected = selectedCityDesk.toLowerCase() === cName.toLowerCase();
                  const count = feedEvents.filter((e) => {
                    if (cName === "Online") {
                      return e.scope === "global" || e.city.toLowerCase().includes("global") || e.city.toLowerCase().includes("virtual") || e.city.toLowerCase().includes("online");
                    }
                    return (
                      e.city.toLowerCase() === cName.toLowerCase() &&
                      e.scope !== "global" &&
                      !e.city.toLowerCase().includes("global") &&
                      !e.city.toLowerCase().includes("virtual") &&
                      !e.city.toLowerCase().includes("online")
                    );
                  }).length;

                  return (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => {
                        setSelectedCityDesk(cName);
                        if (cName === "Online") {
                          setScope("GLOBAL");
                          setCity("Online");
                        } else {
                          setScope("PAKISTAN");
                          setCity(cName);
                        }
                      }}
                      className={`group grid min-h-20 grid-cols-[2rem_1fr_auto] items-center gap-2 border px-4 py-3 text-left outline-none transition-all shadow-[2px_2px_0px_0px_currentColor] cursor-pointer ${
                        isSelected
                          ? "bg-foreground text-background border-foreground font-bold"
                          : "border-foreground/30 bg-card hover:border-primary text-foreground"
                      }`}
                    >
                      <span className={`font-mono text-[10px] ${isSelected ? "text-background/70" : "text-muted-foreground"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <span className="block font-heading text-xl font-semibold leading-none">
                          {cName}
                        </span>
                        <span className={`mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] ${isSelected ? "text-background/70" : "text-muted-foreground"}`}>
                          {CITY_DOSSIERS[cName]?.subtitle || "Regional Hub"}
                        </span>
                      </span>
                      <span className={`grid size-8 place-items-center border font-mono text-xs font-semibold ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-foreground/30 text-foreground"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live City Dossier Rail */}
            <aside className="relative flex min-h-[35rem] flex-col justify-between overflow-hidden bg-primary p-5 text-white sm:p-10 lg:p-12 shadow-[4px_4px_0px_0px_currentColor]">
              <div className="relative flex items-start justify-between gap-4 border-b border-white/40 pb-4">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-4">
                    <path d="M232,116h-4.72A100.21,100.21,0,0,0,140,28.72V24a12,12,0,0,0-24,0v4.72A100.21,100.21,0,0,0,28.72,116H24a12,12,0,0,0,0,24h4.72A100.21,100.21,0,0,0,116,227.28V232a12,12,0,0,0,24,0v-4.72A100.21,100.21,0,0,0,227.28,140H232a12,12,0,0,0,0-24Zm-92,87v-3a12,12,0,0,0-24,0v3a76.15,76.15,0,0,1-63-63h3a12,12,0,0,0,0-24H53a76.15,76.15,0,0,1,63-63v3a12,12,0,0,0,24,0V53a76.15,76.15,0,0,1,63,63h-3a12,12,0,0,0,0,24h3A76.15,76.15,0,0,1,140,203ZM128,84a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,84Zm0,64a20,20,0,1,1,20-20A20,20,0,0,1,128,148Z" />
                  </svg>
                  Active city dossier
                </div>
                <span className="font-mono text-[10px] uppercase">Desk Active</span>
              </div>

              <div className="relative my-12">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70">
                  {activeDossier.latLng}
                </p>
                <h3 className="mt-3 font-heading text-[clamp(4rem,9vw,8rem)] font-medium leading-[0.78] tracking-[-0.065em]">
                  {selectedCityDesk}
                </h3>
                <p className="mt-5 max-w-[30ch] border-l-4 border-white pl-4 text-sm font-semibold uppercase tracking-[0.06em]">
                  {activeDossier.subtitle}
                </p>
                <p className="mt-3 max-w-[38ch] text-xs leading-relaxed text-white/80">
                  {activeDossier.desc}
                </p>
              </div>

              <div className="relative">
                <div className="grid grid-cols-[auto_1fr] gap-5 border-y border-white/40 py-5">
                  <span className="font-heading text-6xl font-semibold">
                    {activeCityCount}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Open registrations</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/70">
                      Verified and accepting entries now
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-2 py-5 font-mono text-[10px] uppercase tracking-[0.12em]">
                  {activeDossier.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedCityDesk === "Online") {
                      setScope("GLOBAL");
                      setCity("Online");
                    } else {
                      setScope("PAKISTAN");
                      setCity(selectedCityDesk);
                    }
                    const el = document.getElementById("radar-index");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex w-full min-h-12 items-center justify-between border border-foreground bg-background px-5 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  <span>Filter {selectedCityDesk} events</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                  </svg>
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* 4. Live Tech Radar Index & Interactive Filter Bar */}
      <section id="radar-index" className="mx-auto w-full max-w-[1500px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20 flex-1">
        <div className="border-b-2 border-foreground/40 pb-8 space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Live Dispatches Ledger
              </p>
              <h2 className="mt-2 font-heading text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
                Active Tech Radar
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSyncRadar}
                disabled={isSyncing}
                className="h-10 px-4 border border-foreground bg-primary font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-all shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                title="Trigger live aggregation from Devpost, GDG, Luma, and Campus desks"
              >
                <span className={isSyncing ? "animate-spin" : ""}>🔄</span>
                <span>{isSyncing ? "Scanning Sources…" : "Sync Live Radar"}</span>
              </button>
              <p className="font-mono text-xs text-muted-foreground hidden sm:block">
                Showing {shown.length} of {feedEvents.length} open dispatches
              </p>
            </div>
          </div>

          {/* Location Scope Switcher (All / Pakistan / Global) */}
          <div className="flex flex-wrap items-center gap-2 border-y border-foreground/20 py-3 bg-card/50 px-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mr-1 font-semibold">
              Location Scope:
            </span>
            <button
              type="button"
              onClick={() => handleScopeChange("ALL")}
              className={`h-9 px-3.5 border font-mono text-xs uppercase tracking-[0.1em] transition-all shadow-[1px_1px_0px_0px_currentColor] cursor-pointer ${
                scope === "ALL"
                  ? "border-primary bg-primary text-white font-bold"
                  : "border-foreground/30 bg-background text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              All Dispatches ({feedEvents.length})
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange("PAKISTAN")}
              className={`h-9 px-3.5 border font-mono text-xs uppercase tracking-[0.1em] transition-all shadow-[1px_1px_0px_0px_currentColor] cursor-pointer ${
                scope === "PAKISTAN"
                  ? "border-primary bg-primary text-white font-bold"
                  : "border-foreground/30 bg-background text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              🇵🇰 Pakistan (On-Ground & Local) ({pakistanEventsCount})
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange("GLOBAL")}
              className={`h-9 px-3.5 border font-mono text-xs uppercase tracking-[0.1em] transition-all shadow-[1px_1px_0px_0px_currentColor] cursor-pointer ${
                scope === "GLOBAL"
                  ? "border-primary bg-primary text-white font-bold"
                  : "border-foreground/30 bg-background text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              🌐 Global (Virtual Only) ({globalEventsCount})
            </button>
          </div>

          {/* Tech Stack Affinity Switcher */}
          <div className="border border-foreground/30 bg-card p-5 space-y-3 shadow-[2px_2px_0px_0px_currentColor]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                YOUR TECH STACK (CLICK TO TOGGLE AFFINITY)
              </span>
              <span className="font-mono text-[10px] text-primary font-bold">
                {stack.length} skills selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STACK_OPTIONS.map((t) => {
                const on = stack.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggle(t)}
                    className={`font-mono text-xs px-3 py-1 border transition-all cursor-pointer ${
                      on
                        ? "bg-primary text-white border-primary shadow-[2px_2px_0px_0px_currentColor] font-bold"
                        : "border-foreground/30 bg-background text-foreground hover:bg-foreground hover:text-background"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search, GPS, & City Filter Bar */}
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by event title, organizer, city, or tech skill…"
                className="w-full h-11 bg-background border border-foreground/40 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none font-mono"
              />

              {/* GPS Near Me Button */}
              <button
                type="button"
                onClick={detectLocation}
                title="Detect nearest tech hub via GPS"
                className="h-11 px-4 border font-mono text-xs uppercase tracking-[0.1em] transition-all border-foreground/30 bg-card hover:border-primary text-foreground flex items-center justify-center gap-2 shadow-[1px_1px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-4 text-primary">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm0-128a40,40,0,1,0,40,40A40,40,0,0,0,128,88Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,152Z" />
                </svg>
                <span>{gpsStatus || "Near Me"}</span>
              </button>

              {/* Saved Only Filter Toggle */}
              <button
                type="button"
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`h-11 px-4 border font-mono text-xs uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-1.5 shadow-[1px_1px_0px_0px_currentColor] cursor-pointer ${
                  showSavedOnly
                    ? "border-primary bg-primary text-white font-bold"
                    : "border-foreground/30 bg-card text-foreground hover:border-primary"
                }`}
              >
                <span>★ Saved</span>
                <span className="font-bold">({bookmarks.length})</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* City Filters */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="font-mono text-[10px] uppercase text-muted-foreground mr-1">
                  {scope === "GLOBAL" ? "Scope:" : "City / Hub:"}
                </span>
                {cities.map((c) => {
                  const isCityActive =
                    city.toLowerCase() === c.toLowerCase() ||
                    (c === "Online" && (city.toLowerCase() === "online" || city.toLowerCase().includes("virtual")));

                  const countForCity = feedEvents.filter((e) => {
                    const isGlobal =
                      e.scope === "global" ||
                      e.city.toLowerCase().includes("global") ||
                      e.city.toLowerCase().includes("virtual") ||
                      e.city.toLowerCase().includes("online");

                    if (scope === "PAKISTAN" && isGlobal) return false;
                    if (scope === "GLOBAL" && !isGlobal) return false;

                    if (c === "All") return true;
                    if (c === "Online") return isGlobal;
                    return !isGlobal && e.city.toLowerCase() === c.toLowerCase();
                  }).length;

                  return (
                    <button
                      key={c}
                      onClick={() => {
                        setCity(c);
                        if (c !== "All" && c !== "Online") setSelectedCityDesk(c);
                        else if (c === "Online") setSelectedCityDesk("Online");
                      }}
                      className={`h-9 px-3 border font-mono text-xs uppercase tracking-[0.1em] transition-colors shadow-[1px_1px_0px_0px_currentColor] cursor-pointer flex items-center gap-1.5 ${
                        isCityActive
                          ? "border-primary bg-primary text-white font-bold"
                          : "border-foreground/30 bg-background text-foreground hover:bg-foreground hover:text-background"
                      }`}
                    >
                      <span>{c}</span>
                      <span className={`text-[10px] ${isCityActive ? "text-white/80" : "text-muted-foreground"}`}>
                        ({countForCity})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Type Filters */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="font-mono text-[10px] uppercase text-muted-foreground mr-1">Format:</span>
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`h-9 px-3 border font-mono text-xs uppercase tracking-[0.1em] transition-colors shadow-[1px_1px_0px_0px_currentColor] cursor-pointer ${
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
          </div>
        </div>

        {/* Spacious, Distinct Event Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {shown.map((e, index) => {
            const padIndex = String(index + 1).padStart(2, "0");
            const isSaved = bookmarks.includes(e.id);
            const isGlobalEvent =
              e.scope === "global" ||
              e.city.toLowerCase().includes("global") ||
              e.city.toLowerCase().includes("virtual") ||
              e.city.toLowerCase().includes("online");

            return (
              <article
                key={e.id}
                id={`event-${e.id}`}
                className="group min-h-[22rem] border border-foreground/30 bg-card transition-all flex flex-col justify-between p-6 sm:p-7 hover:border-primary hover:bg-background shadow-[2px_2px_0px_0px_currentColor]"
              >
                <div>
                  {/* Top card row */}
                  <div className="flex items-center justify-between border-b border-foreground/20 pb-3 mb-4">
                    <span className="font-heading text-4xl italic text-muted-foreground group-hover:text-primary transition-colors">
                      {padIndex}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 border border-foreground/40 bg-background text-foreground">
                        {e.type}
                      </span>
                      <span
                        className={`font-mono text-[10px] font-semibold uppercase px-2 py-0.5 border ${
                          isGlobalEvent
                            ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                            : "border-primary bg-primary/10 text-primary"
                        }`}
                      >
                        {isGlobalEvent ? "🌐 Global Virtual" : `🇵🇰 ${e.city}`}
                      </span>
                    </div>
                  </div>

                  {/* Title & Organization */}
                  <h3 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {e.title}
                  </h3>

                  <p className="mt-2 text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-3.5 text-primary">
                      <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" />
                    </svg>
                    {[e.organizer, e.venue].filter(Boolean).join(" • ")}
                  </p>

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {e.description}
                  </p>

                  <p className="mt-3 font-mono text-[11px] text-foreground/70">
                    Starts: {fmtDate(e.startsAt)}
                  </p>

                  {/* Tags & Match Score */}
                  <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                    <MatchBadge stack={stack} tags={e.tags} seed={e.title} />
                    {e.tags.map((t) => (
                      <span key={t} className="font-mono text-[10px] px-2 py-0.5 border border-foreground/30 bg-background text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Footer: External Host Link & Calendar Sync */}
                <div className="mt-6 border-t border-foreground/20 pt-4 flex items-center justify-between gap-3">
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-10 border border-foreground bg-primary px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-all shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <span>Register on Host</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-3.5">
                      <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                    </svg>
                  </a>

                  <div className="flex items-center gap-3">
                    <a
                      href={buildGoogleCalendarUrl(e)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-foreground hover:text-primary uppercase tracking-[0.1em] transition-colors"
                      title="Add to Google Calendar"
                    >
                      + Calendar
                    </a>

                    <button
                      type="button"
                      onClick={() => toggleBookmark(e.id)}
                      title={isSaved ? "Saved to your bookmarks" : "Save this event"}
                      className={`size-9 border flex items-center justify-center transition-all shadow-[1px_1px_0px_0px_currentColor] ${
                        isSaved
                          ? "border-primary bg-primary text-white"
                          : "border-foreground/30 bg-background text-foreground hover:border-primary"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {shown.length === 0 && (
          <div className="border-2 border-foreground/30 bg-card p-16 text-center mt-8 shadow-[2px_2px_0px_0px_currentColor]">
            <p className="font-heading text-3xl text-foreground">No events matched your filters.</p>
            <p className="font-mono text-xs text-muted-foreground mt-2">
              Try adjusting your tech stack chips or city selection.
            </p>
          </div>
        )}
      </section>

      {/* 5. Format Arena Section */}
      <section className="border-b-2 border-foreground/40">
        <div className="mx-auto max-w-[1500px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <div className="flex flex-col justify-between gap-5 border-b-2 border-foreground/30 pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Browse by format
              </p>
              <h2 className="mt-2 font-heading text-5xl font-medium tracking-[-0.05em] sm:text-7xl text-foreground">
                Pick your arena.
              </h2>
            </div>
            <p className="max-w-[30ch] text-sm leading-relaxed text-muted-foreground">
              From a two-hour workshop to a national build sprint—start with the room you want to enter.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {[
              { title: "Hackathons", count: "26 open", desc: "Build fast. Ship something real.", category: "HACKATHON" },
              { title: "Conferences", count: "14 open", desc: "Big rooms, new ideas, useful people.", category: "CONFERENCE" },
              { title: "Workshops", count: "19 open", desc: "Hands-on sessions for sharper skills.", category: "WORKSHOP" },
              { title: "Meetups", count: "17 open", desc: "Find your local developer circle.", category: "MEETUP" },
              { title: "Competitions", count: "09 open", desc: "Code, robotics, ideas and prizes.", category: "COMPETITION" },
              { title: "Tech talks", count: "11 open", desc: "Focused conversations with practitioners.", category: "TECH_TALK" },
            ].map((f) => (
              <button
                key={f.title}
                type="button"
                onClick={() => {
                  setType(f.category);
                  const el = document.getElementById("radar-index");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group relative min-h-64 border border-foreground/30 bg-card p-6 text-left transition-all hover:border-primary hover:bg-foreground hover:text-background sm:p-8 shadow-[2px_2px_0px_0px_currentColor]"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] font-bold text-primary group-hover:text-background uppercase tracking-widest">
                    FORMAT
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground group-hover:text-background/60">
                    {f.count}
                  </span>
                </div>
                <div className="absolute inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8">
                  <h3 className="font-heading text-4xl font-semibold tracking-[-0.03em]">
                    {f.title}
                  </h3>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <p className="max-w-[28ch] text-xs leading-relaxed text-muted-foreground group-hover:text-background/70">
                      {f.desc}
                    </p>
                    <span className="shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 font-mono text-sm">
                      &rarr;
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 6. How The Desk Works Section */}
      <section className="border-b-2 border-foreground/40 bg-card">
        <div className="mx-auto max-w-[1500px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                How the desk works
              </p>
              <h2 className="mt-3 max-w-[8ch] font-heading text-5xl font-medium leading-[0.9] tracking-[-0.05em] sm:text-7xl text-foreground">
                Signal over noise.
              </h2>
            </div>
            <div className="border-t-2 border-foreground/30">
              <article className="grid gap-4 border-b border-foreground/20 py-7 sm:grid-cols-[3rem_10rem_1fr] sm:items-start">
                <span className="font-heading text-3xl italic text-primary">I</span>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
                  DISCOVERY
                </p>
                <div>
                  <h3 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground">
                    One national signal.
                  </h3>
                  <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
                    Devpost, Luma, Unstop, Eventbrite and university societies are gathered into one continuously updated dispatch.
                  </p>
                </div>
              </article>

              <article className="grid gap-4 border-b border-foreground/20 py-7 sm:grid-cols-[3rem_10rem_1fr] sm:items-start">
                <span className="font-heading text-3xl italic text-primary">II</span>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
                  CURATION
                </p>
                <div>
                  <h3 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground">
                    Zero spam, deadline-first.
                  </h3>
                  <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
                    Events are filtered and ranked by upcoming deadlines so you never miss team formation or early registrations.
                  </p>
                </div>
              </article>

              <article className="grid gap-4 py-7 sm:grid-cols-[3rem_10rem_1fr] sm:items-start">
                <span className="font-heading text-3xl italic text-primary">III</span>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
                  ACCESS
                </p>
                <div>
                  <h3 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground">
                    1-Tap DevPassport & QR passes.
                  </h3>
                  <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
                    RSVP in one tap, save tamper-evident QR tickets, and check in offline at the gate in seconds.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
