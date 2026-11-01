"use client";

import { useState } from "react";
import Link from "next/link";

export default function RsvpButton({
  eventId,
  isAuthenticated = false,
  turnstileToken,
}: {
  eventId: string;
  isAuthenticated?: boolean;
  turnstileToken?: string;
}) {
  const [state, setState] = useState<
    "idle" | "loading" | "done" | "waitlisted" | "unauth" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function rsvp() {
    setState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/v1/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, turnstileToken }),
      });

      if (res.status === 401) {
        setState("unauth");
        return;
      }

      const data = (await res.json()) as {
        ok?: boolean;
        registration?: { status?: string };
        error?: string;
      };

      if (res.ok && data.ok) {
        if (data.registration?.status === "WAITLISTED") {
          setState("waitlisted");
        } else {
          setState("done");
        }
      } else {
        setErrorMsg(data.error || "Registration failed");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error");
      setState("error");
    }
  }

  if (!isAuthenticated || state === "unauth") {
    return (
      <Link
        href="/login"
        className="inline-flex items-center h-10 border border-foreground bg-primary px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-all shadow-[2px_2px_0px_0px_currentColor]"
      >
        Sign in to RSVP &rarr;
      </Link>
    );
  }

  if (state === "done" || state === "waitlisted") {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
          {state === "waitlisted" ? "✓ Waitlisted" : "✓ Registered"}
        </span>
        <Link
          href="/passport"
          className="font-mono text-xs text-foreground underline decoration-1 underline-offset-2 hover:text-primary"
        >
          Pass &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={rsvp}
        disabled={state === "loading"}
        className="h-10 rounded-none border border-foreground bg-primary px-4 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-blue-600 transition-all disabled:opacity-50 shadow-[2px_2px_0px_0px_currentColor] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
      >
        {state === "loading"
          ? "Registering…"
          : state === "error"
          ? "Retry RSVP"
          : "1-Tap RSVP"}
      </button>
      {errorMsg && (
        <span className="font-mono text-[10px] text-red-500">{errorMsg}</span>
      )}
    </div>
  );
}
