import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authzResponse } from "@/lib/authz";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();

    let organizerIds: string[] = [];
    if (user.role !== "ADMIN") {
      const memberships = await prisma.organizerMember.findMany({
        where: { userId: user.id },
        select: { organizerId: true },
      });
      organizerIds = memberships.map((m) => m.organizerId);

      if (organizerIds.length === 0) {
        return NextResponse.json({
          ok: true,
          events: [],
        });
      }
    }

    const events = await prisma.event.findMany({
      where:
        user.role === "ADMIN"
          ? {}
          : {
              organizerId: { in: organizerIds },
            },
      include: {
        organizer: {
          select: { id: true, name: true, verified: true },
        },
        registrations: {
          select: {
            id: true,
            status: true,
            checkedInAt: true,
            user: {
              select: {
                name: true,
                fullName: true,
                university: true,
              },
            },
          },
          orderBy: { checkedInAt: "desc" },
        },
      },
      orderBy: { startTime: "asc" },
      take: 100,
    });

    const formatted = events.map((ev) => {
      const confirmedCount = ev.registrations.filter(
        (r) => r.status === "CONFIRMED" || r.status === "CHECKED_IN"
      ).length;
      const checkedInCount = ev.registrations.filter(
        (r) => r.status === "CHECKED_IN"
      ).length;
      const waitlistedCount = ev.registrations.filter(
        (r) => r.status === "WAITLISTED"
      ).length;

      const recentCheckIns = ev.registrations
        .filter((r) => r.status === "CHECKED_IN")
        .slice(0, 15)
        .map((r) => ({
          id: r.id,
          checkedInAt: r.checkedInAt,
          attendee: {
            name: r.user.fullName || r.user.name || "Attendee",
            university: r.user.university || "Verified Pass",
          },
          event: {
            id: ev.id,
            title: ev.title,
          },
        }));

      return {
        id: ev.id,
        slug: ev.slug,
        title: ev.title,
        city: ev.city,
        startTime: ev.startTime,
        capacity: ev.capacity,
        status: ev.status,
        organizer: ev.organizer,
        confirmedCount,
        checkedInCount,
        waitlistedCount,
        recentCheckIns,
      };
    });

    return NextResponse.json({
      ok: true,
      events: formatted,
    });
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to load organizer events.", 500, err);
  }
}

