import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toCard, type EventCard, type RawEventLike } from "@/lib/ev";
import { loadCuratedEvents } from "@/lib/ingest/curated";
import { sortEventsDeadlineFirst } from "./selectors";

async function queryDbEventsResilient(): Promise<RawEventLike[]> {
  try {
    return await prisma.event.findMany({
      where: {
        status: {
          in: ["APPROVED", "ARCHIVED"],
        },
      },
      include: {
        organizer: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });
  } catch (err: unknown) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: unknown }).code)
        : "";
    if (code === "P2022") {
      // Pre-migration database fallback: select only columns guaranteed in the initial schema
      try {
        return await prisma.event.findMany({
          select: {
            id: true,
            title: true,
            description: true,
            city: true,
            type: true,
            startTime: true,
            endTime: true,
            capacity: true,
            tags: true,
            organizer: {
              select: {
                name: true,
                verified: true,
              },
            },
          },
          orderBy: {
            startTime: "asc",
          },
        });
      } catch {
        return [];
      }
    }
    return [];
  }
}

async function fetchPublicEventsUncached(): Promise<EventCard[]> {
  const seenIds = new Set<string>();
  const cards: EventCard[] = [];

  const dbEvents = await queryDbEventsResilient();

  for (const row of dbEvents) {
    const card = toCard(row);
    cards.push(card);
    if (row.id) seenIds.add(String(row.id));
    if ("externalId" in row && row.externalId) {
      seenIds.add(String(row.externalId));
    }
    if (row.slug) seenIds.add(String(row.slug));
  }

  // Merge baseline curated events that have not yet been seeded into the database
  // so DB-submitted/approved events are NEVER shadowed (F-01) while keeping baseline resilient.
  for (const curated of loadCuratedEvents()) {
    if (seenIds.has(curated.externalId) || seenIds.has(curated.slug)) {
      continue;
    }
    seenIds.add(curated.externalId);
    seenIds.add(curated.slug);
    cards.push(
      toCard({
        id: curated.externalId,
        slug: curated.slug,
        title: curated.title,
        description: curated.description,
        city: curated.city,
        venue: curated.venue,
        type: curated.type,
        mode: curated.mode,
        startTime: curated.startTime,
        endTime: curated.endTime,
        registrationDeadline: curated.registrationDeadline,
        dateOnly: curated.dateOnly,
        registrationUrl: curated.registrationUrl,
        sourceUrl: curated.sourceUrl,
        tags: curated.tags,
        source: curated.source.toLowerCase(),
        scope: curated.scope,
        status: "APPROVED",
        organizer: {
          name: curated.organizer,
          verified: true,
        },
      })
    );
  }

  return sortEventsDeadlineFirst(cards);
}

export const getPublicEvents = unstable_cache(
  fetchPublicEventsUncached,
  ["public-events-v2"],
  {
    tags: ["events"],
    revalidate: 300,
  }
);

export { fetchPublicEventsUncached };
