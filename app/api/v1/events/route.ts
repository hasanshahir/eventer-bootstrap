import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const db = prisma as any;

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.title) return NextResponse.json({ ok: false, error: "title required" }, { status: 400 });
    const orgName = (b.organizer || "Community").trim();
    let org = await db.organizer.findFirst({ where: { name: orgName } });
    if (!org) org = await db.organizer.create({ data: { name: orgName } });
    const start = b.startsAt ? new Date(b.startsAt) : new Date(Date.now() + 7 * 864e5);
    const end = b.endsAt ? new Date(b.endsAt) : new Date(start.getTime() + 3 * 3600e3);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid date" }, { status: 400 });
    }
    const event = await db.event.create({
      data: {
        title: b.title,
        description: b.description ?? "",
        city: b.city || "Karachi",
        venue: b.venue ?? "",
        type: b.type || "MEETUP",
        startTime: start,
        endTime: end,
        organizerId: org.id,
      },
    });
    return NextResponse.json({ ok: true, event });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
  }
}
