import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrganizerForEvent, authzResponse } from "@/lib/authz";
import { apiError } from "@/lib/api-error";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { verifyTicketToken } from "@/lib/tickets";

export const dynamic = "force-dynamic";

const checkinSchema = z.object({
  ticketToken: z.string().trim().min(1, "ticketToken is required"),
  eventId: z.string().trim().min(1).optional(),
});

/**
 * POST /api/v1/checkin
 * Requires ORGANIZER membership for the ticket's event (or ADMIN).
 * Verifies signed JWT ticket token (or looks up legacy token if eventId matches),
 * requires status === CONFIRMED, executes an atomic `updateMany` so concurrent scans
 * cannot double-check-in, and returns ONLY sanitized attendee/event summary fields (fixes S-05).
 */
export async function POST(req: Request) {
  try {
    const rawBody: unknown = await req.json();
    const parsed = checkinSchema.parse(rawBody);

    // 1. Verify signed JWT payload if token is JWT; otherwise look up by ticketToken
    const jwtClaims = await verifyTicketToken(parsed.ticketToken);

    const reg = await prisma.registration.findFirst({
      where: jwtClaims
        ? {
            id: jwtClaims.rid,
            eventId: jwtClaims.eid,
          }
        : {
            ticketToken: parsed.ticketToken,
          },
      select: {
        id: true,
        eventId: true,
        status: true,
        nonce: true,
        checkedInAt: true,
        user: {
          select: {
            name: true,
            fullName: true,
            university: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!reg) {
      return apiError("Invalid or unrecognized ticket token.", 404);
    }

    if (jwtClaims && reg.nonce && jwtClaims.n !== reg.nonce) {
      return apiError("Ticket token signature nonce mismatch.", 401);
    }

    if (parsed.eventId && parsed.eventId !== reg.eventId) {
      return apiError("Ticket belongs to a different event.", 400);
    }

    // 2. Verify caller is an authorized organizer for this event (or ADMIN)
    const { user: organizerUser } = await requireOrganizerForEvent(reg.eventId);

    const rl = await checkRateLimit(`checkin:${organizerUser.id}`, 60, 60_000);
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    const attendeeSummary = {
      name: reg.user.fullName || reg.user.name || "Attendee",
      university: reg.user.university || null,
    };
    const eventSummary = {
      id: reg.event.id,
      title: reg.event.title,
    };

    if (reg.status === "CHECKED_IN") {
      return NextResponse.json(
        {
          ok: false,
          alreadyCheckedIn: true,
          checkedInAt: reg.checkedInAt,
          attendee: attendeeSummary,
          event: eventSummary,
          error: "Attendee has already checked in.",
        },
        { status: 409 }
      );
    }

    if (reg.status !== "CONFIRMED") {
      return apiError(
        `Ticket is not eligible for check-in (current status: ${reg.status}).`,
        400
      );
    }

    // 3. Atomic conditional update so concurrent scans cannot both succeed
    const now = new Date();
    const updated = await prisma.registration.updateMany({
      where: {
        id: reg.id,
        status: "CONFIRMED",
      },
      data: {
        status: "CHECKED_IN",
        checkedInAt: now,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        {
          ok: false,
          alreadyCheckedIn: true,
          checkedInAt: now,
          attendee: attendeeSummary,
          event: eventSummary,
          error: "Attendee has already checked in.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      attendee: attendeeSummary,
      event: eventSummary,
      checkedInAt: now.toISOString(),
    });
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Check-in failed.", 500, err);
  }
}
