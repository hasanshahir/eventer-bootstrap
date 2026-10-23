import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const db = prisma as any;

const EVENTS = [
  { title: "NED Tech Fest: AI Hackathon", description: "24-hour AI hackathon at NED University with workshops, mentors and prizes.", city: "Karachi", venue: "NED University, AV Hall", type: "HACKATHON", startTime: "2026-11-14T09:00:00+05:00", endTime: "2026-11-15T09:00:00+05:00", capacity: 250 },
  { title: "GDG Kolachi DevFest 2026", description: "Flagship Google developer community conference on Android, Cloud and AI.", city: "Karachi", venue: "Karachi Expo Centre", type: "CONFERENCE", startTime: "2026-11-21T10:00:00+05:00", endTime: "2026-11-21T18:00:00+05:00", capacity: 500 },
  { title: "SOFTEC '26 Hackathon", description: "FAST-NUCES flagship tech competition featuring a 36-hour hackathon.", city: "Lahore", venue: "FAST-NUCES Lahore", type: "HACKATHON", startTime: "2026-11-27T09:00:00+05:00", endTime: "2026-11-28T21:00:00+05:00", capacity: 400 },
  { title: "NUST Olympiad CodeSprint", description: "Competitive programming sprint run by the NUST Olympiad team.", city: "Islamabad", venue: "NUST H-12 Campus", type: "COMPETITION", startTime: "2026-11-08T10:00:00+05:00", endTime: "2026-11-08T17:00:00+05:00", capacity: 150 },
];

export async function GET() {
  try {
    let org = await db.organizer.findFirst({ where: { name: "Eventr Community" } });
    if (!org) org = await db.organizer.create({ data: { name: "Eventr Community" } });
    let created = 0;
    for (const e of EVENTS) {
      const exists = await db.event.findFirst({ where: { title: e.title } });
      if (exists) continue;
      await db.event.create({
        data: { ...e, startTime: new Date(e.startTime), endTime: new Date(e.endTime), organizerId: org.id },
      });
      created++;
    }
    return NextResponse.json({ ok: true, created });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "failed" }, { status: 500 });
  }
}