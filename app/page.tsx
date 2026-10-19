import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let events: Array<{ id: string; title: string; city: string; startTime: Date }> = [];

  try {
    if (process.env.DATABASE_URL) {
      events = await prisma.event.findMany({
        orderBy: {
          startTime: 'asc',
        },
      });
    }
  } catch (error) {
    console.error('Error querying events from database:', error);
  }

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
