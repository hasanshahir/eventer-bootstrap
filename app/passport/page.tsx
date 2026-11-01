"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { toCard, fmtDate } from "@/lib/ev";

interface RegistrationRow {
  id: string;
  status: string;
  ticketToken: string;
  checkedInAt?: string | null;
  event?: Record<string, unknown>;
}

interface AccountProfile {
  id: string;
  fullName: string;
  email: string;
  university: string;
  city: string;
}

export default function PassportPage() {
  const [user, setUser] = useState<AccountProfile | null>(null);
  const [regs, setRegs] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/account"),
      fetch("/api/v1/registrations"),
    ])
      .then(async ([accRes, regRes]) => {
        if (accRes.status === 401 || regRes.status === 401) {
          setUnauthenticated(true);
          return;
        }
        const accData = (await accRes.json()) as { profile?: AccountProfile };
        const regData = (await regRes.json()) as {
          registrations?: RegistrationRow[];
        };
        if (accData?.profile) setUser(accData.profile);
        setRegs(regData.registrations ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.fullName || user?.email?.split("@")[0] || "Developer";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hash = user?.email
    ? Array.from(user.email)
        .reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
        .toString(16)
        .toUpperCase()
        .slice(0, 6)
    : "AUTH";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pt-[4.5rem] transition-colors">
      {/* Editorial Header */}
      <header className="border-b-2 border-foreground/30 bg-card px-4 py-12 sm:px-8 lg:px-12 transition-colors">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-foreground/30 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
            <span className="flex items-center gap-2 text-primary">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Signed DevPassport &bull; Verified Credentials
            </span>
            <span className="text-muted-foreground font-mono">
              Status: {unauthenticated ? "Sign-In Required" : "Authenticated"}
            </span>
          </div>

          <h1 className="mt-8 font-heading text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
            Your Active Passes.
          </h1>
          <p className="mt-4 max-w-[60ch] border-l-4 border-primary pl-4 text-sm sm:text-base font-medium leading-relaxed text-muted-foreground">
            Cryptographically signed HS256 JWT QR tickets issued for Pakistan&apos;s hackathons and developer conferences. Present at the venue gate for organizer check-in.
          </p>

          {user && !unauthenticated && (
            <div className="mt-8 border-2 border-foreground bg-background p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[4px_4px_0px_0px_currentColor]">
              <div className="flex items-center gap-5">
                <div className="size-16 border-2 border-foreground bg-primary grid place-items-center font-mono text-2xl font-bold text-white">
                  {initials}
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    {displayName}
                  </h2>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {user.university || "Community Builder"} &bull;{" "}
                    {user.city || "Pakistan"}
                  </p>
                  <p className="font-mono text-[11px] text-primary font-semibold mt-1">
                    DEVPASSPORT #{hash} &bull; {user.email}
                  </p>
                </div>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-foreground/30 pt-4 sm:pt-0 sm:pl-6">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block">
                  Active Passes
                </span>
                <span className="font-heading text-4xl font-bold text-foreground">
                  {regs.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Ticket Passes */}
      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-8 lg:px-12 flex-1">
        {loading ? (
          <div className="p-16 border border-foreground/30 text-center font-mono text-sm text-muted-foreground bg-card">
            Verifying passport ledger…
          </div>
        ) : unauthenticated ? (
          <div className="border-2 border-foreground bg-card p-12 sm:p-16 text-center space-y-4 shadow-[4px_4px_0px_0px_currentColor]">
            <h2 className="font-heading text-3xl font-bold text-foreground">
              Sign in to access your DevPassport
            </h2>
            <p className="font-mono text-xs text-muted-foreground max-w-[48ch] mx-auto">
              Your event passes are bound to your authenticated account session. Sign in with Google or an email magic link to view your QR tickets.
            </p>
            <div className="pt-2">
              <Link
                href="/login?callbackUrl=/passport"
                className="inline-flex items-center gap-2 border border-foreground bg-primary px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_0px_currentColor]"
              >
                Sign In to DevPassport &rarr;
              </Link>
            </div>
          </div>
        ) : regs.length === 0 ? (
          <div className="border-2 border-foreground/40 bg-card p-16 text-center space-y-4 shadow-[4px_4px_0px_0px_currentColor]">
            <p className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              No active event tickets found.
            </p>
            <p className="font-mono text-xs text-muted-foreground max-w-[45ch] mx-auto">
              You haven&apos;t RSVP&apos;d to any on-platform tech events yet. Explore the live radar to register.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-foreground bg-primary px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_0px_currentColor]"
            >
              Open Radar &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {regs.map((r, i) => {
              const ev = toCard(r.event ?? {});
              const ticketNumber = `TKT-${String(i + 1).padStart(2, "0")}`;

              return (
                <div
                  key={r.id}
                  className="border-2 border-foreground bg-card flex flex-col md:flex-row justify-between transition-all shadow-[4px_4px_0px_0px_currentColor] overflow-hidden"
                >
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-foreground/20 pb-3 mb-4">
                        <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {ticketNumber} &bull; {ev.type}
                        </span>
                        <span className="font-mono text-[11px] px-2.5 py-0.5 border border-primary bg-primary/10 text-primary font-semibold">
                          {r.status}
                        </span>
                      </div>

                      <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                        {ev.title}
                      </h2>

                      <p className="mt-3 font-mono text-xs text-primary flex items-center gap-2">
                        {[ev.venue, ev.city].filter(Boolean).join(" • ")}
                      </p>

                      <p className="mt-2 font-mono text-xs text-muted-foreground">
                        Starts: {fmtDate(ev.startsAt)}
                      </p>

                      <p className="mt-4 text-xs text-muted-foreground max-w-[65ch] leading-relaxed">
                        {ev.description}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-foreground/20 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                      <span>Organizer: {ev.organizer || "Community Host"}</span>
                      <span>Signed HS256 JWT Pass</span>
                    </div>
                  </div>

                  <div className="border-t md:border-t-0 md:border-l-2 border-dashed border-foreground/30 p-8 bg-background flex flex-col items-center justify-center min-w-[240px]">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 text-center">
                      GATE CHECK-IN PASS
                    </p>
                    <div className="bg-white p-3.5 border border-foreground">
                      <QRCodeSVG value={r.ticketToken} size={150} level="M" />
                    </div>
                    <p className="mt-3 font-mono text-[10px] text-muted-foreground text-center break-all max-w-[170px] line-clamp-2">
                      {r.ticketToken}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
