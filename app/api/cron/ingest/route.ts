import crypto from "crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runIngestionPipeline } from "@/lib/ingest/run";

export const dynamic = "force-dynamic";

export function verifyCronSecret(request: Request): boolean {
  const expectedSecret = (process.env.CRON_SECRET || env.CRON_SECRET || "").trim();
  if (!expectedSecret) return false;

  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return false;

  const provided = authHeader.slice("Bearer ".length).trim();
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expectedSecret, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized cron invocation" },
      { status: 401 }
    );
  }

  try {
    const result = await runIngestionPipeline({ includeLiveConnectors: true });
    return NextResponse.json({
      ...result,
      ok: true,
    });
  } catch (err) {
    console.error("[GET /api/cron/ingest] Error:", err);
    return NextResponse.json(
      { error: "Ingestion pipeline failed" },
      { status: 500 }
    );
  }
}

