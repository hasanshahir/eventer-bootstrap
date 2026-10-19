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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Editorial Header */}
      <header className="border-b-2 border-zinc-800 bg-zinc-950 px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-zinc-800 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
            <span className="flex items-center gap-2 text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Cryptographic DevPassport &bull; Verified Credentials
            </span>
            <span className="text-zinc-500 font-mono">Status: Authenticated</span>
          </div>

          <h1 className="mt-8 font-serif text-5xl sm:text-7xl font-bold tracking-tight text-white">
            Your Active Passes.
          </h1>
          <p className="mt-4 max-w-[60ch] border-l-4 border-emerald-500 pl-4 text-sm sm:text-base font-medium leading-relaxed text-zinc-300">
            Dynamic, tamper-evident QR tickets issued for Pakistan&apos;s hackathons and developer conferences. Present at the venue gate for instant offline check-in.
          </p>

          {/* Attendee Identity Dossier */}
          <div className="mt-8 border border-zinc-800 bg-zinc-900/70 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="size-16 border-2 border-emerald-500 bg-zinc-950 grid place-items-center font-mono text-2xl font-bold text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]">
                {initials}
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">{user.name}</h2>
                <p className="font-mono text-xs text-zinc-400 mt-1">
                  {user.university} &bull; {user.city}
                </p>
                <p className="font-mono text-[11px] text-emerald-400 mt-1">
                  DEVPASSPORT #{hash} &bull; {user.email}
                </p>
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:pl-6">
              <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                Active Passes
              </span>
              <span className="font-mono text-3xl font-bold text-white">
                {regs.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Ticket Passes */}
      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-8 lg:px-12 flex-1">
        {loading && (
          <div className="p-16 border border-zinc-800 text-center font-mono text-sm text-zinc-400">
            Decrypting passport ledger...
          </div>
        )}

        {!loading && regs.length === 0 && (
          <div className="border border-zinc-800 bg-zinc-900/40 p-16 text-center space-y-4">
            <p className="font-serif text-3xl text-zinc-300">No active event tickets found.</p>
            <p className="font-mono text-xs text-zinc-500 max-w-[45ch] mx-auto">
              You haven&apos;t RSVP&apos;d to any tech events yet. Explore the live radar and secure your pass in 1 tap.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-zinc-700 bg-emerald-500 px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-black hover:bg-emerald-400 transition-colors"
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
                className="border border-zinc-800 bg-zinc-900/60 flex flex-col md:flex-row justify-between hover:border-emerald-500/50 transition-all shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]"
              >
                {/* Left Ticket Details */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                      <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        {ticketNumber} &bull; {ev.type}
                      </span>
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold">
                        {r.status}
                      </span>
                    </div>

                    <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
                      {ev.title}
                    </h2>

                    <p className="mt-3 font-mono text-xs text-emerald-400 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                        className="size-4"
                      >
                        <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" />
                      </svg>
                      {[ev.venue, ev.city].filter(Boolean).join(" &bull; ")}
                    </p>

                    <p className="mt-2 font-mono text-xs text-zinc-400">
                      Date & Time: {fmtDate(ev.startsAt)}
                    </p>

                    <p className="mt-4 text-xs text-zinc-400 max-w-[65ch] leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[11px] text-zinc-500">
                    <span>Organizer: {ev.organizer || "Community Host"}</span>
                    <span>Issued via Eventer DevPassport</span>
                  </div>
                </div>

                {/* Perforated Divider & QR Code Section */}
                <div className="border-t md:border-t-0 md:border-l-2 border-dashed border-zinc-800 p-8 bg-zinc-950 flex flex-col items-center justify-center min-w-[240px]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-3 text-center">
                    GATE CHECK-IN PASS
                  </p>
                  <div className="bg-white p-3.5 rounded shadow-lg">
                    <QRCodeSVG value={r.ticketToken} size={150} level="H" />
                  </div>
                  <p className="mt-3 font-mono text-[10px] text-zinc-400 text-center break-all max-w-[170px]">
                    {r.ticketToken}
                  </p>
                  <span className="mt-2 font-mono text-[9px] uppercase text-emerald-400 tracking-wider">
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
