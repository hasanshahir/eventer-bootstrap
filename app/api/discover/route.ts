import { NextResponse, type NextRequest } from "next/server";
import { discoverAllEvents } from "@/lib/discover-events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await discoverAllEvents(false);
    return NextResponse.json({
      success: true,
      count: data.events.length,
      sources: data.sources,
      events: data.events,
    });
  } catch (err: any) {
    console.error("GET /api/discover error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Force a fresh live scan bypassing memory cache
    const data = await discoverAllEvents(true);
    return NextResponse.json({
      success: true,
      count: data.events.length,
      sources: data.sources,
      events: data.events,
    });
  } catch (err: any) {
    console.error("POST /api/discover error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
