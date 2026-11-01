import { NextResponse } from "next/server";
import { getPublicEvents } from "@/lib/events/queries";
import { generateEventIcs } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const cleanId = rawId.replace(/\.ics$/i, "").trim();

  const events = await getPublicEvents();
  const match = events.find(
    (e) =>
      e.id === cleanId ||
      e.slug === cleanId ||
      e.id.toLowerCase() === cleanId.toLowerCase() ||
      (e.slug && e.slug.toLowerCase() === cleanId.toLowerCase())
  );

  if (!match) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const icsBody = generateEventIcs(match);
  const safeFilename = (match.slug || match.id)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 80);

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}

