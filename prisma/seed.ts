import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { runIngestionPipeline } from "../lib/ingest/run";
import { migratePhoneFromRollNumber } from "../scripts/migrate-phone-rollnumber";

async function main() {
  // 1. Run S-13 PII data migration (move any phone numbers out of User.rollNumber)
  try {
    const migrationResult = await migratePhoneFromRollNumber();
    if (migrationResult.migrated > 0) {
      console.log(
        `Migrated ${migrationResult.migrated} phone number(s) from User.rollNumber to User.phoneEncrypted.`
      );
    }
  } catch (err) {
    console.warn("Phone migration notice:", err);
  }

  // 2. Seed initial ADMIN account from ADMIN_EMAIL env variable
  const adminEmail = (process.env.ADMIN_EMAIL || env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const adminName = (
    process.env.ADMIN_NAME ||
    env.ADMIN_NAME ||
    "Eventr Admin"
  ).trim();

  if (adminEmail) {
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: "ADMIN",
        name: adminName,
        fullName: adminName,
      },
      create: {
        email: adminEmail,
        name: adminName,
        fullName: adminName,
        role: "ADMIN",
        city: "Karachi",
      },
    });

    // Ensure admin has a verified Organizer + OrganizerMember record
    const org = await prisma.organizer.upsert({
      where: { slug: "eventr-official" },
      update: {
        name: "Eventr Official Desk",
        verified: true,
      },
      create: {
        name: "Eventr Official Desk",
        slug: "eventr-official",
        verified: true,
      },
    });

    await prisma.organizerMember.upsert({
      where: {
        userId_organizerId: {
          userId: adminUser.id,
          organizerId: org.id,
        },
      },
      update: { role: "OWNER" },
      create: {
        userId: adminUser.id,
        organizerId: org.id,
        role: "OWNER",
      },
    });

    console.log(`Seeded ADMIN user: ${adminUser.email} (${adminUser.id})`);
  }

  // 3. Seed curated baseline events via modular ingestion pipeline
  console.log("Seeding curated events into database...");
  const summary = await runIngestionPipeline({ includeLiveConnectors: false });
  console.log(
    `Ingestion complete: fetched=${summary.fetchedCount}, upserted=${summary.upsertedCount}, archived=${summary.archivedCount}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
