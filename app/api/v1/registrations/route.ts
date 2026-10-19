import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const db = prisma as any;

export async function POST(req: Request) {
  try {
    const { eventId, user } = await req.json();
    if (!eventId || !user?.email) return NextResponse.json({ error: "eventId and user.email required" }, { status: 400 });

    let u = await db.user.findUnique({ where: { email: user.email } });
    if (!u) {
      u = await db.user.create({
        data: { fullName: user.name, email: user.email, university: user.university, city: user.city },
      });
    }

    const existing = await db.registration.findFirst({ where: { eventId, userId: u.id } });
    if (existing) return NextResponse.json({ registration: existing, ticketToken: existing.ticketToken, existing: true });

    const ev = await db.event.findUnique({ where: { id: eventId } });
    if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    let status = "CONFIRMED";
    if (typeof ev.capacity === "number") {
      const count = await db.registration.count({ where: { eventId, status: { in: ["CONFIRMED", "CHECKED_IN"] } } });
      if (count >= ev.capacity) status = "WAITLISTED";
    }
    const ticketToken = randomUUID();
    const registration = await db.registration.create({ data: { eventId, userId: u.id, status, ticketToken } });
    return NextResponse.json({ registration, ticketToken });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ registrations: [] });
  const u = await db.user.findUnique({ where: { email } });
  if (!u) return NextResponse.json({ registrations: [] });
  const registrations = await db.registration.findMany({
    where: { userId: u.id },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ registrations });
}