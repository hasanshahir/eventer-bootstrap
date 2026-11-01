import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authzResponse } from "@/lib/authz";
import { apiError } from "@/lib/api-error";
import { decryptPii } from "@/lib/crypto";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await requireUser();
    const rl = await checkRateLimit(`account:export:${sessionUser.id}`, 5, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl);

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        registrations: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                city: true,
                venue: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
        organizerMemberships: {
          include: {
            organizer: true,
          },
        },
      },
    });

    if (!dbUser) {
      return apiError("User not found.", 404);
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      platform: "Eventr Pakistan",
      user: {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName || dbUser.name,
        role: dbUser.role,
        university: dbUser.university,
        rollNumber: dbUser.rollNumber,
        phone: decryptPii(dbUser.phoneEncrypted),
        city: dbUser.city,
        githubHandle: dbUser.githubHandle,
        techStack: dbUser.techStack,
        savedEventIds: dbUser.savedEventIds,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      },
      registrations: dbUser.registrations.map((r) => ({
        id: r.id,
        status: r.status,
        checkedInAt: r.checkedInAt,
        createdAt: r.createdAt,
        event: r.event,
      })),
      organizerMemberships: dbUser.organizerMemberships.map((m) => ({
        role: m.role,
        organizer: {
          id: m.organizer.id,
          name: m.organizer.name,
          verified: m.organizer.verified,
        },
      })),
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="eventr-data-export-${dbUser.id}.json"`,
      },
    });
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to export account data.", 500, err);
  }
}

