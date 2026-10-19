import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface Desk {
  city: string;
  tag: string;
  queryParam: string;
  note: string;
  iconType: 'virtual' | 'pin';
}

interface Region {
  id: string;
  name: string;
  desks: Desk[];
}

const REGIONS: Region[] = [
  {
    id: '01',
    name: 'Federal & Virtual',
    desks: [
      {
        city: 'Online / Virtual',
        queryParam: 'Remote',
        tag: 'Nationwide Digital',
        note: 'Virtual Hackathons & Global meetups',
        iconType: 'virtual',
      },
      {
        city: 'Islamabad',
        queryParam: 'Islamabad',
        tag: 'Federal AI & DeepTech',
        note: 'NUST, FAST, COMSATS, GIDS',
        iconType: 'pin',
      },
    ],
  },
  {
    id: '02',
    name: 'Punjab Hubs',
    desks: [
      {
        city: 'Lahore',
        queryParam: 'Lahore',
        tag: 'Startup & Dev Valley',
        note: 'LUMS, FAST, ITU, PUCIT, SOFTEC',
        iconType: 'pin',
      },
      {
        city: 'Rawalpindi',
        queryParam: 'Rawalpindi',
        tag: 'Twin Cities Circuit',
        note: 'Cyber & Security Sprints',
        iconType: 'pin',
      },
      {
        city: 'Faisalabad',
        queryParam: 'Faisalabad',
        tag: 'Industrial Tech Center',
        note: 'AgriTech & Youth Summits, UAF',
        iconType: 'pin',
      },
      {
        city: 'Multan',
        queryParam: 'Multan',
        tag: 'South Punjab Devs',
        note: 'Bahauddin Zakariya University',
        iconType: 'pin',
      },
      {
        city: 'Sialkot',
        queryParam: 'Sialkot',
        tag: 'Export Tech Hub',
        note: 'Industrial Software & Automation',
        iconType: 'pin',
      },
      {
        city: 'Gujranwala',
        queryParam: 'Gujranwala',
        tag: 'Active Tech Community',
        note: 'GIFT University & Dev Meetups',
        iconType: 'pin',
      },
    ],
  },
  {
    id: '03',
    name: 'Sindh Hubs',
    desks: [
      {
        city: 'Karachi',
        queryParam: 'Karachi',
        tag: 'Coastal Mega Hub',
        note: 'NED, FAST, IBA, GDG Kolachi, 10Pearls',
        iconType: 'pin',
      },
      {
        city: 'Hyderabad',
        queryParam: 'Hyderabad',
        tag: 'Sindh Univ Circuit',
        note: 'Mehran UET Circuit & Sindh University',
        iconType: 'pin',
      },
      {
        city: 'Sukkur',
        queryParam: 'Sukkur',
        tag: 'Upper Sindh Node',
        note: 'IBA Sukkur SIBA Tech Community',
        iconType: 'pin',
      },
    ],
  },
  {
    id: '04',
    name: 'Khyber Pakhtunkhwa',
    desks: [
      {
        city: 'Peshawar',
        queryParam: 'Peshawar',
        tag: 'Frontier Tech Hub',
        note: 'UET Peshawar, IM|Sciences, Durshal',
        iconType: 'pin',
      },
      {
        city: 'Topi (GIKI)',
        queryParam: 'Topi',
        tag: 'GIKI Tech Oasis',
        note: 'ACM All-Pakistan Olympiad, Netronix',
        iconType: 'pin',
      },
      {
        city: 'Abbottabad',
        queryParam: 'Abbottabad',
        tag: 'Hill Tech Hub',
        note: 'COMSATS Abbottabad Campus',
        iconType: 'pin',
      },
      {
        city: 'Mardan',
        queryParam: 'Mardan',
        tag: 'Northern Engineering',
        note: 'UET Mardan Innovation Hub',
        iconType: 'pin',
      },
      {
        city: 'Swat',
        queryParam: 'Swat',
        tag: 'Valley Dev Circuit',
        note: 'University of Swat & Tech Startups',
        iconType: 'pin',
      },
    ],
  },
  {
    id: '05',
    name: 'Balochistan & Northern Regions',
    desks: [
      {
        city: 'Quetta',
        queryParam: 'Quetta',
        tag: 'Balochistan Tech Hub',
        note: 'BUITEMS & UoB Innovation Lab',
        iconType: 'pin',
      },
      {
        city: 'Gwadar',
        queryParam: 'Gwadar',
        tag: 'Deep Sea Port Cyber',
        note: 'Digital Maritime & Smart Port Sprints',
        iconType: 'pin',
      },
      {
        city: 'Muzaffarabad',
        queryParam: 'Muzaffarabad',
        tag: 'Kashmir Valley Hub',
        note: 'AJKU Software & IoT Hackathons',
        iconType: 'pin',
      },
      {
        city: 'Gilgit',
        queryParam: 'Gilgit',
        tag: 'Karakoram High-Altitude',
        note: 'Karakoram International University',
        iconType: 'pin',
      },
    ],
  },
];

