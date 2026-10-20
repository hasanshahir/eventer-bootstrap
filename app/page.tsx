import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { toCard, SCRAPED_EVENTS, EventCard } from "@/lib/ev";
import Feed from "@/components/Feed";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dbEvents: EventCard[] = [];
  try {
    if (process.env.DATABASE_URL) {
      const raw = await (prisma as any).event.findMany({
        include: { organizer: true },
        orderBy: { startTime: "asc" },
      });
      dbEvents = raw.map(toCard);
    }
  } catch (err) {
    console.error("Error querying events for home feed:", err);
  }

  // Combine DB events with scraped Pakistani events feed
  const seenTitles = new Set(dbEvents.map((e) => e.title.toLowerCase().trim()));
  const merged = [
    ...dbEvents,
    ...SCRAPED_EVENTS.filter((e) => !seenTitles.has(e.title.toLowerCase().trim())),
  ];

  return (
    <Suspense fallback={null}>
      <Feed events={merged} />
    </Suspense>
  );
}
