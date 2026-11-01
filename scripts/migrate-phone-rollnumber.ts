import { prisma } from "../lib/prisma";
import { encryptPii, isLikelyPhoneNumber } from "../lib/crypto";

/**
 * Migrates phone numbers previously stored in `User.rollNumber` into
 * AES-256-GCM encrypted `User.phoneEncrypted` and nulls `rollNumber` (fixes S-13).
 */
export async function migratePhoneFromRollNumber(): Promise<{
  scanned: number;
  migrated: number;
}> {
  const users = await prisma.user.findMany({
    where: {
      rollNumber: { not: null },
    },
    select: {
      id: true,
      rollNumber: true,
      phoneEncrypted: true,
    },
  });

  let migrated = 0;
  for (const u of users) {
    if (u.rollNumber && isLikelyPhoneNumber(u.rollNumber)) {
      const encrypted = u.phoneEncrypted || encryptPii(u.rollNumber);
      await prisma.user.update({
        where: { id: u.id },
        data: {
          phoneEncrypted: encrypted,
          rollNumber: null,
        },
      });
      migrated++;
    }
  }

  return { scanned: users.length, migrated };
}

if (require.main === module) {
  migratePhoneFromRollNumber()
    .then((res) => {
      console.log(
        `[Phone Migration] Scanned ${res.scanned} user records, migrated ${res.migrated} phone numbers out of rollNumber.`
      );
    })
    .catch((err) => {
      console.error("[Phone Migration] Failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

