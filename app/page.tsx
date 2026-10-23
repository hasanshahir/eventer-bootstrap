import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { toCard, type EventCard } from "@/lib/ev";
import { discoverAllEvents } from "@/lib/discover-events";
import Feed from "@/components/Feed";

export const dynamic = "force-dynamic";

export default async function Home() {
  let events: EventCard[] = [];

  try {
    // Live multi-source aggregation (Devpost, GDG Pakistan, Luma PK, Unstop)
    const data = await discoverAllEvents(false);
    if (data.events && data.events.length > 0) {
      events = data.events.map(toCard);
    } else {
      // Neon DB Fallback
      const raw = await (prisma as any).event.findMany({
        include: { organizer: true },
        orderBy: { startTime: "asc" },
      });
      events = raw.map(toCard);
    }
  } catch (err) {
    console.error("Home radar load error:", err);
    try {
      const raw = await (prisma as any).event.findMany({
        include: { organizer: true },
        orderBy: { startTime: "asc" },
      });
      events = raw.map(toCard);
    } catch {}
  }

  return (
    <Suspense fallback={<div className="p-12 text-center font-mono">Loading radar...</div>}>
      <Feed events={events} />
    </Suspense>
  );
}
