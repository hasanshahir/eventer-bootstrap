import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_CITY_DESKS, CITY_DESK_MAP } from "@/lib/constants/geo";
import { getPublicEvents } from "@/lib/events/queries";
import { countByCityDesk, isEventOpenAt, isVirtualOrGlobalEvent } from "@/lib/events/selectors";
import { fmtDate } from "@/lib/ev";
import RsvpButton from "@/components/RsvpButton";
import { buildGoogleCalendarUrl } from "@/lib/calendar";

export const revalidate = 300;

export function generateStaticParams() {
  return ALL_CITY_DESKS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const desk = CITY_DESK_MAP[slug.toLowerCase()];
  if (!desk) {
    return { title: "City Desk Not Found" };
  }
  return {
    title: `${desk.city} Tech Events, Hackathons & Meetups`,
    description: `${desk.subtitle} — ${desk.desc} Browse verified developer events in ${desk.city}.`,
  };
}

export default async function CityDeskDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const desk = CITY_DESK_MAP[slug.toLowerCase()];
  if (!desk) {
    notFound();
  }

  const allEvents = await getPublicEvents();
  const openByDesk = countByCityDesk(allEvents, { openOnly: true });
  const totalByDesk = countByCityDesk(allEvents, { openOnly: false });

  const cityEvents = allEvents.filter((e) => {
    if (desk.isVirtual) {
      return isVirtualOrGlobalEvent(e);
    }
    return (
      !isVirtualOrGlobalEvent(e) &&
      e.city.toLowerCase() === desk.city.toLowerCase()
    );
  });

  const openCount = openByDesk[desk.slug] ?? 0;
  const totalCount = totalByDesk[desk.slug] ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pt-[4.5rem] transition-colors">
      <header className="border-b-2 border-foreground/40 bg-card px-4 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-foreground/30 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
            <Link href="/cities" className="text-primary hover:underline">
              &larr; All 20 Regional Desks
            </Link>
            <span className="text-muted-foreground font-mono">
              {desk.regionId} &bull; {desk.latLng}
            </span>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary font-bold">
                {desk.subtitle}
              </p>
              <h1 className="mt-2 font-heading text-5xl sm:text-7xl font-bold tracking-tight text-foreground">
                {desk.city}.
              </h1>
              <p className="mt-4 max-w-[62ch] border-l-4 border-primary pl-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
                {desk.desc}
              </p>
            </div>

            <div className="border-2 border-foreground bg-background p-5 font-mono text-xs space-y-1 shadow-[4px_4px_0px_0px_currentColor]">
              <p className="text-3xl font-heading font-bold text-primary">
                {openCount} Open
              </p>
              <p className="text-muted-foreground">
                {totalCount} total indexed ({totalCount - openCount} archived)
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-8 lg:px-12 flex-1">
        {cityEvents.length === 0 ? (
          <div className="border-2 border-foreground/30 bg-card p-12 text-center space-y-4">
            <h2 className="font-heading text-3xl font-bold">
              No active dispatches in {desk.city} yet.
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              Hosting a campus hackathon or developer meetup in {desk.city}? Submit it to the national radar.
            </p>
            <Link
              href="/organizer/new"
              className="inline-flex items-center gap-2 border border-foreground bg-primary px-6 py-3 font-mono text-xs font-semibold uppercase text-white"
            >
              Submit a {desk.city} Event &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cityEvents.map((e) => {
              const isOpen = isEventOpenAt(e);
              return (
                <article
                  key={e.id}
                  className="border border-foreground/30 bg-card p-6 flex flex-col justify-between shadow-[2px_2px_0px_0px_currentColor]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase">
                      <span
                        className={
                          isOpen
                            ? "px-2 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                            : "px-2 py-0.5 border border-zinc-700 bg-zinc-800 text-zinc-400"
                        }
                      >
                        {isOpen ? "Open RSVP" : "Archived"}
                      </span>
                      <span className="px-2 py-0.5 border border-foreground/30">
                        {e.type}
                      </span>
                    </div>

                    <h2 className="font-heading text-2xl font-bold text-foreground">
                      <Link
                        href={`/events/${encodeURIComponent(e.slug || e.id)}`}
                        className="hover:text-primary hover:underline"
                      >
                        {e.title}
                      </Link>
                    </h2>

                    <p className="font-mono text-xs text-muted-foreground">
                      {[e.organizer, e.venue].filter(Boolean).join(" • ")}
                    </p>

                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {e.description}
                    </p>

                    <p className="font-mono text-xs text-primary font-semibold">
                      {fmtDate(e.startsAt, Boolean(e.dateOnly))}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-foreground/20 flex flex-wrap items-center justify-between gap-2">
                    {isOpen ? (
                      <RsvpButton eventId={e.id} />
                    ) : (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs underline text-muted-foreground"
                      >
                        Host Archive &rarr;
                      </a>
                    )}
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase">
                      <a
                        href={`/api/v1/calendar/event/${encodeURIComponent(e.id)}.ics`}
                        download
                        className="border border-foreground/30 px-2 py-1 hover:border-primary"
                      >
                        .ICS
                      </a>
                      <a
                        href={buildGoogleCalendarUrl(e)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-foreground/30 px-2 py-1 hover:border-primary"
                      >
                        + GCal
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

