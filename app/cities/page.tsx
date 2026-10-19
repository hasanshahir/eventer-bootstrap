import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REGIONS = [
  { name: "Federal & Virtual", desks: [
    { city: "Islamabad", title: "Federal AI & DeepTech", note: "NUST, FAST, COMSATS" },
    { city: "Remote", title: "Nationwide Digital", note: "Online / virtual hackathons" },
  ]},
  { name: "Punjab Hubs", desks: [
    { city: "Lahore", title: "Startup & Dev Valley", note: "LUMS, FAST, ITU, PUCIT" },
    { city: "Rawalpindi", title: "Twin Cities Circuit", note: "Cyber & security sprints" },
    { city: "Faisalabad", title: "Industrial Tech Center", note: "AgriTech & youth summits" },
    { city: "Multan", title: "South Punjab Devs", note: "Bahauddin Zakariya Univ" },
  ]},
  { name: "Sindh Hubs", desks: [
    { city: "Karachi", title: "Coastal Mega Hub", note: "NED, FAST, IBA, GDG Kolachi" },
    { city: "Hyderabad", title: "Sindh Univ Circuit", note: "Mehran UET circuit" },
  ]},
  { name: "Khyber Pakhtunkhwa & Balochistan", desks: [
    { city: "Peshawar", title: "Frontier Tech Hub", note: "UET Peshawar, IM|Sciences" },
    { city: "Quetta", title: "Balochistan Tech Hub", note: "BUITEMS & UoB" },
  ]},
];

export default async function Cities() {
  const events: any[] = await (prisma as any).event.findMany({ select: { city: true } });
  const counts: Record<string, number> = {};
  for (const e of events) counts[e.city] = (counts[e.city] ?? 0) + 1;
  const deskCount = REGIONS.reduce((n, r) => n + r.desks.length, 0);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <p className="font-mono text-xs text-emerald-400">GEOGRAPHIC WIRE / ALL PROVINCES</p>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-3">Find your local tech signal.</h1>
      <p className="text-zinc-400 mt-3 max-w-2xl">
        Follow university circuits, community meetups and open competitions across Pakistan. Each desk opens a live feed filtered to that city.
      </p>

      <div className="grid grid-cols-2 gap-4 mt-8 max-w-md">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <p className="font-mono text-xs text-zinc-500">LISTED DESKS</p>
          <p className="text-3xl font-bold text-emerald-400 font-mono">{deskCount}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <p className="font-mono text-xs text-zinc-500">INDEXED EVENTS</p>
          <p className="text-3xl font-bold text-cyan-400 font-mono">{events.length}</p>
        </div>
      </div>

      <div className="mt-12 space-y-10">
        {REGIONS.map((r, ri) => (
          <section key={r.name}>
            <div className="flex items-baseline gap-3 border-b border-zinc-800 pb-2 mb-4">
              <span className="font-mono text-sm text-emerald-400">{pad(ri + 1)}</span>
              <h2 className="text-xl font-semibold">{r.name}</h2>
              <span className="font-mono text-xs text-zinc-500 ml-auto">{r.desks.length} desks</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {r.desks.map((d, di) => {
                const n = counts[d.city] ?? 0;
                return (
                  <Link key={d.city} href={`/?city=${encodeURIComponent(d.city)}`}
                    className="group bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/50 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.4)] transition">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-zinc-500">{pad(ri + 1)}.{pad(di + 1)}</span>
                      <span className={`font-mono text-xs px-2 py-0.5 rounded-full border ${n ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "text-zinc-500 border-zinc-700"}`}>
                        {n ? `${n} open` : "awaiting listings"}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-3">{d.title}</p>
                    <h3 className="text-xl font-semibold group-hover:text-emerald-400 transition">{d.city}</h3>
                    <p className="font-mono text-xs text-zinc-500 mt-1">{d.note}</p>
                    <p className="font-mono text-xs text-cyan-400 mt-4">{n ? "Open desk →" : "View empty desk →"}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-300">Don't see your local community?</p>
        <Link href="/organizer/new" className="bg-emerald-500 text-black font-semibold rounded-lg px-4 py-2 text-sm">+ Submit an event</Link>
      </div>
    </div>
  );
}