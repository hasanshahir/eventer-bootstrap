"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ALL_CITY_DESKS } from "@/lib/constants/geo";

const inp =
  "w-full bg-background border border-foreground/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none font-mono transition-colors";

const EVENT_TYPES = [
  "HACKATHON",
  "CONFERENCE",
  "WORKSHOP",
  "MEETUP",
  "COMPETITION",
  "TECH_TALK",
] as const;

const EVENT_MODES = ["IN_PERSON", "ONLINE", "HYBRID"] as const;

interface ExtractedEventForm {
  title?: string;
  city?: string;
  venue?: string;
  startsAt?: string;
  endsAt?: string;
  registrationDeadline?: string;
  type?: string;
  mode?: string;
  registrationUrl?: string;
  capacity?: string;
  description?: string;
  tags?: string[];
  tagsStr: string;
}

function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function NewEventPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<
    "checking" | "authenticated" | "unauthenticated"
  >("checking");
  const [tab, setTab] = useState<"text" | "flyer" | "manual">("text");
  const [text, setText] = useState("");
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [submittedPending, setSubmittedPending] = useState(false);
  const [source, setSource] = useState("");
  const [turnstileToken] = useState<string>("");
  const [ev, setEv] = useState<ExtractedEventForm | null>(null);

  useEffect(() => {
    fetch("/api/v1/account")
      .then((res) => {
        if (res.status === 401) {
          setAuthStatus("unauthenticated");
        } else {
          setAuthStatus("authenticated");
        }
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  function onFile(f?: File) {
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      setErr("Image must be under 4MB");
      return;
    }
    setErr("");
    setFlyerFile(f);
  }

  function openManualForm() {
    setSource("manual");
    setEv({
      title: "",
      city: "Karachi",
      venue: "",
      startsAt: toDatetimeLocalValue(
        new Date(Date.now() + 7 * 86400 * 1000).toISOString()
      ),
      endsAt: "",
      registrationDeadline: "",
      type: "HACKATHON",
      mode: "IN_PERSON",
      registrationUrl: "",
      capacity: "",
      description: "",
      tagsStr: "Next.js, AI/ML",
    });
  }

  async function parse() {
    setBusy(true);
    setErr("");
    try {
      let res: Response;
      if (tab === "flyer" && flyerFile) {
        const fd = new FormData();
        fd.append("flyer", flyerFile);
        if (text.trim()) fd.append("text", text.trim());
        res = await fetch("/api/v1/events/ai-parse", {
          method: "POST",
          body: fd,
        });
      } else {
        res = await fetch("/api/v1/events/ai-parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: tab === "text" ? text : "",
          }),
        });
      }

      if (res.status === 401) {
        setAuthStatus("unauthenticated");
        setErr("Please sign in to parse or submit an event.");
        setBusy(false);
        return;
      }

      const d = (await res.json()) as {
        source?: string;
        model?: string;
        error?: string;
        event?: {
          title?: string;
          city?: string | null;
          venue?: string | null;
          startsAt?: string | null;
          endsAt?: string | null;
          registrationDeadline?: string | null;
          type?: string;
          mode?: string;
          registrationUrl?: string | null;
          description?: string;
          tags?: string[];
        };
      };

      if (!res.ok || !d.event) {
        setErr(
          d.error ||
            "AI parser unavailable. Switched to manual entry so you can submit directly."
        );
        openManualForm();
      } else {
        setSource(d.model || d.source || "gemini-2.5-flash");
        setEv({
          title: d.event.title ?? "",
          city: d.event.city ?? "Karachi",
          venue: d.event.venue ?? "",
          startsAt: toDatetimeLocalValue(d.event.startsAt),
          endsAt: toDatetimeLocalValue(d.event.endsAt),
          registrationDeadline: toDatetimeLocalValue(
            d.event.registrationDeadline
          ),
          type: d.event.type ?? "HACKATHON",
          mode: d.event.mode ?? "IN_PERSON",
          registrationUrl: d.event.registrationUrl ?? "",
          capacity: "",
          description: d.event.description ?? "",
          tagsStr: (d.event.tags ?? []).join(", "),
        });
      }
    } catch {
      setErr("Parse failed. Switched to manual entry.");
      openManualForm();
    }
    setBusy(false);
  }

  async function publish() {
    if (!ev) return;
    setBusy(true);
    setErr("");
    try {
      const parsedCap = ev.capacity ? Number(ev.capacity) : null;
      const res = await fetch("/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ev.title,
          city: ev.city || "Karachi",
          venue: ev.venue || null,
          startTime: ev.startsAt
            ? new Date(ev.startsAt).toISOString()
            : new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
          endTime: ev.endsAt ? new Date(ev.endsAt).toISOString() : null,
          registrationDeadline: ev.registrationDeadline
            ? new Date(ev.registrationDeadline).toISOString()
            : null,
          type: ev.type || "MEETUP",
          mode: ev.mode || "IN_PERSON",
          registrationUrl: ev.registrationUrl || null,
          capacity:
            parsedCap && Number.isFinite(parsedCap) && parsedCap > 0
              ? parsedCap
              : null,
          description: ev.description || "",
          turnstileToken: turnstileToken || undefined,
          tags: ev.tagsStr
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
        }),
      });
      if (res.status === 401) {
        setAuthStatus("unauthenticated");
        setErr("Please sign in to submit an event.");
        setBusy(false);
        return;
      }
      const d = (await res.json()) as {
        ok?: boolean;
        error?: string;
        event?: { status?: string };
      };
      if (res.ok && d.ok) {
        if (d.event?.status === "PENDING") {
          setSubmittedPending(true);
          setBusy(false);
        } else {
          router.push("/");
        }
      } else {
        setErr(d.error ?? "Submission failed. Please check required fields.");
        setBusy(false);
      }
    } catch {
      setErr("Network error while submitting event.");
      setBusy(false);
    }
  }

  const set =
    (k: keyof ExtractedEventForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setEv((prev) => (prev ? { ...prev, [k]: e.target.value } : null));

  const cityOptions = Array.from(
    new Set(
      ALL_CITY_DESKS.map((d) => (d.isVirtual ? "Online" : d.city))
    )
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pt-[4.5rem] transition-colors">
      {/* Editorial Header */}
      <header className="border-b-2 border-foreground/30 bg-card px-4 py-12 sm:px-8 lg:px-12 transition-colors">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-foreground/30 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
            <span className="flex items-center gap-2 text-primary">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Organizer Dispatch Desk &bull; Verified Organizer Membership
            </span>
            <span className="text-muted-foreground font-mono">
              Moderation: PENDING &rarr; APPROVED
            </span>
          </div>

          <h1 className="mt-8 font-heading text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
            Submit an Event.
          </h1>
          <p className="mt-4 max-w-[60ch] border-l-4 border-primary pl-4 text-sm sm:text-base font-medium leading-relaxed text-muted-foreground">
            Paste a society announcement, upload an event flyer, or fill the structured dispatch form. Organizer attribution is derived strictly from your authenticated account membership.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-8 lg:px-12 flex-1 space-y-8">
        {authStatus === "unauthenticated" && (
          <div className="border-2 border-foreground bg-card p-8 space-y-4 shadow-[4px_4px_0px_0px_currentColor]">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Sign in required to submit or parse events
            </h2>
            <p className="font-mono text-xs text-muted-foreground max-w-[55ch]">
              Event submissions are bound to your authenticated OrganizerMember profile and reviewed before appearing on the public radar.
            </p>
            <Link
              href="/login?callbackUrl=/organizer/new"
              className="inline-flex items-center gap-2 border border-foreground bg-primary px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_0px_currentColor]"
            >
              Sign In to Continue &rarr;
            </Link>
          </div>
        )}

        {submittedPending && (
          <div className="border-2 border-primary bg-primary/10 p-6 space-y-3">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              ✓ Dispatch Submitted for Verification (Status: PENDING)
            </p>
            <p className="font-mono text-xs text-foreground">
              Your event has been recorded under your organizer profile and queued for admin moderation (`APPROVED`).
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-foreground bg-primary px-4 py-2 font-mono text-xs font-semibold uppercase text-white"
            >
              Return to Radar &rarr;
            </Link>
          </div>
        )}

        {/* Ingestion Mode Toggle */}
        <div className="flex flex-wrap gap-2">
          {(["text", "flyer", "manual"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                if (t === "manual" && !ev) openManualForm();
              }}
              className={`font-mono text-xs font-semibold uppercase tracking-[0.14em] px-4 py-2.5 border transition-colors ${
                tab === t
                  ? "bg-primary text-white border-foreground shadow-[2px_2px_0px_0px_currentColor]"
                  : "border-foreground/30 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "text"
                ? "Paste WhatsApp / Text"
                : t === "flyer"
                ? "Upload Event Flyer"
                : "Manual Entry"}
            </button>
          ))}
        </div>

        {/* Input Zone */}
        {tab !== "manual" && (
          <div className="border border-foreground/30 bg-card p-6 sm:p-8 space-y-5 shadow-[2px_2px_0px_0px_currentColor]">
            {tab === "text" ? (
              <textarea
                className={inp + " h-48 leading-relaxed"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`*FAST AI Summit 2026*\nJoin us 21 Nov 2026, 10am at FAST-NUCES Islamabad campus.\nTracks: Generative AI, Robotics, Next.js, and Agentic Workflows.\nRegistration: https://fast.edu.pk/summit`}
              />
            ) : (
              <div className="border-2 border-dashed border-foreground/30 p-8 text-center bg-background space-y-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => onFile(e.target.files?.[0])}
                  className="font-mono text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:border file:border-foreground/40 file:bg-card file:text-foreground file:font-mono file:text-xs"
                />
                {flyerFile && (
                  <p className="font-mono text-xs text-primary font-semibold">
                    Selected: {flyerFile.name} (
                    {Math.round(flyerFile.size / 1024)} KB)
                  </p>
                )}
                <p className="font-mono text-[10px] text-muted-foreground">
                  Supports PNG, JPG, or WEBP up to 4MB (uploaded via multipart/form-data).
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={parse}
                disabled={busy || (tab === "text" ? !text.trim() : !flyerFile)}
                className="inline-flex items-center gap-2 border border-foreground bg-primary text-white font-semibold font-mono text-xs uppercase tracking-[0.12em] px-6 py-3 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-[2px_2px_0px_0px_currentColor]"
              >
                {busy ? "Extracting via Gemini…" : "Extract with Gemini AI"}
              </button>
              <button
                type="button"
                onClick={openManualForm}
                className="inline-flex items-center gap-2 border border-foreground/40 bg-background text-foreground font-semibold font-mono text-xs uppercase tracking-[0.12em] px-5 py-3 hover:border-primary transition-all"
              >
                Fill Form Manually
              </button>
            </div>
          </div>
        )}

        {/* Structured Event Review Form + Live Preview */}
        {ev && (
          <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr] items-start">
            <div className="border-2 border-foreground bg-card p-6 sm:p-8 space-y-5 shadow-[4px_4px_0px_0px_currentColor]">
              <div className="flex items-center justify-between border-b border-foreground/20 pb-3">
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Structured Event Dispatch
                </h2>
                <span className="font-mono text-[10px] uppercase px-2.5 py-0.5 border border-primary bg-primary/10 text-primary">
                  Source: {source || "manual"}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                    Event Title *
                  </span>
                  <input
                    className={inp}
                    value={ev.title ?? ""}
                    onChange={set("title")}
                    placeholder="e.g. NUST National AI Hackathon 2026"
                  />
                </label>

                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                    City / Regional Desk *
                  </span>
                  <select
                    className={inp}
                    value={ev.city ?? "Karachi"}
                    onChange={set("city")}
                  >
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                    Venue / Campus
                  </span>
                  <input
                    className={inp}
                    value={ev.venue ?? ""}
                    onChange={set("venue")}
                    placeholder="e.g. NUST H-12 Auditorium"
                  />
                </label>

                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                    Format *
                  </span>
                  <select
                    className={inp}
                    value={ev.type ?? "HACKATHON"}
                    onChange={set("type")}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                    Attendance Mode *
                  </span>
                  <select
                    className={inp}
                    value={ev.mode ?? "IN_PERSON"}
                    onChange={set("mode")}
                  >
                    {EVENT_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                    Start Date &amp; Time *
                  </span>
                  <input
                    type="datetime-local"
                    className={inp}
                    value={ev.startsAt ?? ""}
                    onChange={set("startsAt")}
                  />
                </label>

                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                    End Date &amp; Time (Optional)
                  </span>
                  <input
                    type="datetime-local"
                    className={inp}
                    value={ev.endsAt ?? ""}
                    onChange={set("endsAt")}
                  />
                </label>

                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                    Registration Deadline (Optional)
                  </span>
                  <input
                    type="datetime-local"
                    className={inp}
                    value={ev.registrationDeadline ?? ""}
                    onChange={set("registrationDeadline")}
                  />
                </label>

                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                    Seat Capacity (Optional)
                  </span>
                  <input
                    type="number"
                    min="1"
                    className={inp}
                    value={ev.capacity ?? ""}
                    onChange={set("capacity")}
                    placeholder="Unlimited if blank"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                    Official Host / Registration URL (Optional)
                  </span>
                  <input
                    type="url"
                    className={inp}
                    value={ev.registrationUrl ?? ""}
                    onChange={set("registrationUrl")}
                    placeholder="https://..."
                  />
                </label>
              </div>

              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                  Description (Minimum 20 characters) *
                </span>
                <textarea
                  className={inp + " h-24"}
                  value={ev.description ?? ""}
                  onChange={set("description")}
                />
              </label>

              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1.5 font-semibold">
                  Tags (Comma-Separated)
                </span>
                <input
                  className={inp}
                  value={ev.tagsStr}
                  onChange={set("tagsStr")}
                />
              </label>

              <button
                type="button"
                onClick={publish}
                disabled={busy}
                className="inline-flex items-center gap-2 border border-foreground bg-primary hover:bg-blue-600 text-white font-semibold font-mono text-xs uppercase tracking-[0.12em] px-8 py-3.5 transition-colors shadow-[2px_2px_0px_0px_currentColor] disabled:opacity-50"
              >
                Submit Event for Approval &rarr;
              </button>
            </div>

            {/* Live Event Card Preview */}
            <aside className="border border-foreground/30 bg-card p-6 space-y-4 shadow-[2px_2px_0px_0px_currentColor]">
              <div className="flex items-center justify-between border-b border-foreground/20 pb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary font-bold">
                  Live Radar Card Preview
                </span>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-foreground/40 text-foreground">
                  {ev.type || "HACKATHON"}
                </span>
              </div>

              <h3 className="font-heading text-3xl font-bold text-foreground">
                {ev.title || "Untitled Tech Event"}
              </h3>

              <p className="font-mono text-xs text-muted-foreground">
                {[ev.city || "Karachi", ev.venue || "Campus / Venue"]
                  .filter(Boolean)
                  .join(" • ")}
              </p>

              <p className="text-xs leading-relaxed text-muted-foreground">
                {ev.description ||
                  "Event summary will appear here once entered (minimum 20 characters)."}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {ev.tagsStr
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[10px] px-2 py-0.5 border border-foreground/30 bg-background text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
              </div>
            </aside>
          </div>
        )}

        {err && (
          <div className="border border-amber-500/50 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300 font-mono text-xs">
            {err}
          </div>
        )}
      </main>
    </div>
  );
}
