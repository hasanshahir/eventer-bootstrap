import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizerForEvent, authzResponse } from "@/lib/authz";
import { apiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

function escapeCsvCell(raw: unknown): string {
  const str = String(raw ?? "").replace(/\r?\n/g, " ").trim();
  // Prevent CSV formula injection (=, +, -, @, \t, \r)
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (
    neutralized.includes(",") ||
    neutralized.includes('"') ||
    neutralized.includes("'")
  ) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { event } = await requireOrganizerForEvent(id);

    const registrations = await prisma.registration.findMany({
      where: { eventId: event.id },
      include: {
        user: {
          select: {
            name: true,
            fullName: true,
            email: true,
            university: true,
            city: true,
            rollNumber: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const header = [
      "Registration ID",
      "Attendee Name",
      "Email",
      "University",
      "City",
      "Roll Number",
      "Status",
      "Checked In At",
      "Registered At",
    ].join(",");

    const rows = registrations.map((r) =>
      [
        escapeCsvCell(r.id),
        escapeCsvCell(r.user.fullName || r.user.name || ""),
        escapeCsvCell(r.user.email),
        escapeCsvCell(r.user.university || ""),
        escapeCsvCell(r.user.city || ""),
        escapeCsvCell(r.user.rollNumber || ""),
        escapeCsvCell(r.status),
        escapeCsvCell(r.checkedInAt ? r.checkedInAt.toISOString() : ""),
        escapeCsvCell(r.createdAt.toISOString()),
      ].join(",")
    );

    const csv = [header, ...rows].join("\r\n") + "\r\n";

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="event-${event.id}-roster.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to export event roster CSV.", 500, err);
  }
}

