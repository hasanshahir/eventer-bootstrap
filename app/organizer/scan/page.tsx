"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";

interface ScanCheckinResult {
  ok?: boolean;
  error?: string;
  alreadyCheckedIn?: boolean;
  checkedInAt?: string;
  attendee?: {
    name?: string | null;
    fullName?: string | null;
    university?: string | null;
  };
  event?: {
    id?: string;
    title?: string;
  };
}

export default function ScanPage() {
  const [authStatus, setAuthStatus] = useState<
    "checking" | "organizer" | "forbidden" | "unauthenticated"
  >("checking");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanCheckinResult | null>(null);
  const [err, setErr] = useState("");
  const [history, setHistory] = useState<ScanCheckinResult[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    fetch("/api/v1/account")
      .then(async (res) => {
        if (res.status === 401) {
          setAuthStatus("unauthenticated");
          return;
        }
        const data = (await res.json()) as { profile?: { role?: string } };
        const role = data.profile?.role;
        if (role === "ORGANIZER" || role === "ADMIN") {
          setAuthStatus("organizer");
        } else {
          setAuthStatus("forbidden");
        }
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  useEffect(() => {
    if (authStatus !== "organizer") return;
    try {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false
      );

      scanner.render(
        (decodedText) => {
          void verify(decodedText);
        },
        () => {}
      );
      scannerRef.current = scanner;
    } catch {}

    return () => {
      try {
        scannerRef.current?.clear();
      } catch {}
    };
  }, [authStatus]);

  async function verify(t: string) {
    if (!t || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setErr("");
    setResult(null);

    try {
      const res = await fetch("/api/v1/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketToken: t }),
      });
      if (res.status === 401) {
        setAuthStatus("unauthenticated");
      }
      const data = (await res.json()) as ScanCheckinResult;
      if (res.ok) {
        setResult(data);
        setHistory((prev) => [data, ...prev.slice(0, 19)]);
      } else {
        setErr(data.error || "Check-in failed");
        if (data.alreadyCheckedIn) {
          setResult(data);
        }
      }
    } catch {
      setErr("Network error during check-in");
    }

    setTimeout(() => {
      busyRef.current = false;
      setBusy(false);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pt-[4.5rem] transition-colors">
      {/* Editorial Header */}
      <header className="border-b-2 border-foreground/30 bg-card px-4 py-12 sm:px-8 lg:px-12 transition-colors">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-foreground/30 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
            <span className="flex items-center gap-2 text-primary">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Organizer Check-In Operations &bull; Live Gate Scanner
            </span>
            <span className="text-muted-foreground font-mono">
              Verification: HS256 Signed JWT
            </span>
          </div>

          <h1 className="mt-8 font-heading text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
            Gate Scanner Desk.
          </h1>
          <p className="mt-4 max-w-[60ch] border-l-4 border-primary pl-4 text-sm sm:text-base font-medium leading-relaxed text-muted-foreground">
            Scan attendee QR passes or verify cryptographic HS256 JWT ticket tokens. Restricted to authorized event organizers (`OrganizerMember`) and platform admins.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-8 lg:px-12 flex-1 space-y-8">
        {authStatus === "unauthenticated" && (
          <div className="border-2 border-foreground bg-card p-8 space-y-4 shadow-[4px_4px_0px_0px_currentColor]">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Organizer Sign-In Required
            </h2>
            <p className="font-mono text-xs text-muted-foreground max-w-[55ch]">
              Gate check-in requires an authenticated `ORGANIZER` or `ADMIN` session associated with the event&apos;s `OrganizerMember` roster.
            </p>
            <Link
              href="/login?callbackUrl=/organizer/scan"
              className="inline-flex items-center gap-2 border border-foreground bg-primary px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_0px_currentColor]"
            >
              Sign In as Organizer &rarr;
            </Link>
          </div>
        )}

        {authStatus === "forbidden" && (
          <div className="border-2 border-amber-500/60 bg-amber-500/10 p-6 font-mono text-xs text-foreground space-y-2">
            <p className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Organizer Role Required
            </p>
            <p>
              Your account is signed in with the attendee `USER` role. Submit an event at{" "}
              <Link href="/organizer/new" className="underline text-primary">
                /organizer/new
              </Link>{" "}
              or ask an organization owner to add you as `OrganizerMember` staff to scan passes.
            </p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          {/* Left Column: QR Scanner & Manual Verification */}
          <div className="space-y-6">
            <div className="border border-foreground/30 bg-card p-6 space-y-4 shadow-[2px_2px_0px_0px_currentColor]">
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                Camera Viewfinder
              </h2>
              <div
                id="reader"
                className="overflow-hidden border border-foreground/30 bg-background min-h-[220px] grid place-items-center font-mono text-xs text-muted-foreground"
              >
                {authStatus !== "organizer" &&
                  "Sign in with an Organizer account to activate camera viewfinder."}
              </div>
            </div>

            {/* Manual Input Fallback */}
            <div className="border border-foreground/30 bg-card p-6 space-y-3 shadow-[2px_2px_0px_0px_currentColor]">
              <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                Manual Signed JWT Override
              </h3>
              <div className="flex gap-2">
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste signed ticket JWT (eyJ...)..."
                  className="flex-1 bg-background border border-foreground/30 px-4 py-2.5 text-sm text-foreground font-mono outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => void verify(token)}
                  disabled={busy || !token.trim()}
                  className="border border-foreground bg-primary text-white font-semibold font-mono text-xs uppercase px-5 py-2.5 hover:bg-blue-600 disabled:opacity-50 shadow-[2px_2px_0px_0px_currentColor]"
                >
                  {busy ? "Checking…" : "Verify"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Scan Result & Live Attendance Ledger */}
          <div className="space-y-6">
            {result?.ok && (
              <div className="border-2 border-emerald-500 bg-emerald-500/10 p-6 space-y-2">
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                  ✓ CHECK-IN CONFIRMED
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                  {result.attendee?.name || result.attendee?.fullName || "Attendee"}
                </h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {result.attendee?.university || "Verified Attendee"}
                </p>
                <p className="font-mono text-[11px] text-primary pt-2 border-t border-foreground/20 font-semibold">
                  Event: {result.event?.title}
                </p>
              </div>
            )}

            {err && (
              <div className="border-2 border-red-500 bg-red-500/10 p-6 space-y-2">
                <span className="font-mono text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider">
                  ✕ SCAN REJECTED
                </span>
                <p className="text-lg font-bold text-foreground">{err}</p>
                {result?.alreadyCheckedIn && (
                  <p className="font-mono text-xs text-muted-foreground">
                    Attendee: {result.attendee?.name || result.attendee?.fullName} &bull; Checked in at{" "}
                    {result.checkedInAt
                      ? new Date(result.checkedInAt).toLocaleTimeString()
                      : "earlier"}
                  </p>
                )}
              </div>
            )}

            {/* History Ledger */}
            <div className="border border-foreground/30 bg-card p-6 shadow-[2px_2px_0px_0px_currentColor]">
              <div className="flex items-center justify-between border-b border-foreground/20 pb-3 mb-4">
                <span className="font-mono text-xs uppercase font-semibold tracking-[0.16em] text-muted-foreground">
                  Session Scan Ledger
                </span>
                <span className="font-mono text-xs text-primary font-bold">
                  {history.length} Checked In
                </span>
              </div>

              {history.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground py-6 text-center">
                  Ready to scan passes.
                </p>
              ) : (
                <div className="divide-y divide-foreground/20 font-mono text-xs">
                  {history.map((h, i) => (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {h.attendee?.name || h.attendee?.fullName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {h.attendee?.university || "Verified Pass"}
                        </p>
                      </div>
                      <span className="text-[10px] text-primary font-bold">
                        ✓ In Gate
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
