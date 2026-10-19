"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const inp =
  "w-full bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 outline-none font-mono transition-colors";

export default function NewEventPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"text" | "flyer">("text");
  const [text, setText] = useState("");
  const [img, setImg] = useState<{ data: string; mime: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [source, setSource] = useState("");
  const [ev, setEv] = useState<any>(null);

  function onFile(f?: File) {
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      setErr("Image must be under 4MB");
      return;
    }
    const r = new FileReader();
    r.onload = () => setImg({ data: String(r.result).split(",")[1], mime: f.type });
    r.readAsDataURL(f);
  }

  async function parse() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/v1/events/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: tab === "text" ? text : "",
          imageBase64: tab === "flyer" ? img?.data : undefined,
          mimeType: img?.mime,
        }),
      });
      const d = await res.json();
      setSource(d.source);
      setEv({ ...d.event, tagsStr: (d.event.tags ?? []).join(", ") });
    } catch {
      setErr("Parse failed. Please try again.");
    }
    setBusy(false);
  }

  async function publish() {
    setBusy(true);
    setErr("");
    const { tagsStr, ...rest } = ev;
    const res = await fetch("/api/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rest,
        tags: tagsStr
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
      }),
    });
    const d = await res.json();
    if (d.ok) {
      router.push("/");
    } else {
      setErr(d.error ?? "Publish failed");
      setBusy(false);
    }
  }

  const set = (k: string) => (e: any) => setEv({ ...ev, [k]: e.target.value });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Editorial Header */}
      <header className="border-b-2 border-zinc-800 bg-zinc-950 px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-zinc-800 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
            <span className="flex items-center gap-2 text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Organizer Dispatch Desk &bull; Multimodal Ingestion
            </span>
            <span className="text-zinc-500 font-mono">Engine: Google Gemini Flash</span>
          </div>

          <h1 className="mt-8 font-serif text-5xl sm:text-7xl font-bold tracking-tight text-white">
            Submit an Event.
          </h1>
          <p className="mt-4 max-w-[60ch] border-l-4 border-emerald-500 pl-4 text-sm sm:text-base font-medium leading-relaxed text-zinc-300">
            Paste a messy WhatsApp forward or upload an event flyer. Eventer AI automatically extracts the dates, venue, city, and tags into structured radar intelligence.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-8 lg:px-12 flex-1 space-y-8">
        {/* Ingestion Mode Toggle */}
        <div className="flex gap-2">
          {(["text", "flyer"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-mono text-xs font-semibold uppercase tracking-[0.14em] px-4 py-2.5 border transition-colors ${
                tab === t
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/50"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white"
              }`}
            >
              {t === "text" ? "Paste WhatsApp / Text" : "Upload Event Flyer"}
            </button>
          ))}
        </div>

        {/* Input Zone */}
        <div className="border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 space-y-5">
          {tab === "text" ? (
            <textarea
              className={inp + " h-48 leading-relaxed"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`*FAST AI Summit 2026* 🚀\nSalam everyone! Join us 21 Nov 2026, 10am at FAST-NUCES Islamabad campus.\nTracks: Generative AI, Robotics, Next.js, and Agentic Workflows.\nRegistration: https://fast.edu.pk/summit`}
            />
          ) : (
            <div className="border-2 border-dashed border-zinc-800 p-8 text-center bg-zinc-950">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onFile(e.target.files?.[0])}
                className="font-mono text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border file:border-zinc-700 file:bg-zinc-800 file:text-zinc-200 file:font-mono file:text-xs hover:file:bg-zinc-700"
              />
              <p className="mt-3 font-mono text-[10px] text-zinc-500">
                Supports PNG, JPG, or WEBP up to 4MB.
              </p>
            </div>
          )}

          <button
            onClick={parse}
            disabled={busy || (tab === "text" ? !text.trim() : !img)}
            className="inline-flex items-center gap-2 border border-zinc-700 bg-emerald-500 text-black font-semibold font-mono text-xs uppercase tracking-[0.12em] px-6 py-3 hover:bg-emerald-400 hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.7)] transition-all disabled:opacity-50"
          >
            {busy ? "Parsing with AI..." : "✨ Parse with Gemini"}
          </button>
        </div>

        {/* Extracted Structured Event Review Form */}
        {ev && (
          <div className="border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="font-serif text-2xl font-bold text-white">Extracted Metadata</h2>
              <span className="font-mono text-[10px] uppercase px-2.5 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
                Source: {source}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {(["title", "organizer", "city", "venue", "startsAt", "endsAt", "type"] as const).map(
                (k) => (
                  <label key={k} className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 block mb-1.5">
                      {k}
                    </span>
                    <input className={inp} value={ev[k] ?? ""} onChange={set(k)} />
                  </label>
                )
              )}
            </div>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 block mb-1.5">
                Description
              </span>
              <textarea
                className={inp + " h-24"}
                value={ev.description ?? ""}
                onChange={set("description")}
              />
            </label>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 block mb-1.5">
                Tags (Comma-Separated)
              </span>
              <input className={inp} value={ev.tagsStr} onChange={set("tagsStr")} />
            </label>

            <button
              onClick={publish}
              disabled={busy}
              className="inline-flex items-center gap-2 border border-zinc-700 bg-emerald-500 text-black font-semibold font-mono text-xs uppercase tracking-[0.12em] px-8 py-3.5 hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              Publish Event to Radar &rarr;
            </button>
          </div>
        )}

        {err && (
          <div className="border border-amber-500/40 bg-amber-500/10 p-4 text-amber-400 font-mono text-xs">
            {err}
          </div>
        )}
      </main>
    </div>
  );
}
