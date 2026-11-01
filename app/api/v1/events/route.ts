import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, authzResponse, resolveUserOrganizer } from "@/lib/authz";
import { apiError } from "@/lib/api-error";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { deriveTags } from "@/lib/match";

export const dynamic = "force-dynamic";

const createEventSchema = z
  .object({
    title: z.string().trim().min(4, "Title must be at least 4 characters").max(160),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(4000),
    city: z.string().trim().min(2).max(80).default("Karachi"),
    venue: z.string().trim().max(240).optional().nullable(),
    type: z
      .enum(["HACKATHON", "WORKSHOP", "CONFERENCE", "MEETUP", "COMPETITION", "TECH_TALK"])
      .default("MEETUP"),
    mode: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]).default("IN_PERSON"),
    startsAt: z.string().refine((v) => !isNaN(new Date(v).getTime()), {
      message: "Valid startsAt ISO date is required",
    }),
    endsAt: z
      .string()
      .optional()
      .nullable()
      .refine((v) => !v || !isNaN(new Date(v).getTime()), {
        message: "endsAt must be a valid ISO date",
      }),
    registrationDeadline: z
      .string()
      .optional()
      .nullable()
      .refine((v) => !v || !isNaN(new Date(v).getTime()), {
        message: "registrationDeadline must be a valid ISO date",
      }),
    registrationUrl: z
      .string()
      .url("registrationUrl must be a valid http(s) URL")
      .optional()
      .nullable()
      .or(z.literal("")),
    capacity: z.number().int().positive().max(50000).optional().nullable(),
    tags: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
    turnstileToken: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.endsAt) return true;
      return new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime();
    },
    {
      message: "End time must be after start time",
      path: ["endsAt"],
    }
  )
  .refine(
    (data) => {
      if (!data.registrationDeadline) return true;
      return (
        new Date(data.registrationDeadline).getTime() <=
        new Date(data.startsAt).getTime()
      );
    },
    {
      message: "Registration deadline must be on or before the event start time",
      path: ["registrationDeadline"],
    }
  );

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const rl = await checkRateLimit(`events:create:${user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    const rawBody: unknown = await req.json();
    const parsed = createEventSchema.parse(rawBody);

    const turnstile = await verifyTurnstileToken(
      parsed.turnstileToken,
      getClientIp(req)
    );
    if (!turnstile.success) {
      return apiError(turnstile.error || "Bot verification failed.", 403);
    }

    // Derive organizer strictly from OrganizerMember (never free text — fixes S-07)
    const organizer = await resolveUserOrganizer(user.id);

    const startTime = new Date(parsed.startsAt);
    const endTime = parsed.endsAt
      ? new Date(parsed.endsAt)
      : new Date(startTime.getTime() + 2 * 3600 * 1000);
    const registrationDeadline = parsed.registrationDeadline
      ? new Date(parsed.registrationDeadline)
      : null;

    const slugBase = parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const tags =
      parsed.tags && parsed.tags.length > 0
        ? parsed.tags
        : deriveTags(parsed.title, parsed.description);

    const event = await prisma.event.create({
      data: {
        slug,
        title: parsed.title,
        description: parsed.description,
        city: parsed.mode === "ONLINE" ? "Online" : parsed.city,
        venue: parsed.venue || (parsed.mode === "ONLINE" ? "Online" : parsed.city),
        type: parsed.type,
        mode: parsed.mode,
        startTime,
        endTime,
        registrationDeadline,
        registrationUrl: parsed.registrationUrl || null,
        capacity: parsed.capacity ?? null,
        tags,
        source: "MANUAL",
        status: "PENDING",
        needsVerification: !organizer.verified,
        organizerId: organizer.id,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Event submitted for moderation review.",
        event: {
          id: event.id,
          slug: event.slug,
          title: event.title,
          status: event.status,
          organizer: organizer.name,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to submit event.", 500, err);
  }
}
