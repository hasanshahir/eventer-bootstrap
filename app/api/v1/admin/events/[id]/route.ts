import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, authzResponse } from "@/lib/authz";

const AdminEventStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ARCHIVED"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"]);

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing event id" }, { status: 400 });
    }

    const rawBody = await request.json();
    const parsed = AdminEventStatusSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid moderation status",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.event.findUnique({
      where: { id },
      include: { organizer: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const nextStatus = parsed.data.status;
    const updated = await prisma.event.update({
      where: { id },
      data: {
        status: nextStatus,
        verifiedAt:
          nextStatus === "APPROVED" ? new Date() : existing.verifiedAt,
        missedRuns: nextStatus === "APPROVED" ? 0 : existing.missedRuns,
      },
      include: { organizer: true },
    });

    try {
      revalidateTag("events", "max");
    } catch {
      // No-op outside Next request store
    }

    return NextResponse.json({
      ok: true,
      event: updated,
    });
  } catch (err) {
    const authErr = authzResponse(err);
    if (authErr) return authErr;

    console.error("[PATCH /api/v1/admin/events/[id]] Error:", err);
    return NextResponse.json(
      { error: "Failed to update event status" },
      { status: 500 }
    );
  }
}
