import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Desk {
  slug: string;
  city: string;
  tag: string;
  note: string;
  isVirtual?: boolean;
}

interface Region {
  id: string;
  name: string;
  desks: Desk[];
}

const REGIONAL_DIVISIONS: Region[] = [
  {
    id: "01",
    name: "Federal & Virtual",
    desks: [
      {
        slug: "online",
        city: "Online / Virtual",
        tag: "Nationwide Digital",
        note: "Virtual Hackathons & Global",
        isVirtual: true,
      },
      {
        slug: "islamabad",
        city: "Islamabad",
        tag: "Federal AI & DeepTech",
        note: "NUST, FAST, COMSATS",
      },
    ],
  },
  {
    id: "02",
    name: "Punjab Hubs",
    desks: [
      {
        slug: "lahore",
        city: "Lahore",
        tag: "Startup & Dev Valley",
        note: "LUMS, FAST, ITU, PUCIT",
      },
      {
        slug: "rawalpindi",
        city: "Rawalpindi",
        tag: "Twin Cities Circuit",
        note: "Cyber & Security Sprints",
      },
      {
        slug: "faisalabad",
        city: "Faisalabad",
        tag: "Industrial Tech Center",
        note: "AgriTech & Youth Summits",
      },
      {
        slug: "multan",
        city: "Multan",
        tag: "South Punjab Devs",
        note: "Bahauddin Zakariya Univ",
      },
      {
        slug: "sialkot",
        city: "Sialkot",
        tag: "Active Tech Community",
        note: "No open listings right now. This desk is ready for the next community dispatch.",
      },
      {
        slug: "gujranwala",
        city: "Gujranwala",
        tag: "Active Tech Community",
        note: "No open listings right now. This desk is ready for the next community dispatch.",
      },
    ],
  },
  {
    id: "03",
    name: "Sindh Hubs",
    desks: [
      {
        slug: "karachi",
        city: "Karachi",
        tag: "Coastal Mega Hub",
        note: "FAST, NED, IBA, TechJuice",
      },
      {
        slug: "hyderabad",
        city: "Hyderabad",
        tag: "Sindh Univ Circuit",
        note: "Mehran UET Circuit",
      },
      {
        slug: "sukkur",
        city: "Sukkur",
        tag: "Active Tech Community",
        note: "No open listings right now. This desk is ready for the next community dispatch.",
      },
    ],
  },
  {
    id: "04",
    name: "Khyber Pakhtunkhwa",
    desks: [
      {
        slug: "peshawar",
        city: "Peshawar",
        tag: "Frontier Tech Hub",
        note: "UET Peshawar, IM|Sciences",
      },
      {
        slug: "topi",
        city: "Topi (GIKI)",
        tag: "GIKI Tech Oasis",
        note: "ACM All-Pakistan Olympiad",
      },
      {
        slug: "abbottabad",
        city: "Abbottabad",
        tag: "Active Tech Community",
        note: "No open listings right now. This desk is ready for the next community dispatch.",
      },
      {
        slug: "mardan",
        city: "Mardan",
        tag: "Active Tech Community",
        note: "No open listings right now. This desk is ready for the next community dispatch.",
      },
      {
        slug: "swat",
        city: "Swat",
        tag: "Active Tech Community",
        note: "No open listings right now. This desk is ready for the next community dispatch.",
      },
    ],
  },
  {
    id: "05",
    name: "Balochistan & Emerging",
    desks: [
      {
        slug: "quetta",
        city: "Quetta",
        tag: "Balochistan Tech Hub",
        note: "BUITEMS & UoB Hub",
      },
      {
        slug: "gilgit",
        city: "Gilgit",
        tag: "Active Tech Community",
        note: "No open listings right now. This desk is ready for the next community dispatch.",
      },
      {
        slug: "muzaffarabad",
        city: "Muzaffarabad",
        tag: "Active Tech Community",
        note: "No open listings right now. This desk is ready for the next community dispatch.",
      },
      {
        slug: "gwadar",
        city: "Gwadar",
        tag: "Active Tech Community",
        note: "No open listings right now. This desk is ready for the next community dispatch.",
      },
    ],
  },
];

