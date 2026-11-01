"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtDate } from "@/lib/ev";

type EventStatus = "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";

interface AdminEventRow {
  id: string;
  slug: string;
  title: string;
  city: string;
  venue: string | null;
  type: string;
  status: EventStatus;
  source: string;
  startTime: string | null;
  endTime: string | null;
  registrationUrl: string | null;
  linkOk: boolean | null;
  missedRuns: number;
  organizer?: {
    id: string;
    name: string;
    verified: boolean;
  } | null;
}

interface IngestionRunRow {
  id: string;
  source: string;
  ok: boolean;
  fetched: number;
  upserted: number;
  archived: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export default function AdminEventsPage() {
  const [authState, setAuthState] = useState<
    "loading" | "unauthenticated" | "forbidden" | "ready"
  >("loading");
  const [events, setEvents] = useState<AdminEventRow[]>([]);
  const [runs, setRuns] = useState<IngestionRunRow[]>([]);
  const [filter, setFilter] = useState<EventStatus | "ALL">("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadQueue() {
    try {
      const res = await fetch("/api/v1/admin/events", { cache: "no-store" });
      if (res.status === 401) {
        setAuthState("unauthenticated");
        return;
      }
      if (res.status === 403) {
        setAuthState("forbidden");
        return;
      }
      if (!res.ok) {
        setFeedback("Could not load moderation queue.");
        setAuthState("ready");
        return;
      }
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
      setRuns(Array.isArray(data.ingestionRuns) ? data.ingestionRuns : []);
      setAuthState("ready");
    } catch {
      setFeedback("Network error while loading moderation queue.");
      setAuthState("ready");
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function handleModerate(eventId: string, nextStatus: EventStatus) {
    setBusyId(eventId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || "Failed to update event status.");
        return;
      }
      setEvents((prev) =>
        prev.map((row) =>
          row.id === eventId ? { ...row, status: nextStatus } : row
        )
      );
      setFeedback(`Updated event status to ${nextStatus}.`);
    } catch {
      setFeedback("Network error while updating event status.");
    } finally {
      setBusyId(null);
    }
  }

  const counts = {
    PENDING: events.filter((e) => e.status === "PENDING").length,
    APPROVED: events.filter((e) => e.status === "APPROVED").length,
    REJECTED: events.filter((e) => e.status === "REJECTED").length,
    ARCHIVED: events.filter((e) => e.status === "ARCHIVED").length,
    ALL: events.length,
  };

  const filteredEvents =
    filter === "ALL" ? events : events.filter((e) => e.status === filter);

  return (
    <main className="editorial-shell min-h-dvh bg-background text-foreground pt-24 pb-20 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px] space-y-10">
        <header className="border-b-2 border-foreground/40 pb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
              Editorial Desk / Moderation &amp; Ingestion
            </p>
            <h1 className="mt-2 font-heading text-4xl sm:text-6xl font-bold tracking-tight">
              Admin Event Moderation
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center border border-foreground/40 bg-card px-4 font-mono text-xs uppercase tracking-[0.12em] hover:border-primary"
          >
            &larr; Return to Radar
          </Link>
        </header>

        {authState === "loading" && (
          <div className="border border-foreground/30 bg-card p-10 font-mono text-xs uppercase tracking-widest">
            Verifying administrator credentials...
          </div>
        )}

        {authState === "unauthenticated" && (
          <section className="border-2 border-foreground bg-card p-8 space-y-4 shadow-[4px_4px_0px_0px_currentColor]">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
              Authentication Required
            </p>
            <h2 className="font-heading text-3xl font-semibold">
              Sign in with an administrator account
            </h2>
            <p className="text-sm text-muted-foreground max-w-[52ch]">
              Event moderation and ingestion telemetry are restricted to verified
              Eventr administrators (`Role.ADMIN`).
            </p>
            <Link
              href="/login?callbackUrl=/admin/events"
              className="inline-flex h-11 items-center border border-foreground bg-primary px-6 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-white"
            >
              Sign in to Admin Desk
            </Link>
          </section>
        )}

        {authState === "forbidden" && (
          <section className="border-2 border-red-500/60 bg-card p-8 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-500 font-bold">
              403 Forbidden
            </p>
            <h2 className="font-heading text-3xl font-semibold">
              Administrator role required
            </h2>
            <p className="text-sm text-muted-foreground max-w-[56ch]">
              Your account is signed in, but does not have `ADMIN` privileges to
              approve or reject community event dispatches.
            </p>
          </section>
        )}

        {authState === "ready" && (
          <>
            {feedback && (
              <div
                role="status"
                className="border border-primary bg-primary/10 px-4 py-3 font-mono text-xs text-foreground"
              >
                {feedback}
              </div>
            )}

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-foreground/20 pb-4">
              {(
                ["PENDING", "APPROVED", "REJECTED", "ARCHIVED", "ALL"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`h-10 px-4 border font-mono text-xs uppercase tracking-[0.12em] cursor-pointer transition-colors ${
                    filter === tab
                      ? "border-primary bg-primary text-white font-bold"
                      : "border-foreground/30 bg-card text-foreground hover:border-primary"
                  }`}
                >
                  {tab} ({counts[tab]})
                </button>
              ))}
            </div>

            {/* Moderation Table */}
            <section className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="border border-foreground/30 bg-card p-12 text-center font-mono text-xs text-muted-foreground">
                  No events in the {filter} queue.
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEvents.map((ev) => (
                    <article
                      key={ev.id}
                      className="border border-foreground/30 bg-card p-5 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between shadow-[2px_2px_0px_0px_currentColor]"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                          <span className="px-2 py-0.5 border border-foreground/40 bg-background font-bold">
                            {ev.status}
                          </span>
                          <span className="px-2 py-0.5 border border-primary/40 text-primary">
                            {ev.type}
                          </span>
                          <span className="text-muted-foreground">
                            {ev.city} &bull; Source: {ev.source}
                          </span>
                          {ev.linkOk === false && (
                            <span className="px-2 py-0.5 border border-red-500/50 bg-red-500/10 text-red-400">
                              Dead Link
                            </span>
                          )}
                        </div>
                        <h2 className="font-heading text-2xl font-bold">
                          {ev.title}
                        </h2>
                        <p className="font-mono text-xs text-muted-foreground">
                          Organizer: {ev.organizer?.name || "Community"} &bull; Starts:{" "}
                          {fmtDate(ev.startTime)}
                        </p>
                        {ev.registrationUrl && (
                          <a
                            href={ev.registrationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block font-mono text-xs text-primary underline break-all"
                          >
                            {ev.registrationUrl}
                          </a>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={
                            busyId === ev.id || ev.status === "APPROVED"
                          }
                          onClick={() => handleModerate(ev.id, "APPROVED")}
                          className="h-9 px-3.5 border border-emerald-500/60 bg-emerald-500/15 text-emerald-400 font-mono text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={
                            busyId === ev.id || ev.status === "REJECTED"
                          }
                          onClick={() => handleModerate(ev.id, "REJECTED")}
                          className="h-9 px-3.5 border border-red-500/60 bg-red-500/15 text-red-400 font-mono text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={
                            busyId === ev.id || ev.status === "ARCHIVED"
                          }
                          onClick={() => handleModerate(ev.id, "ARCHIVED")}
                          className="h-9 px-3.5 border border-foreground/40 bg-background text-muted-foreground font-mono text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                        >
                          Archive
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Ingestion Runs Telemetry */}
            <section className="border-t-2 border-foreground/30 pt-8 space-y-4">
              <h2 className="font-heading text-3xl font-semibold">
                Recent Ingestion Pipeline Runs
              </h2>
              {runs.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground">
                  No scheduled ingestion runs recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto border border-foreground/30 bg-card">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="border-b border-foreground/30 bg-background/60 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Started</th>
                        <th className="p-3">Source</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Fetched</th>
                        <th className="p-3">Upserted</th>
                        <th className="p-3">Archived</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/15">
                      {runs.map((run) => (
                        <tr key={run.id}>
                          <td className="p-3">{fmtDate(run.startedAt)}</td>
                          <td className="p-3 uppercase">{run.source}</td>
                          <td className="p-3 font-bold text-primary">
                            {run.ok ? "OK" : "FAILED"}
                          </td>
                          <td className="p-3">{run.fetched}</td>
                          <td className="p-3">{run.upserted}</td>
                          <td className="p-3">{run.archived}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

