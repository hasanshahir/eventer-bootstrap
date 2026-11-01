import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicEvents } from "@/lib/events/queries";
import { isEventOpenAt, isVirtualOrGlobalEvent } from "@/lib/events/selectors";
import { fmtDate } from "@/lib/ev";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import RsvpButton from "@/components/RsvpButton";

export const revalidate = 300;

async function findEventBySlugOrId(slugOrId: string) {
  const decoded = decodeURIComponent(slugOrId).trim().toLowerCase();
  const allEvents = await getPublicEvents();
  const event = allEvents.find(
    (e) =>
      e.id.toLowerCase() === decoded ||
      (e.slug && e.slug.toLowerCase() === decoded)
  );
  return { event: event ?? null, allEvents };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { event } = await findEventBySlugOrId(slug);
  if (!event) {
    return { title: "Event Not Found" };
  }

  const canonicalSlug = event.slug || event.id;
  return {
    title: `${event.title} (${event.city})`,
    description: event.description,
    alternates: {
      canonical: `/events/${encodeURIComponent(canonicalSlug)}`,
    },
    openGraph: {
      title: `${event.title} — ${event.city} | Eventr Pakistan`,
      description: event.description,
      type: "website",
      url: `/events/${encodeURIComponent(canonicalSlug)}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.title} (${event.city})`,
      description: event.description,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { event, allEvents } = await findEventBySlugOrId(slug);
  if (!event) {
    notFound();
  }

  const isOpen = isEventOpenAt(event);
  const isVirtual = isVirtualOrGlobalEvent(event);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://eventer-bootstrap.vercel.app";
  const canonicalUrl = `${siteUrl}/events/${encodeURIComponent(
    event.slug || event.id
  )}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: isVirtual
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: isVirtual
      ? {
          "@type": "VirtualLocation",
          url: event.url || canonicalUrl,
        }
      : {
          "@type": "Place",
          name: event.venue || `${event.city} Tech Hub`,
          address: {
            "@type": "PostalAddress",
            addressLocality: event.city,
            addressCountry: "PK",
          },
        },
    organizer: {
      "@type": "Organization",
      name: event.organizer,
      url: event.url || canonicalUrl,
    },
    url: canonicalUrl,
  };

  const relatedEvents = allEvents
    .filter(
      (e) =>
        e.id !== event.id &&
        e.city.toLowerCase() === event.city.toLowerCase()
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pt-[4.5rem] transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className="border-b-2 border-foreground/40 bg-card px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1100px] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-foreground/30 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
            <Link href="/" className="text-primary hover:underline">
              &larr; Live Pakistan Event Radar
            </Link>
            <span className="text-muted-foreground">
              {event.type} &bull; {isVirtual ? "Global Virtual" : `🇵🇰 ${event.city}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase">
            <span
              className={
                isOpen
                  ? "px-2.5 py-1 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                  : "px-2.5 py-1 border border-zinc-700 bg-zinc-800 text-zinc-400 font-bold"
              }
            >
              {isOpen ? "● Open Registration" : "Registration Closed / Archived"}
            </span>
            {event.organizerVerified && (
              <span className="px-2.5 py-1 border border-primary bg-primary/10 text-primary font-bold">
                ✓ Verified Organizer
              </span>
            )}
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-[0.95]">
            {event.title}
          </h1>

          <p className="font-mono text-xs sm:text-sm text-muted-foreground">
            Organized by <strong className="text-foreground">{event.organizer}</strong>{" "}
            &bull; {event.venue || event.city}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 py-12 sm:px-8 lg:px-12 flex-1 space-y-12">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_.65fr] items-start">
          <section className="border-2 border-foreground bg-card p-6 sm:p-8 space-y-6 shadow-[4px_4px_0px_0px_currentColor]">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-primary font-bold border-b border-foreground/20 pb-3">
              Event Dispatch Brief
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-foreground">
              {event.description}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {event.tags.map((t) => (
                <span
                  key={t}
                  className="font-mono text-xs px-3 py-1 border border-foreground/30 bg-background text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          <aside className="border-2 border-foreground bg-card p-6 space-y-5 shadow-[4px_4px_0px_0px_currentColor]">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-primary font-bold border-b border-foreground/20 pb-3">
              Schedule &amp; Registration
            </h2>

            <dl className="space-y-3 font-mono text-xs">
              <div>
                <dt className="text-muted-foreground uppercase text-[10px]">
                  Starts
                </dt>
                <dd className="text-foreground font-semibold mt-0.5">
                  {fmtDate(event.startsAt, Boolean(event.dateOnly))}
                </dd>
              </div>
              {event.endsAt && (
                <div>
                  <dt className="text-muted-foreground uppercase text-[10px]">
                    Ends
                  </dt>
                  <dd className="text-foreground font-semibold mt-0.5">
                    {fmtDate(event.endsAt, Boolean(event.dateOnly))}
                  </dd>
                </div>
              )}
              {event.registrationDeadline && (
                <div>
                  <dt className="text-muted-foreground uppercase text-[10px]">
                    Registration Deadline
                  </dt>
                  <dd className="text-primary font-bold mt-0.5">
                    {fmtDate(event.registrationDeadline, true)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground uppercase text-[10px]">
                  Venue / Hub
                </dt>
                <dd className="text-foreground font-semibold mt-0.5">
                  {[event.venue, event.city].filter(Boolean).join(", ")}
                </dd>
              </div>
            </dl>

            <div className="space-y-3 pt-3 border-t border-foreground/20">
              {isOpen && (
                <div>
                  <RsvpButton eventId={event.id} />
                </div>
              )}

              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 border border-foreground bg-background px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <span>Official Host Website &rarr;</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`/api/v1/calendar/event/${encodeURIComponent(event.id)}.ics`}
                  download
                  className="flex items-center justify-center border border-foreground/30 bg-background px-3 py-2 font-mono text-[11px] uppercase hover:border-primary"
                >
                  Download .ICS
                </a>
                <a
                  href={buildGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center border border-foreground/30 bg-background px-3 py-2 font-mono text-[11px] uppercase hover:border-primary"
                >
                  + Google Cal
                </a>
              </div>
            </div>
          </aside>
        </div>

        {relatedEvents.length > 0 && (
          <section className="space-y-4 pt-6 border-t-2 border-foreground/30">
            <h2 className="font-heading text-3xl font-bold text-foreground">
              More dispatches in {event.city}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedEvents.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/events/${encodeURIComponent(rel.slug || rel.id)}`}
                  className="border border-foreground/30 bg-card p-5 hover:border-primary transition-colors shadow-[2px_2px_0px_0px_currentColor]"
                >
                  <p className="font-mono text-[10px] uppercase text-primary font-bold">
                    {rel.type} &bull; {rel.city}
                  </p>
                  <h3 className="mt-1 font-heading text-xl font-bold text-foreground">
                    {rel.title}
                  </h3>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    {fmtDate(rel.startsAt, Boolean(rel.dateOnly))}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
