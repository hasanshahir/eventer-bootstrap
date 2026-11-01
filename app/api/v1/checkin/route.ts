import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireOrganizerForEvent, authzResponse } from "@/lib/authz";
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
 * 1. Requires authenticated user first (returns 401 if unauthenticated, 403 if plain USER role).
 * 2. Requires cryptographically signed HS256 JWT ticket token (rejects legacy plain UUIDs with 400
 *    instructing the attendee to open /passport where legacy tokens are automatically upgraded).
 * 3. Verifies caller is an authorized organizer for the ticket's event via `requireOrganizerForEvent` (403 otherwise).
 * 4. Executes atomic `updateMany({ where: { id, status: "CONFIRMED" } })` so duplicate/concurrent scans return 409.
 * 5. Returns ONLY sanitized attendee/event summary fields (fixes S-05).
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate caller upfront so unauthenticated callers always get 401 before any token/DB inspection
    const caller = await requireUser();
    if (caller.role !== "ORGANIZER" && caller.role !== "ADMIN") {
      return apiError("Forbidden: organizer role required to scan tickets.", 403);
    }

    const rl = await checkRateLimit(`checkin:${caller.id}`, 60, 60_000);
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    const rawBody: unknown = await req.json();
    const parsed = checkinSchema.parse(rawBody);

    // 2. Verify signed HS256 JWT payload; reject unsigned/legacy UUID tokens
    const jwtClaims = await verifyTicketToken(parsed.ticketToken);
    if (!jwtClaims) {
      return apiError(
        "Invalid or unsigned ticket token. If this is an older pass, ask the attendee to open /passport to upgrade to a signed QR pass.",
        400
      );
    }

    const reg = await prisma.registration.findFirst({
      where: {
        id: jwtClaims.rid,
        eventId: jwtClaims.eid,
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
      return apiError("Ticket registration not found.", 404);
    }

    if (reg.nonce && jwtClaims.n !== reg.nonce) {
      return apiError("Ticket token signature nonce mismatch.", 401);
    }

    if (parsed.eventId && parsed.eventId !== reg.eventId) {
      return apiError("Ticket belongs to a different event.", 400);
    }

    // 3. Verify caller is an authorized organizer for this specific event (or ADMIN)
    await requireOrganizerForEvent(reg.eventId);

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

    // 4. Atomic conditional update so concurrent scans cannot both succeed
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
