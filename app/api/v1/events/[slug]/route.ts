import { NextResponse } from "next/server";
import { getPublicEvents } from "@/lib/events/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const cleanSlug = decodeURIComponent(slug || "").trim();

  const events = await getPublicEvents();
  const event = events.find(
    (e) =>
      e.slug === cleanSlug ||
      e.id === cleanSlug ||
      (e.slug && e.slug.toLowerCase() === cleanSlug.toLowerCase()) ||
      e.id.toLowerCase() === cleanSlug.toLowerCase()
  );

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    event,
  });
}

