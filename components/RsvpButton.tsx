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
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-blue-500 uppercase tracking-wider">
          ✓ Registered
        </span>
        <Link href="/passport" className="font-mono text-xs text-foreground underline decoration-1 underline-offset-2 hover:text-blue-500">
          Pass &rarr;
        </Link>
      </div>
    );
  }

  return (
    <button
      onClick={rsvp}
      disabled={state === "loading"}
      className="h-10 rounded-none border border-foreground bg-primary px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-all disabled:opacity-50 shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5"
    >
      {state === "loading" ? "Registering…" : state === "error" ? "Retry RSVP" : "1-Tap RSVP"}
    </button>
  );
}
