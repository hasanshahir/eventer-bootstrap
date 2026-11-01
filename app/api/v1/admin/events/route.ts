import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, authzResponse } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const [events, ingestionRuns] = await Promise.all([
      prisma.event.findMany({
        include: { organizer: true },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 200,
      }),
      prisma.ingestionRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 15,
      }),
    ]);

    return NextResponse.json({
      events,
      ingestionRuns,
    });
  } catch (err) {
    const authErr = authzResponse(err);
    if (authErr) return authErr;

    console.error("[GET /api/v1/admin/events] Error:", err);
    return NextResponse.json(
      { error: "Failed to load admin moderation queue" },
      { status: 500 }
    );
  }
}
