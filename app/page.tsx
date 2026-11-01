import { Suspense } from "react";
import { getPublicEvents } from "@/lib/events/queries";
import Feed from "@/components/Feed";

export const revalidate = 300;

export default async function Home() {
  const events = await getPublicEvents();

  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-mono">Loading radar...</div>
      }
    >
      <Feed events={events} />
    </Suspense>
  );
}
