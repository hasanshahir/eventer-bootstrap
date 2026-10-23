"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { demoUser } from "@/lib/demoUser";
import { toCard, fmtDate } from "@/lib/ev";

export default function PassportPage() {
  const [user, setUser] = useState(demoUser);
  const [regs, setRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let u = demoUser;
    try {
      const r = localStorage.getItem("eventer_user");
      if (r) u = JSON.parse(r);
    } catch {}
    setUser(u);

    fetch(`/api/v1/registrations?email=${encodeURIComponent(u.email)}`)
      .then((r) => r.json())
      .then((d) => setRegs(d.registrations ?? []))
      .catch((err) => console.error("Error fetching passport registrations:", err))
      .finally(() => setLoading(false));
  }, []);

  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .join("");

  const hash = Array.from(user.email)
    .reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
    .toString(16)
    .toUpperCase()
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white dark:selection:bg-blue-500 dark:selection:text-black transition-colors">
      {/* Editorial Header */}
      <header className="border-b-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#030712] px-4 py-12 sm:px-8 lg:px-12 transition-colors">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 dark:border-zinc-800 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
            <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span className="size-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              Cryptographic DevPassport &bull; Verified Credentials
            </span>
            <span className="text-slate-500 dark:text-zinc-500 font-mono">Status: Authenticated</span>
          </div>

          <h1 className="mt-8 text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            Your Active Passes.
          </h1>
          <p className="mt-4 max-w-[60ch] border-l-4 border-blue-600 dark:border-blue-500 pl-4 text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
            Dynamic, tamper-evident QR tickets issued for Pakistan&apos;s hackathons and developer conferences. Present at the venue gate for instant offline check-in.
          </p>

          {/* Attendee Identity Dossier */}
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="size-16 rounded-xl border-2 border-emerald-500 bg-zinc-950 grid place-items-center font-mono text-2xl font-bold text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]">
                {initials}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="font-mono text-xs text-zinc-400 mt-1">
                  {user.university} &bull; {user.city}
                </p>
                <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                  DEVPASSPORT #{hash} &bull; {user.email}
                </p>
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-zinc-800 pt-4 sm:pt-0 sm:pl-6">
              <span className="font-mono text-[10px] uppercase text-slate-500 dark:text-zinc-500 block">
                Active Passes
              </span>
              <span className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
                {regs.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Ticket Passes */}
      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-8 lg:px-12 flex-1">
        {loading && (
          <div className="p-16 border border-slate-200 dark:border-zinc-800 text-center font-mono text-sm text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-950">
            Decrypting passport ledger...
          </div>
        )}

        {!loading && regs.length === 0 && (
          <div className="border border-zinc-800 bg-zinc-900/40 p-16 text-center space-y-4 rounded-2xl">
            <p className="text-2xl sm:text-3xl font-bold text-zinc-200">No active event tickets found.</p>
            <p className="font-mono text-xs text-zinc-500 max-w-[45ch] mx-auto">
              You haven&apos;t RSVP&apos;d to any tech events yet. Explore the live radar and secure your pass in 1 tap.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-emerald-500 px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-black hover:bg-emerald-400 transition-colors"
            >
              Open Radar &rarr;
            </Link>
          </div>
        )}

        <div className="space-y-8">
          {regs.map((r, i) => {
            const ev = toCard(r.event ?? {});
            const ticketNumber = `TKT-${String(i + 1).padStart(2, "0")}`;

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 flex flex-col md:flex-row justify-between hover:border-emerald-500/50 transition-all shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {/* Left Ticket Details */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3 mb-4">
                      <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-500">
                        {ticketNumber} &bull; {ev.type}
                      </span>
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full border border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold">
                        {r.status}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {ev.title}
                    </h2>

                    <p className="mt-3 font-mono text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                        className="size-4 shrink-0"
                      >
                        <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" />
                      </svg>
                      {[ev.venue, ev.city].filter(Boolean).join(" • ")}
                    </p>

                    <p className="mt-2 font-mono text-xs text-slate-600 dark:text-zinc-400">
                      Date & Time: {fmtDate(ev.startsAt)}
                    </p>

                    <p className="mt-4 text-xs text-slate-600 dark:text-zinc-400 max-w-[65ch] leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between font-mono text-[11px] text-slate-500 dark:text-zinc-500">
                    <span>Organizer: {ev.organizer || "Community Host"}</span>
                    <span>Issued via Eventer DevPassport</span>
                  </div>
                </div>

                {/* Perforated Divider & QR Code Section */}
                <div className="border-t md:border-t-0 md:border-l-2 border-dashed border-slate-200 dark:border-zinc-800 p-8 bg-slate-50 dark:bg-black flex flex-col items-center justify-center min-w-[240px]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500 mb-3 text-center">
                    GATE CHECK-IN PASS
                  </p>
                  <div className="bg-white p-3.5 rounded shadow-md border border-slate-200 dark:border-none">
                    <QRCodeSVG value={r.ticketToken} size={150} level="H" />
                  </div>
                  <p className="mt-3 font-mono text-[10px] text-slate-600 dark:text-zinc-400 text-center break-all max-w-[170px]">
                    {r.ticketToken}
                  </p>
                  <span className="mt-2 font-mono text-[9px] uppercase text-blue-600 dark:text-blue-400 font-bold tracking-wider">
                    Dynamic Token
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
