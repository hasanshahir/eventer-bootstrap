import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let dbStatus = "unknown";
  let dbLatencyMs = -1;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = "connected";
  } catch {
    try {
      const t0 = Date.now();
      await prisma.user.findFirst({ select: { id: true } });
      dbLatencyMs = Date.now() - t0;
      dbStatus = "connected";
    } catch (dbErr) {
      dbStatus = "unreachable";
      return NextResponse.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          uptimeSec: Math.floor(process.uptime()),
          checks: {
            database: {
              status: dbStatus,
              error: dbErr instanceof Error ? dbErr.message : "Database connection failed",
            },
          },
          latencyMs: Date.now() - startedAt,
        },
        { status: 503 }
      );
    }
  }

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime()),
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    latencyMs: Date.now() - startedAt,
  });
}

