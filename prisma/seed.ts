import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const organizer = await prisma.organizer.upsert({
    where: { id: 'org_pakistan_tech_net' },
    update: {
      name: 'Pakistan Tech Community Network',
    },
    create: {
      id: 'org_pakistan_tech_net',
      name: 'Pakistan Tech Community Network',
    },
  });

  const events = [
    {
      id: 'event_ned_techfest_2026',
      title: 'NED Tech Fest: AI Hackathon',
      description: 'Flagship 48-hour student AI hackathon bringing together builders across Sindh to solve real-world problems with generative intelligence.',
      city: 'Karachi',
      venue: 'NED University Main Campus, Karachi',
      type: 'Hackathon',
      startTime: new Date('2026-11-06T04:00:00.000Z'),
      endTime: new Date('2026-11-08T13:00:00.000Z'),
      capacity: 250,
      organizerId: organizer.id,
    },
    {
      id: 'event_gdg_kolachi_2026',
      title: 'GDG Kolachi DevFest 2026',
      description: 'The premier developer gathering in Karachi covering Cloud, Web, Android, Open Source, and Gemini generative AI agents.',
      city: 'Karachi',
      venue: 'Habib University Auditorium, Karachi',
      type: 'Conference',
      startTime: new Date('2026-11-14T05:00:00.000Z'),
      endTime: new Date('2026-11-14T14:00:00.000Z'),
      capacity: 500,
      organizerId: organizer.id,
    },
    {
      id: 'event_softec_2026',
      title: "SOFTEC '26 Hackathon",
      description: "Pakistan's premier software competition featuring algorithmic challenges, AI innovation tracks, and university showdowns.",
      city: 'Lahore',
      venue: 'FAST-NUCES Lahore Campus, Faisal Town',
      type: 'Hackathon',
      startTime: new Date('2026-11-20T04:00:00.000Z'),
      endTime: new Date('2026-11-22T12:00:00.000Z'),
      capacity: 400,
      organizerId: organizer.id,
    },
    {
      id: 'event_nust_codesprint_2026',
      title: 'NUST Olympiad CodeSprint',
      description: 'High-octane competitive programming contest and tech showcase challenging the sharpest collegiate teams nationwide.',
      city: 'Islamabad',
      venue: 'SEECS, NUST H-12 Campus, Islamabad',
      type: 'Competition',
      startTime: new Date('2026-11-27T05:00:00.000Z'),
      endTime: new Date('2026-11-28T13:00:00.000Z'),
      capacity: 200,
      organizerId: organizer.id,
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: event,
      create: event,
    });
  }

  console.log(`Seeded 1 organizer and ${events.length} Pakistani events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
