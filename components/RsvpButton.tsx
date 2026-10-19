"use client";
import { useState } from "react";
import Link from "next/link";
import { demoUser } from "@/lib/demoUser";

export default function RsvpButton({ eventId }: { eventId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function rsvp() {
    setState("loading");
    try {
      let user = demoUser;
      try {
        const raw = localStorage.getItem("eventer_user");
        if (raw) user = JSON.parse(raw);
        else localStorage.setItem("eventer_user", JSON.stringify(demoUser));
      } catch {}

      const res = await fetch("/api/v1/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, user }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-semibold text-emerald-400">
          ✓ Registered
        </span>
        <Link
          href="/passport"
          className="text-xs font-mono text-cyan-400 underline hover:text-cyan-300"
        >
          View pass
        </Link>
      </div>
    );
  }

  return (
    <button
      onClick={rsvp}
      disabled={state === "loading"}
      className="inline-flex items-center justify-center gap-1.5 bg-emerald-500 text-black font-semibold text-xs uppercase tracking-[0.1em] rounded px-4 py-2 hover:bg-emerald-400 hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.8)] transition disabled:opacity-50"
    >
      {state === "loading" ? "Registering…" : state === "error" ? "Retry RSVP" : "1-Tap RSVP"}
    </button>
  );
}
