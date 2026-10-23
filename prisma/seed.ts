import { PrismaClient } from "@prisma/client";
import { discoverAllEvents, syncDiscoveredEventsToPrisma } from "../lib/discover-events";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up old mock and fake events...");
  try {
    await prisma.event.deleteMany({
      where: {
        OR: [
          { id: { in: ["event_ned_techfest_2026", "event_gdg_kolachi_2026", "event_softec_2026", "event_nust_codesprint_2026"] } },
          { description: { contains: "https://lu.ma\n" } },
          { description: { endsWith: "https://lu.ma" } },
          { description: { contains: "https://luma.com/home" } },
        ],
      },
    });
  } catch (err) {
    console.warn("Delete old mocks notice:", err);
  }

  console.log("Triggering live multi-source radar discovery (Devpost, GDG, Luma, Unstop)...");
  const data = await discoverAllEvents(true);
  await syncDiscoveredEventsToPrisma(data.events);

  console.log(`Successfully synced ${data.events.length} real upcoming events into Neon database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
