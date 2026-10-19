import type { Event } from '@prisma/client';

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Karachi',
});

function formatRange(start: Date, end: Date): string {
  return `${dateFmt.format(new Date(start))} → ${dateFmt.format(new Date(end))}`;
}

export function EventCard({ event }: { event: Event }) {
  return (
    <article className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-emerald-500/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-100 leading-snug">{event.title}</h2>
        <span className="shrink-0 px-2 py-0.5 text-xs font-mono rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          {event.type}
        </span>
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
          <dd className="text-zinc-300">{event.capacity ?? 'Open'}</dd>
        </div>
      </dl>
    </article>
  );
}
