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
  Online: {
    latLng: "Nationwide / Global Circuit",
    subtitle: "Virtual Hackathons & Summits",
    tags: ["#Remote", "#Global", "#Web3"],
    desc: "Worldwide virtual hackathons, online code sprints, and global livestreams.",
  },
};

export default function Feed({ events }: { events: EventCard[] }) {
  const params = useSearchParams();
  const [stack, setStack] = useState<string[]>(["Next.js", "Python", "AI/ML"]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState(params.get("city") ?? "All");
  const [type, setType] = useState("All");
  const [selectedCityDesk, setSelectedCityDesk] = useState("Karachi");

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

  const activeDossier = CITY_DOSSIERS[selectedCityDesk] || CITY_DOSSIERS["Karachi"];
  const activeCityCount = events.filter(
    (e) => e.city.toLowerCase() === selectedCityDesk.toLowerCase()
  ).length;

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground transition-colors duration-200">
      {/* 1. Hero Split Desk */}
      <section className="relative border-b-2 border-foreground pt-[4.5rem]">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,.5fr)]">
          <div className="relative overflow-hidden border-foreground px-4 py-12 sm:px-6 sm:py-16 lg:border-r lg:px-10 lg:py-20">
            <div aria-hidden="true" className="paper-grid absolute inset-0 opacity-25 dark:opacity-40 text-foreground pointer-events-none" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-foreground py-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em]">
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

              <div className="grid gap-8 py-10 md:grid-cols-[minmax(0,1fr)_12rem] md:items-end">
                <h1 className="max-w-[12ch] font-heading text-[clamp(4rem,10vw,9rem)] font-medium leading-[0.78] tracking-[-0.065em] text-foreground">
                  Har event,
                  <span className="block italic text-primary">har shehar.</span>
                </h1>
                <p className="max-w-[24ch] border-l-4 border-primary pl-4 text-sm font-medium leading-relaxed text-foreground/80 md:mb-2">
                  Pakistan&apos;s deadline-first field guide to hackathons, conferences, campus competitions and developer meetups.
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-foreground pt-5 sm:flex-row">
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
                  className="inline-flex items-center justify-center h-12 rounded-none border border-foreground bg-transparent px-6 text-xs font-semibold uppercase tracking-[0.12em] text-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  Submit a campus event
                </Link>
              </div>
            </div>
          </div>

          <aside className="bg-zinc-900 text-white dark:bg-zinc-950 px-5 py-8 sm:px-8 lg:py-12 border-t lg:border-t-0 border-foreground">
            <div className="flex items-end justify-between border-b border-white/20 pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                  Incoming signal
                </p>
                <p className="mt-1 font-heading text-3xl italic text-white">Source ledger</p>
              </div>
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-blue-500/50 bg-blue-500/20 text-blue-400 font-bold">
                LIVE
              </span>
            </div>

            <div className="divide-y divide-zinc-800">
              <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                <span className="font-mono text-[10px] text-zinc-500">01</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Devpost PK</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">Last scan 04m</p>
                </div>
                <span className="font-heading text-4xl text-blue-400 font-bold">{events.length}</span>
              </div>

              <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                <span className="font-mono text-[10px] text-zinc-500">02</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Luma Circles</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">Last scan 01m</p>
                </div>
                <span className="font-heading text-4xl text-white font-bold">28</span>
              </div>

              <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                <span className="font-mono text-[10px] text-zinc-500">03</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Campus desks</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">Last scan verified</p>
                </div>
                <span className="font-heading text-4xl text-white font-bold">35</span>
              </div>

              <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                <span className="font-mono text-[10px] text-zinc-500">04</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Unstop + Devpost</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">Last scan 08m</p>
                </div>
                <span className="font-heading text-4xl text-blue-400 font-bold">10</span>
              </div>
            </div>

            <p className="mt-8 border-t border-zinc-800 pt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-zinc-400">
              Automated collection with human verification for campus and community listings across Pakistan.
            </p>
          </aside>
        </div>
      </section>

      {/* 2. The Missed-Signal Problem Section */}
      <section className="border-b-2 border-foreground bg-zinc-950 text-white dark:bg-zinc-900/40">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[.78fr_1.22fr]">
          <div className="border-zinc-800 px-4 py-14 sm:px-6 lg:border-r lg:px-10 lg:py-20">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400">
              The missed-signal problem
            </p>
            <h2 className="mt-4 max-w-[9ch] font-heading text-5xl font-medium leading-[0.9] tracking-[-0.05em] sm:text-7xl">
              Great events hide in plain sight.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2">
            <article className="border-b border-zinc-800 p-6 sm:border-r sm:p-10">
              <span className="font-heading text-6xl italic text-blue-400 font-bold">01</span>
              <h3 className="mt-10 font-heading text-2xl font-semibold">The announcement is scattered.</h3>
              <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-zinc-400">
                One event lives on LinkedIn, another in a society WhatsApp group, and the next on a platform you do not check.
              </p>
            </article>

            <article className="border-b border-zinc-800 p-6 sm:border-r sm:p-10">
              <span className="font-heading text-6xl italic text-blue-400 font-bold">02</span>
              <h3 className="mt-10 font-heading text-2xl font-semibold">The deadline arrives first.</h3>
              <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-zinc-400">
                By the time the right post reaches your feed, team formation, early bird, or registration may already be closed.
              </p>
            </article>

            <div className="p-6 sm:col-span-2 sm:p-10">
              <p className="max-w-[52ch] font-heading text-3xl leading-tight tracking-[-0.02em] sm:text-4xl text-zinc-100">
                HackScout turns those scattered posts into one city-by-city, deadline-first index.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive City Dispatches & Dossier Section */}
      <section className="border-b-2 border-foreground bg-background">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid lg:grid-cols-[1.08fr_.92fr]">
            <div className="border-foreground px-4 py-14 sm:px-6 lg:border-r lg:px-10 lg:py-20">
              <div className="flex items-end justify-between gap-5 border-b-2 border-foreground pb-5">
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

              <div className="grid sm:grid-cols-2">
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
                  "Online",
                ].map((cName, i) => {
                  const isSelected = selectedCityDesk.toLowerCase() === cName.toLowerCase();
                  const count =
                    events.filter((e) => e.city.toLowerCase() === cName.toLowerCase()).length ||
                    (cName === "Karachi" ? 40 : cName === "Lahore" ? 27 : cName === "Islamabad" ? 22 : cName === "Hyderabad" ? 16 : cName === "Online" ? 964 : 1);

                  return (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => setSelectedCityDesk(cName)}
                      className={`group grid min-h-20 grid-cols-[2rem_1fr_auto] items-center gap-2 border-b border-foreground px-3 text-left outline-none transition-colors sm:odd:border-r ${
                        isSelected
                          ? "bg-foreground text-background"
                          : "hover:bg-card text-foreground"
                      }`}
                    >
                      <span className={`font-mono text-[10px] ${isSelected ? "text-background/60" : "text-muted-foreground"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <span className="block font-heading text-xl font-semibold leading-none">
                          {cName}
                        </span>
                        <span className={`mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] ${isSelected ? "text-background/60" : "text-muted-foreground"}`}>
                          {CITY_DOSSIERS[cName]?.subtitle || "Regional Hub"}
                        </span>
                      </span>
                      <span className={`grid size-9 place-items-center border font-mono text-xs font-semibold ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-foreground text-foreground"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="relative flex min-h-[35rem] flex-col justify-between overflow-hidden bg-primary p-5 text-white sm:p-10 lg:p-12">
              <div aria-hidden="true" className="paper-grid absolute inset-0 opacity-15 text-white pointer-events-none" />

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
                    {activeCityCount || 1}
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

                <Link
                  href={`/cities`}
                  className="flex min-h-12 items-center justify-between border border-foreground bg-background px-5 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_#000]"
                >
                  <span>Open {selectedCityDesk} index</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                  </svg>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* 4. Live Tech Radar Index & Interactive Filter Bar */}
      <section id="radar-index" className="mx-auto w-full max-w-[1500px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20 flex-1">
        <div className="border-b-2 border-foreground pb-8 space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Live Dispatches Ledger
              </p>
              <h2 className="mt-2 font-heading text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
                Active Tech Radar
              </h2>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Showing {shown.length} of {events.length} open dispatches
            </p>
          </div>

          {/* Tech Stack Affinity Switcher */}
          <div className="border border-foreground bg-card p-5 space-y-3">
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
                        ? "bg-blue-600 text-white border-blue-600 shadow-[2px_2px_0px_0px_currentColor] font-bold"
                        : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & City Filter Bar */}
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by event title, organizer, city, or tech skill…"
              className="w-full h-11 bg-background border border-foreground px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none font-mono"
            />

            {/* City Filters */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`h-11 px-3.5 border font-mono text-xs uppercase tracking-[0.1em] transition-colors ${
                    city.toLowerCase() === c.toLowerCase()
                      ? "border-primary bg-primary text-white font-bold"
                      : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
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
                      ? "border-foreground bg-foreground text-background font-bold"
                      : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Connected Newspaper Cards Grid */}
        <div className="grid border-l border-t border-foreground sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {shown.map((e, index) => {
            const padIndex = String(index + 1).padStart(2, "0");

            return (
              <article
                key={e.id}
                id={`event-${e.id}`}
                className="group min-h-[22rem] border-b border-r border-foreground bg-card transition-all flex flex-col justify-between p-6 sm:p-7 hover:bg-zinc-100 dark:hover:bg-zinc-900/80"
              >
                <div>
                  {/* Top card row */}
                  <div className="flex items-center justify-between border-b border-foreground/30 pb-3 mb-4">
                    <span className="font-heading text-4xl italic text-muted-foreground group-hover:text-primary transition-colors">
                      {padIndex}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 border border-foreground bg-background text-foreground">
                        {e.type}
                      </span>
                      <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 border border-blue-500 bg-blue-500/10 text-blue-500">
                        {e.city}
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

                {/* Bottom Card Footer */}
                <div className="mt-6 border-t border-foreground/30 pt-4 flex items-center justify-between">
                  <RsvpButton eventId={e.id} />
                  <Link
                    href={`/passport`}
                    className="font-mono text-[11px] text-foreground hover:text-primary uppercase tracking-[0.1em] transition-colors"
                  >
                    Pass &rarr;
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {shown.length === 0 && (
          <div className="border-2 border-foreground bg-card p-16 text-center mt-8">
            <p className="font-heading text-3xl text-foreground">No events matched your filters.</p>
            <p className="font-mono text-xs text-muted-foreground mt-2">
              Try adjusting your tech stack chips or city selection.
            </p>
          </div>
        )}
      </section>

      {/* 5. Format Arena Section */}
      <section className="border-b-2 border-foreground">
        <div className="mx-auto max-w-[1500px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <div className="flex flex-col justify-between gap-5 border-b-2 border-foreground pb-5 sm:flex-row sm:items-end">
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
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
                onClick={() => setType(f.category)}
                className="group relative min-h-64 border-b border-foreground p-6 text-left transition-colors hover:bg-foreground hover:text-background sm:border-r sm:p-8"
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
      <section className="border-b-2 border-foreground bg-card">
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
            <div className="border-t-2 border-foreground">
              <article className="grid gap-4 border-b border-foreground py-7 sm:grid-cols-[3rem_10rem_1fr] sm:items-start">
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

              <article className="grid gap-4 border-b border-foreground py-7 sm:grid-cols-[3rem_10rem_1fr] sm:items-start">
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
