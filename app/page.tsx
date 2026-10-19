import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await prisma.event.findMany({
    orderBy: {
      startTime: 'asc',
    },
  });

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Tech Events</h1>
      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              {event.title} — {event.city} ({new Date(event.startTime).toLocaleDateString()})
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
