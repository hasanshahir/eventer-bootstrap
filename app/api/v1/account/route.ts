import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, authzResponse } from "@/lib/authz";
import { apiError } from "@/lib/api-error";
import { decryptPii, encryptPii } from "@/lib/crypto";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const updateAccountSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  university: z.string().trim().max(160).optional().nullable(),
  rollNumber: z.string().trim().max(60).optional().nullable(),
  city: z.string().trim().max(80).default("Karachi"),
  phone: z.string().trim().max(30).optional().nullable(),
  githubHandle: z.string().trim().max(80).optional().nullable(),
  techStack: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
});

export async function GET() {
  try {
    const sessionUser = await requireUser();
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        fullName: true,
        role: true,
        university: true,
        rollNumber: true,
        phoneEncrypted: true,
        city: true,
        githubHandle: true,
        techStack: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return apiError("Account not found.", 404);
    }

    return NextResponse.json({
      ok: true,
      profile: {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName || dbUser.name || "",
        role: dbUser.role,
        university: dbUser.university || "",
        rollNumber: dbUser.rollNumber || "",
        phone: decryptPii(dbUser.phoneEncrypted) || "",
        city: dbUser.city || "Karachi",
        githubHandle: dbUser.githubHandle || "",
        techStack: dbUser.techStack || [],
        createdAt: dbUser.createdAt,
      },
    });
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to load account profile.", 500, err);
  }
}

export async function PATCH(req: Request) {
  try {
    const sessionUser = await requireUser();
    const rl = await checkRateLimit(`account:update:${sessionUser.id}`, 15, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl);

    const rawBody: unknown = await req.json();
    const parsed = updateAccountSchema.parse(rawBody);

    const phoneEncrypted = parsed.phone ? encryptPii(parsed.phone) : null;

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        name: parsed.fullName,
        fullName: parsed.fullName,
        university: parsed.university || null,
        rollNumber: parsed.rollNumber || null,
        phoneEncrypted,
        city: parsed.city,
        githubHandle: parsed.githubHandle || null,
        ...(parsed.techStack ? { techStack: parsed.techStack } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        university: true,
        rollNumber: true,
        city: true,
        githubHandle: true,
        techStack: true,
      },
    });

    return NextResponse.json({
      ok: true,
      profile: {
        ...updated,
        phone: parsed.phone || "",
      },
    });
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to update account profile.", 500, err);
  }
}

/**
 * DELETE /api/v1/account
 * Deletes the authenticated user and all dependent records (registrations,
 * team memberships, organizer memberships, sessions, accounts) inside a transaction
 * so deletion succeeds cleanly even if legacy databases had RESTRICT foreign keys.
 */
export async function DELETE() {
  try {
    const sessionUser = await requireUser();
    const rl = await checkRateLimit(`account:delete:${sessionUser.id}`, 3, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl);

    await prisma.$transaction(async (tx) => {
      await tx.registration.deleteMany({ where: { userId: sessionUser.id } });
      await tx.teamMember.deleteMany({ where: { userId: sessionUser.id } });
      await tx.team.updateMany({
        where: { leaderId: sessionUser.id },
        data: { leaderId: null },
      });
      await tx.organizerMember.deleteMany({ where: { userId: sessionUser.id } });
      await tx.session.deleteMany({ where: { userId: sessionUser.id } });
      await tx.account.deleteMany({ where: { userId: sessionUser.id } });
      await tx.user.delete({ where: { id: sessionUser.id } });
    });

    const res = NextResponse.json({
      ok: true,
      message: "Your account and associated personal data have been permanently deleted.",
    });

    res.cookies.delete("authjs.session-token");
    res.cookies.delete("__Secure-authjs.session-token");
    return res;
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to delete account.", 500, err);
  }
}
