import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const db = prisma as any;

    // Fetch real hackathons from Devpost public API
    const res = await fetch(
      "https://devpost.com/api/hackathons?challenge_type[]=online&challenge_type[]=in-person&sort_by=submission_deadline",
      {
        headers: {
          "User-Agent": "EventerRadar/1.0 (Pakistan Tech Community Dispatch; mailto:radar@eventer.pk)",
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Upstream Devpost returned HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawHackathons = data.hackathons || [];

    let syncedCount = 0;

    for (const h of rawHackathons.slice(0, 10)) {
      if (!h.title) continue;

      const orgName = (h.organization_name || "Devpost Verified").trim();
      let org = await db.organizer.findFirst({ where: { name: orgName } });
      if (!org) {
        org = await db.organizer.create({ data: { name: orgName } });
      }

      const startsAt = h.submission_period_dates?.split("-")?.[0]?.trim();
      const startTime = startsAt ? new Date(startsAt) : new Date();
      const endTime = new Date(startTime.getTime() + 48 * 3600e3);

      const isPakistaniCity = /karachi|lahore|islamabad|peshawar|faisalabad|rawalpindi/i.test(
        h.displayed_location?.location || ""
      );

      const city = isPakistaniCity
        ? h.displayed_location.location.split(",")[0].trim()
        : "Remote";

      // Upsert event so duplicates are never inserted
      const existing = await db.event.findFirst({
        where: {
          title: h.title,
          organizerId: org.id,
        },
      });

      if (!existing) {
        await db.event.create({
          data: {
            title: h.title,
            description: h.description || `${h.title} hackathon hosted on Devpost.`,
            city,
            venue: h.displayed_location?.location || "Online",
            type: "HACKATHON",
            startTime: isNaN(startTime.getTime()) ? new Date() : startTime,
            endTime: isNaN(endTime.getTime()) ? new Date(Date.now() + 48 * 3600e3) : endTime,
            capacity: null,
            organizerId: org.id,
          },
        });
        syncedCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully synchronized ${syncedCount} real live events from Devpost API.`,
      syncedCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
