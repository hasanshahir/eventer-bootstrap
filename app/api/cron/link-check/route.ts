import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyCronSecret } from "../ingest/route";

export const dynamic = "force-dynamic";

async function checkRegistrationLink(url: string): Promise<{
  ok: boolean;
  status: number;
}> {
  try {
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent":
          "EventrLinkVerifier/2.0 (+https://eventer-bootstrap.vercel.app)",
      },
    });
    if (headRes.status === 405 || headRes.status === 403) {
      const getRes = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
        headers: {
          "User-Agent":
            "EventrLinkVerifier/2.0 (+https://eventer-bootstrap.vercel.app)",
        },
      });
      return {
        ok: getRes.status !== 404 && getRes.status !== 410,
        status: getRes.status,
      };
    }
    return {
      ok: headRes.status !== 404 && headRes.status !== 410,
      status: headRes.status,
    };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized cron invocation" },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    const upcomingEvents = await prisma.event.findMany({
      where: {
        status: "APPROVED",
        registrationUrl: { not: null },
        OR: [{ endTime: null }, { endTime: { gte: now } }],
      },
      take: 40,
      orderBy: [{ linkCheckedAt: "asc" }, { startTime: "asc" }],
    });

    let checkedCount = 0;
    let deadLinkCount = 0;

    for (const ev of upcomingEvents) {
      if (!ev.registrationUrl) continue;
      checkedCount++;
      const res = await checkRegistrationLink(ev.registrationUrl);
      const isDead = res.status === 404 || res.status === 410;
      if (isDead) deadLinkCount++;

      await prisma.event.update({
        where: { id: ev.id },
        data: {
          linkCheckedAt: now,
          linkOk: res.ok,
          status: isDead ? "ARCHIVED" : ev.status,
        },
      });
    }

    try {
      revalidateTag("events", "max");
    } catch {
      // No-op outside Next request store
    }

    return NextResponse.json({
      ok: true,
      checkedCount,
      deadLinkCount,
    });
  } catch (err) {
    console.error("[GET /api/cron/link-check] Error:", err);
    return NextResponse.json(
      { error: "Link check cron failed" },
      { status: 500 }
    );
  }
}

