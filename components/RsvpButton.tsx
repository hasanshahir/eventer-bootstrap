"use client";
import { useState } from "react";
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

  if (state === "done")
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-emerald-400">✓ Registered</span>
        <a href={`/passport`} className="text-xs font-mono text-cyan-400 underline">View pass</a>
      </div>
    );
  return (
    <button
      onClick={rsvp}
      disabled={state === "loading"}
      className="bg-emerald-500 text-black font-semibold text-sm rounded-lg px-4 py-2 hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.8)] transition disabled:opacity-60"
    >
      {state === "loading" ? "Registering…" : state === "error" ? "Retry RSVP" : "1-Tap RSVP"}
    </button>
  );
}