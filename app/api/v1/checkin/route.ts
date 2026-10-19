import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const db = prisma as any;

export async function POST(req: Request) {
  try {
    const { ticketToken } = await req.json();
    if (!ticketToken) {
      return NextResponse.json({ ok: false, error: "ticketToken required" }, { status: 400 });
    }

    const reg = await db.registration.findUnique({
      where: { ticketToken },
      include: { user: true, event: true },
    });

    if (!reg) {
      return NextResponse.json({ ok: false, error: "Invalid ticket token" }, { status: 404 });
    }

    if (reg.status === "CHECKED_IN") {
      return NextResponse.json({
        ok: false,
        alreadyCheckedIn: true,
        checkedInAt: reg.checkedInAt,
        attendee: reg.user,
        event: reg.event,
        error: `Already checked in at ${new Date(reg.checkedInAt).toLocaleTimeString()}`,
      }, { status: 409 });
    }

    const updated = await db.registration.update({
      where: { ticketToken },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      },
      include: { user: true, event: true },
    });

    return NextResponse.json({
      ok: true,
      registration: updated,
      attendee: updated.user,
      event: updated.event,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Check-in failed" }, { status: 500 });
  }
}