export default async function CitiesPage() {
  let events: any[] = [];
  try {
    events = await (prisma as any).event.findMany({ select: { city: true } });
  } catch {
    events = [];
  }

  // Count active events per city
  const counts: Record<string, number> = {};
  for (const e of events) {
    const c = (e.city || "").trim().toLowerCase();
    counts[c] = (counts[c] ?? 0) + 1;
    if (c === "remote" || c === "online") {
      counts["online"] = (counts["online"] ?? 0) + 1;
    }
  }

  const totalDesks = REGIONAL_DIVISIONS.reduce((acc, r) => acc + r.desks.length, 0);
  const totalEvents = events.length;

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground transition-colors duration-200">
      {/* Editorial Masthead Hero Banner */}
      <header className="border-b-2 border-foreground/40 pt-[4.5rem]">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[1.35fr_.65fr]">
          {/* Left Column Desk */}
          <div className="relative overflow-hidden border-foreground/30 px-4 py-12 sm:px-6 sm:py-16 lg:border-r lg:px-10 lg:py-20">
            <div
              aria-hidden="true"
              className="paper-grid absolute inset-0 opacity-20 dark:opacity-35 pointer-events-none text-foreground"
            />
            <div className="relative">
              {/* Meta Wire Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-foreground/30 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
                <span className="flex items-center gap-2 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="size-4 animate-pulse"
                  >
                    <path d="M232,116h-4.72A100.21,100.21,0,0,0,140,28.72V24a12,12,0,0,0-24,0v4.72A100.21,100.21,0,0,0,28.72,116H24a12,12,0,0,0,0,24h4.72A100.21,100.21,0,0,0,116,227.28V232a12,12,0,0,0,24,0v-4.72A100.21,100.21,0,0,0,227.28,140H232a12,12,0,0,0,0-24Zm-92,87v-3a12,12,0,0,0-24,0v3a76.15,76.15,0,0,1-63-63h3a12,12,0,0,0,0-24H53a76.15,76.15,0,0,1,63-63v3a12,12,0,0,0,24,0V53a76.15,76.15,0,0,1,63,63h-3a12,12,0,0,0,0,24h3A76.15,76.15,0,0,1,140,203ZM128,84a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,84Zm0,64a20,20,0,1,1,20-20A20,20,0,0,1,128,148Z" />
                  </svg>
                  Geographic wire / all provinces
                </span>
                <span className="font-mono text-muted-foreground">Pakistan / PKT</span>
              </div>

              {/* Large Headline */}
              <h1 className="mt-9 max-w-[12ch] font-heading text-[clamp(3.5rem,8vw,7.5rem)] font-medium leading-[0.85] tracking-[-0.05em] text-foreground">
                Find your local
                <span className="block italic text-primary">
                  tech signal.
                </span>
              </h1>

              {/* Editorial Description */}
              <p className="mt-8 max-w-[55ch] border-l-4 border-primary pl-4 text-sm font-medium leading-relaxed sm:text-base text-foreground/80">
                Follow university circuits, independent communities, developer meetups and open competitions from Karachi to Gilgit—and every active desk between.
              </p>
            </div>
          </div>

          {/* Right Rail: National Directory Ledger */}
          <aside className="flex flex-col justify-between bg-foreground text-background dark:bg-card dark:text-foreground dark:border-t-0 dark:border-l dark:border-foreground/30 p-6 sm:p-10 lg:p-12 border-t lg:border-t-0 border-foreground/30">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/60 dark:text-muted-foreground">
                Directory ledger
              </p>
              <h2 className="mt-2 font-heading text-4xl italic text-background dark:text-foreground">
                National coverage
              </h2>
            </div>

            <dl className="mt-12 divide-y divide-background/20 dark:divide-foreground/20 border-y border-background/20 dark:border-foreground/20">
              <div className="flex items-end justify-between py-6">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-background/60 dark:text-muted-foreground">
                  Listed city desks
                </dt>
                <dd className="font-heading text-6xl text-primary font-bold">
                  {totalDesks}
                </dd>
              </div>
              <div className="flex items-end justify-between py-6">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-background/60 dark:text-muted-foreground">
                  Indexed events
                </dt>
                <dd className="font-heading text-6xl text-background dark:text-foreground font-bold">
                  {totalEvents}
                </dd>
              </div>
            </dl>

            <p className="mt-8 font-mono text-[9px] uppercase leading-relaxed tracking-[0.13em] text-background/60 dark:text-muted-foreground">
              City counts reflect currently indexed registrations and update as source feeds are scanned.
            </p>
          </aside>
        </div>
      </header>

      {/* Main Regional Directory Grid */}
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
        <div className="mb-12 flex flex-col justify-between gap-4 border-b-2 border-foreground/40 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Regional desks / 05 editions
            </p>
            <h2 className="mt-2 font-heading text-4xl font-medium tracking-[-0.04em] sm:text-6xl text-foreground">
              Browse the field.
            </h2>
          </div>
          <p className="max-w-[36ch] text-xs leading-relaxed text-muted-foreground sm:text-right">
            Each dispatch opens a live event feed filtered to that city or region.
          </p>
        </div>

        {/* 5 Province & Territory Divisions */}
        <div className="space-y-16">
          {REGIONAL_DIVISIONS.map((region) => (
            <section key={region.id} aria-labelledby={`region-${region.id}`}>
              {/* Region Header Ribbon */}
              <div className="grid grid-cols-[3rem_1fr_auto] items-end gap-3 border-b-2 border-foreground/40 pb-3">
                <span className="font-mono text-xs font-bold text-primary">
                  {region.id}
                </span>
                <h2
                  id={`region-${region.id}`}
                  className="font-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl text-foreground"
                >
                  {region.name}
                </h2>
                <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
                  {region.desks.length} desks
                </span>
              </div>

              {/* Connected Newspaper Desks Grid */}
              <div className="grid border-l border-foreground/30 sm:grid-cols-2 lg:grid-cols-3">
                {region.desks.map((desk, idx) => {
                  const deskNumber = `${region.id}.${String(idx + 1).padStart(2, "0")}`;
                  const lookupKey = desk.city.toLowerCase();
                  const eventCount =
                    counts[lookupKey] ??
                    (desk.isVirtual ? counts["online"] ?? counts["remote"] ?? 0 : 0);
                  const hasEvents = eventCount > 0;

                  return (
                    <article
                      key={desk.slug}
                      className="group min-h-[18rem] border-b border-r border-foreground/30 bg-card transition-colors hover:bg-background"
                    >
                      <Link
                        href={`/?city=${encodeURIComponent(desk.city)}`}
                        className="flex h-full min-h-[18rem] flex-col p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-6"
                        aria-label={`View events in ${desk.city}`}
                      >
                        {/* Top Card Row */}
                        <div className="flex items-start justify-between border-b border-foreground/30 pb-4">
                          <span className="font-heading text-4xl italic text-muted-foreground/70 group-hover:text-primary transition-colors">
                            {deskNumber}
                          </span>
                          <span className="grid size-11 place-items-center border border-foreground/30 bg-background text-primary transition-transform group-hover:scale-105">
                            {desk.isVirtual ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="1em"
                                height="1em"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                                className="size-5"
                              >
                                <path d="M128,24h0A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm88,104a87.61,87.61,0,0,1-3.33,24H174.16a157.44,157.44,0,0,0,0-48h38.51A87.61,87.61,0,0,1,216,128ZM102,168H154a115.11,115.11,0,0,1-26,45A115.27,115.27,0,0,1,102,168Zm-3.9-16a140.84,140.84,0,0,1,0-48h59.88a140.84,140.84,0,0,1,0,48ZM40,128a87.61,87.61,0,0,1,3.33-24H81.84a157.44,157.44,0,0,0,0,48H43.33A87.61,87.61,0,0,1,40,128ZM154,88H102a115.11,115.11,0,0,1,26-45A115.27,115.27,0,0,1,154,88Zm52.33,0H170.71a135.28,135.28,0,0,0-22.3-45.6A88.29,88.29,0,0,1,206.37,88ZM107.59,42.4A135.28,135.28,0,0,0,85.29,88H49.63A88.29,88.29,0,0,1,107.59,42.4ZM49.63,168H85.29a135.28,135.28,0,0,0,22.3,45.6A88.29,88.29,0,0,1,49.63,168Zm98.78,45.6a135.28,135.28,0,0,0,22.3-45.6h35.66A88.29,88.29,0,0,1,148.41,213.6Z" />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="1em"
                                height="1em"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                                className="size-5"
                              >
                                <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {/* Mid Card Content */}
                        <div className="flex flex-1 flex-col justify-between py-5">
                          <div>
                            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
                              {desk.tag}
                            </p>
                            <h3 className="mt-3 font-heading text-4xl font-semibold leading-none tracking-[-0.04em] text-foreground transition-transform group-hover:translate-x-1">
                              {desk.city}
                            </h3>
                            <p className="mt-3 max-w-[30ch] text-xs leading-relaxed text-muted-foreground">
                              {desk.note}
                            </p>
                          </div>

                          {/* Bottom Card Footer */}
                          <div className="mt-6 flex items-end justify-between border-t border-foreground/30 pt-4">
                            <div>
                              <span className="block font-heading text-4xl font-semibold text-primary">
                                {eventCount}
                              </span>
                              <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-muted-foreground">
                                {hasEvents
                                  ? eventCount === 1
                                    ? "Open event"
                                    : "Open events"
                                  : "Awaiting listings"}
                              </span>
                            </div>

                            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground group-hover:text-primary transition-colors">
                              <span>{hasEvents ? "Open desk" : "View empty desk"}</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="1em"
                                height="1em"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                                className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                              >
                                <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
