const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Karachi",
});

function formatRange(start: Date | string, end: Date | string): string {
  return `${dateFmt.format(new Date(start))} → ${dateFmt.format(new Date(end))}`;
}

export type EventCardData = {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string | null;
  type: string;
  startTime: Date | string;
  endTime: Date | string;
  capacity: number | null;
};

export function EventCard({ event }: { event: EventCardData }) {
  const isPast =
    (event.startTime && new Date(event.startTime).getTime() <= Date.now()) ||
    (event.endTime && new Date(event.endTime).getTime() <= Date.now());

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl p-5 transition-all ${
        isPast
          ? "bg-zinc-950/60 border border-zinc-850 opacity-60 grayscale-[60%] hover:opacity-95 hover:grayscale-0"
          : "bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className={`text-base font-semibold leading-snug ${isPast ? "text-zinc-400" : "text-zinc-100"}`}>
          {event.title}
        </h2>
        <div className="flex items-center gap-1.5 shrink-0">
          {isPast ? (
            <span className="px-2 py-0.5 text-xs font-mono rounded-md border border-zinc-700 bg-zinc-800 text-zinc-400">
              Closed
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-mono rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              Open RSVP
            </span>
          )}
          <span className="px-2 py-0.5 text-xs font-mono rounded-md border border-zinc-700/50 bg-zinc-800/40 text-zinc-400">
            {event.type}
          </span>
        </div>
      </div>

      <p className="text-sm text-zinc-400 line-clamp-3">{event.description}</p>

      <dl className="mt-auto grid gap-1.5 text-xs text-zinc-500">
        <div className="flex gap-2">
          <dt className="font-mono text-zinc-600 w-14 shrink-0">City</dt>
          <dd className="text-zinc-300">{event.city}</dd>
        </div>
        {event.venue && (
          <div className="flex gap-2">
            <dt className="font-mono text-zinc-600 w-14 shrink-0">Venue</dt>
            <dd className="text-zinc-300">{event.venue}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="font-mono text-zinc-600 w-14 shrink-0">When</dt>
          <dd className="text-zinc-300">{formatRange(event.startTime, event.endTime)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-mono text-zinc-600 w-14 shrink-0">Seats</dt>
          <dd className="text-zinc-300">{event.capacity ?? "Open"}</dd>
        </div>
      </dl>
    </article>
  );
}