export default async function CitiesPage() {
  let eventCounts: Record<string, number> = {};
  let totalEvents = 0;

  try {
    if (process.env.DATABASE_URL) {
      const events = await prisma.event.findMany({
        select: { city: true },
      });
      totalEvents = events.length;
      for (const e of events) {
        const c = e.city.trim();
        eventCounts[c] = (eventCounts[c] ?? 0) + 1;
      }
    }
  } catch (err) {
    console.error('Error querying city event counts:', err);
  }

  const totalDesks = REGIONS.reduce((acc, r) => acc + r.desks.length, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Editorial Hero Header */}
      <header className="border-b-2 border-zinc-800 bg-zinc-950">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[1.35fr_.65fr]">
          {/* Main Hero Column */}
          <div className="relative overflow-hidden border-zinc-800 px-4 py-12 sm:px-8 sm:py-16 lg:border-r lg:px-12 lg:py-20">
            {/* Subtle background radar lines */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
            />

            <div className="relative">
              {/* Wire dispatch meta ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-zinc-800 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                <span className="flex items-center gap-2 text-emerald-400">
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
                <span className="text-zinc-500 font-mono">Pakistan / PKT (UTC+5)</span>
              </div>

              {/* Large Editorial Headline */}
              <h1 className="mt-8 font-serif text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.88] text-white">
                Find your local
                <span className="block italic text-emerald-400 font-normal mt-1">
                  tech signal.
                </span>
              </h1>

              {/* Editorial Subtitle with Green Accent Border */}
              <p className="mt-8 max-w-[58ch] border-l-4 border-emerald-500 pl-4 text-sm sm:text-base font-medium leading-relaxed text-zinc-300">
                Follow university circuits, independent communities, developer meetups and open competitions from Karachi to Gilgit—and every active desk between.
              </p>
            </div>
          </div>

          {/* Directory Ledger Aside */}
          <aside className="flex flex-col justify-between bg-zinc-900/90 border-t lg:border-t-0 lg:border-l border-zinc-800 p-6 sm:p-10 lg:p-12">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold">
                Directory ledger
              </p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl italic text-white">
                National coverage
              </h2>
            </div>

            <dl className="my-8 divide-y divide-zinc-800 border-y border-zinc-800">
              <div className="flex items-end justify-between py-5">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                  Listed city desks
                </dt>
                <dd className="font-mono text-5xl sm:text-6xl font-bold text-white tracking-tight">
                  {totalDesks}
                </dd>
              </div>
              <div className="flex items-end justify-between py-5">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                  Indexed events
                </dt>
                <dd className="font-mono text-5xl sm:text-6xl font-bold text-emerald-400 tracking-tight">
                  {totalEvents}
                </dd>
              </div>
            </dl>

            <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-zinc-500">
              City counts reflect currently indexed events in PostgreSQL and update dynamically in real time.
            </p>
          </aside>
        </div>
      </header>

      {/* Main Desks Field */}
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
        {/* Section Header */}
        <div className="mb-12 flex flex-col justify-between gap-4 border-b-2 border-zinc-800 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Regional desks / 05 editions
            </p>
            <h2 className="mt-2 font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white">
              Browse the field.
            </h2>
          </div>
          <p className="max-w-[36ch] text-xs leading-relaxed text-zinc-400 sm:text-right font-mono">
            Each dispatch opens a live event feed filtered to that city or province circuit.
          </p>
        </div>

        {/* Regions Loop */}
        <div className="space-y-16">
          {REGIONS.map((region) => (
            <section key={region.id} aria-labelledby={`region-${region.id}`}>
              {/* Region Banner */}
              <div className="grid grid-cols-[3rem_1fr_auto] items-end gap-3 border-b-2 border-zinc-800 pb-3 mb-0">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {region.id}
                </span>
                <h3
                  id={`region-${region.id}`}
                  className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white"
                >
                  {region.name}
                </h3>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:block">
                  {region.desks.length} desks
                </span>
              </div>

              {/* Connected Newspaper Grid */}
              <div className="grid border-l border-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
                {region.desks.map((desk, idx) => {
                  const deskNumber = `${region.id}.${String(idx + 1).padStart(2, '0')}`;
                  const count = eventCounts[desk.queryParam] ?? eventCounts[desk.city] ?? 0;

                  return (
                    <article
                      key={desk.city}
                      className="group min-h-[19rem] border-b border-r border-zinc-800 bg-zinc-950/70 hover:bg-zinc-900 transition-all duration-150"
                    >
                      <Link
                        href={`/?city=${encodeURIComponent(desk.queryParam)}`}
                        className="flex h-full min-h-[19rem] flex-col p-6 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        aria-label={`View events in ${desk.city}`}
                      >
                        {/* Top Card Row */}
                        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
                          <span className="font-serif text-4xl italic text-zinc-600 group-hover:text-zinc-400 transition-colors">
                            {deskNumber}
                          </span>
                          <span className="grid size-11 place-items-center border border-zinc-800 bg-zinc-900 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-colors">
                            {desk.iconType === 'virtual' ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="1em"
                                height="1em"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                                className="size-5 text-emerald-400"
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
                                className="size-5 text-emerald-400"
                              >
                                <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {/* Mid Card Content */}
                        <div className="flex flex-1 flex-col justify-between py-5">
                          <div>
                            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
                              {desk.tag}
                            </p>
                            <h4 className="mt-2.5 font-sans text-3xl font-bold leading-tight tracking-tight text-white group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">
                              {desk.city}
                            </h4>
                            <p className="mt-2 text-xs leading-relaxed text-zinc-400 font-sans">
                              {desk.note}
                            </p>
                          </div>

                          {/* Bottom Card Footer */}
                          <div className="mt-6 flex items-end justify-between border-t border-zinc-800/80 pt-4">
                            <div>
                              <span className="block font-mono text-3xl sm:text-4xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                {count}
                              </span>
                              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-zinc-500">
                                {count === 1 ? 'Open event' : count > 0 ? 'Open events' : 'Awaiting listings'}
                              </span>
                            </div>

                            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300 group-hover:text-emerald-400 transition-colors">
                              {count > 0 ? 'Open desk' : 'View desk'}
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

      {/* Editorial Bottom CTA */}
      <footer className="border-t-2 border-zinc-800 bg-emerald-500 text-zinc-950 py-10 sm:py-12 mt-16">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-8 lg:px-12">
          <div>
            <p className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
              Don&apos;t see your local community?
            </p>
            <p className="text-zinc-900 text-xs sm:text-sm font-medium mt-1">
              Submit your campus hackathon, society workshop, or meetup to the nationwide radar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/organizer/new"
              className="inline-flex items-center justify-between gap-4 border border-zinc-950 bg-zinc-950 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-zinc-900 transition-colors"
            >
              File an event listing
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
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
