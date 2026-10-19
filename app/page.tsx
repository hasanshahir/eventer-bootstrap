import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { toCard } from "@/lib/ev";
import Feed from "@/components/Feed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const raw = await (prisma as any).event.findMany({ include: { organizer: true }, orderBy: { startTime: "asc" } });
  const events = raw.map(toCard);
  return (
    <Suspense fallback={null}>
      <Feed events={events} />
    </Suspense>
  );
}