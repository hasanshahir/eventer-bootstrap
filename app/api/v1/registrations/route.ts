import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, authzResponse } from "@/lib/authz";
import { apiError } from "@/lib/api-error";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { generateTicketNonce, signTicketToken } from "@/lib/tickets";

export const dynamic = "force-dynamic";

const createRegistrationSchema = z.object({
  eventId: z.string().trim().min(1, "eventId is required"),
  turnstileToken: z.string().optional().nullable(),
});

/**
 * GET /api/v1/registrations
 * Returns ONLY the authenticated session user's registrations.
 * Ignores any `email` query parameter (fixes S-04 IDOR).
 */
export async function GET(req: Request) {
  try {
    const user = await requireUser();

    const rl = await checkRateLimit(`registrations:list:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    // Explicitly ignore any `?email=` query parameter; always filter by `user.id`
    void req;

    const registrations = await prisma.registration.findMany({
      where: { userId: user.id },
      include: {
        event: {
          include: {
            organizer: {
              select: { id: true, name: true, verified: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      registrations,
    });
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to load registrations.", 500, err);
  }
}

/**
 * POST /api/v1/registrations
 * Registers the currently authenticated session user for `eventId`.
 * Never trusts client-supplied `user` objects (fixes S-04).
 * Applies Turnstile bot verification (fixes S-12) and serializable capacity check.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const rl = await checkRateLimit(`registrations:create:${user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    const rawBody: unknown = await req.json();
    const parsed = createRegistrationSchema.parse(rawBody);

    const turnstile = await verifyTurnstileToken(
      parsed.turnstileToken,
      getClientIp(req)
    );
    if (!turnstile.success) {
      return apiError(turnstile.error || "Bot verification failed.", 403);
    }

    const existing = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: parsed.eventId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        registration: existing,
        ticketToken: existing.ticketToken,
        existing: true,
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const ev = await tx.event.findUnique({
          where: { id: parsed.eventId },
          select: {
            id: true,
            title: true,
            capacity: true,
            endTime: true,
            status: true,
          },
        });

        if (!ev || ev.status === "REJECTED") {
          return { notFound: true as const };
        }

        let status: "CONFIRMED" | "WAITLISTED" = "CONFIRMED";
        if (typeof ev.capacity === "number" && ev.capacity > 0) {
          const activeCount = await tx.registration.count({
            where: {
              eventId: ev.id,
              status: { in: ["CONFIRMED", "CHECKED_IN"] },
            },
          });
          if (activeCount >= ev.capacity) {
            status = "WAITLISTED";
          }
        }

        const registrationId = randomUUID();
        const nonce = generateTicketNonce();
        const ticketToken = await signTicketToken({
          registrationId,
          eventId: ev.id,
          nonce,
          eventEndTime: ev.endTime,
        });

        const registration = await tx.registration.create({
          data: {
            id: registrationId,
            userId: user.id,
            eventId: ev.id,
            status,
            nonce,
            ticketToken,
          },
        });

        return { notFound: false as const, registration, ticketToken };
      },
      { isolationLevel: "Serializable" }
    );

    if (result.notFound) {
      return apiError("Event not found.", 404);
    }

    return NextResponse.json(
      {
        ok: true,
        registration: result.registration,
        ticketToken: result.ticketToken,
      },
      { status: 201 }
    );
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to complete registration.", 500, err);
  }
}
