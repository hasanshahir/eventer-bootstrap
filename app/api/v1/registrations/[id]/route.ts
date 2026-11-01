import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authzResponse } from "@/lib/authz";
import { apiError } from "@/lib/api-error";
import { withSerializableRetry } from "../route";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/registrations/[id]
 * Cancels the authenticated user's registration and atomically promotes the
 * oldest WAITLISTED registration for the same event to CONFIRMED inside a
 * Serializable transaction (fixes F-02 & F-15).
 */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    if (!id) {
      return apiError("Registration id is required.", 400);
    }

    const outcome = await withSerializableRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const existing = await tx.registration.findUnique({
            where: { id },
          });

          if (!existing) {
            return { notFound: true as const, forbidden: false as const };
          }

          if (existing.userId !== user.id) {
            return { notFound: false as const, forbidden: true as const };
          }

          if (existing.status === "CANCELLED") {
            return {
              notFound: false as const,
              forbidden: false as const,
              cancelled: existing,
              promotedId: null,
            };
          }

          const wasConfirmed = existing.status === "CONFIRMED";

          const cancelled = await tx.registration.update({
            where: { id: existing.id },
            data: {
              status: "CANCELLED",
              nonce: null,
            },
          });

          let promotedId: string | null = null;
          if (wasConfirmed) {
            const nextWaitlisted = await tx.registration.findFirst({
              where: {
                eventId: existing.eventId,
                status: "WAITLISTED",
              },
              orderBy: { createdAt: "asc" },
            });

            if (nextWaitlisted) {
              const promoted = await tx.registration.update({
                where: { id: nextWaitlisted.id },
                data: { status: "CONFIRMED" },
              });
              promotedId = promoted.id;
            }
          }

          return {
            notFound: false as const,
            forbidden: false as const,
            cancelled,
            promotedId,
          };
        },
        { isolationLevel: "Serializable" }
      )
    );

    if (outcome.notFound) {
      return apiError("Registration not found.", 404);
    }

    if (outcome.forbidden) {
      return apiError("Forbidden: you can only cancel your own registration.", 403);
    }

    return NextResponse.json({
      ok: true,
      registration: outcome.cancelled,
      promotedRegistrationId: outcome.promotedId,
    });
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to cancel registration.", 500, err);
  }
}
