"use client";
import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScanPage() {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
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
          verify(decodedText);
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
  }, []);

  async function verify(t: string) {
    if (!t || busy) return;
    setBusy(true);
    setErr("");
    setResult(null);

    try {
      const res = await fetch("/api/v1/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketToken: t }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setHistory((prev) => [data, ...prev.slice(0, 9)]);
      } else {
        setErr(data.error || "Check-in failed");
        if (data.alreadyCheckedIn) {
          setResult(data);
        }
      }
    } catch {
      setErr("Network error during check-in");
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white dark:selection:bg-blue-500 dark:selection:text-black transition-colors">
      {/* Editorial Header */}
      <header className="border-b-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#030712] px-4 py-12 sm:px-8 lg:px-12 transition-colors">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 dark:border-zinc-800 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
            <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span className="size-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              Organizer Check-In Operations &bull; Live Gate Scanner
            </span>
            <span className="text-slate-500 dark:text-zinc-500 font-mono">Camera: WebRTC Stream</span>
          </div>

          <h1 className="mt-8 text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            Gate Scanner Desk.
          </h1>
          <p className="mt-4 max-w-[60ch] border-l-4 border-blue-600 dark:border-blue-500 pl-4 text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
            Scan attendee QR passes or verify cryptographic ticket tokens. Confirms registration status and timestamps check-in instantly in PostgreSQL.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-8 lg:px-12 flex-1 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
        {/* Left Column: QR Scanner & Manual Verification */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Camera Viewfinder</h2>
            <div id="reader" className="overflow-hidden border border-zinc-800 rounded-xl bg-zinc-950" />
          </div>

          {/* Manual Input Fallback */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-400 font-semibold">
              Manual Ticket Token Override
            </h3>
            <div className="flex gap-2">
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste ticket token..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => verify(token)}
                disabled={busy || !token.trim()}
                className="rounded-xl border border-zinc-700 bg-emerald-500 text-black font-semibold font-mono text-xs uppercase px-5 py-2.5 hover:bg-emerald-400 disabled:opacity-50"
              >
                {busy ? "Checking…" : "Verify"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result & Live Attendance Ledger */}
        <div className="space-y-6">
          {/* Result Alert Banner */}
          {result?.ok && (
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-6 space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                ✓ CHECK-IN CONFIRMED
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                {result.attendee?.fullName || "Attendee"}
              </h3>
              <p className="font-mono text-xs text-slate-600 dark:text-zinc-300">
                {result.attendee?.university || "University Student"} &bull; {result.attendee?.email}
              </p>
              <p className="font-mono text-[11px] text-blue-700 dark:text-blue-400 pt-2 border-t border-blue-500/20 font-semibold">
                Event: {result.event?.title}
              </p>
            </div>
          )}

          {err && (
            <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-6 space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-red-400 tracking-wider">
                ✕ SCAN REJECTED
              </span>
              <p className="text-lg font-bold text-white">{err}</p>
              {result?.alreadyCheckedIn && (
                <p className="font-mono text-xs text-slate-600 dark:text-zinc-400">
                  Attendee: {result.attendee?.fullName} ({result.attendee?.email})
                </p>
              )}
            </div>
          )}

          {/* History Ledger */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <span className="font-mono text-xs uppercase font-semibold tracking-[0.16em] text-zinc-400">
                Live Attendance Ledger
              </span>
              <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                {history.length} Checked In
              </span>
            </div>

            {history.length === 0 ? (
              <p className="font-mono text-xs text-slate-500 dark:text-zinc-500 py-6 text-center">
                Ready to scan passes.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-zinc-800 font-mono text-xs">
                {history.map((h, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-zinc-200">{h.attendee?.fullName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-500">{h.attendee?.university}</p>
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">✓ In Gate</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
