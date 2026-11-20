import { NextResponse } from "next/server";
import { getPublicEvents } from "@/lib/events/queries";

export const revalidate = 300;

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://eventer-bootstrap.vercel.app";
  const events = await getPublicEvents();

  const itemsXml = events
    .slice(0, 100)
    .map((ev) => {
      const slugOrId = encodeURIComponent(ev.slug || ev.id);
      const link = `${siteUrl}/events/${slugOrId}`;
      const pubDate = ev.startsAt
        ? new Date(ev.startsAt).toUTCString()
        : new Date().toUTCString();
      const categories = [ev.city, ev.type, ...(ev.tags || [])]
        .filter(Boolean)
        .map((c) => `<category>${escapeXml(String(c))}</category>`)
        .join("");

      return `    <item>
      <title>${escapeXml(`${ev.title} (${ev.city})`)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${escapeXml(pubDate)}</pubDate>
      <description>${escapeXml(ev.description || `${ev.type} in ${ev.city} organized by ${ev.organizer}`)}</description>
      ${categories}
    </item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Eventr — Pakistan’s Developer &amp; Tech Event Radar</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Every hackathon, developer conference, workshop, and meetup across Pakistan. Curated by city, sorted by registration deadlines.</description>
    <language>en-pk</language>
    <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>
    <atom:link href="${escapeXml(`${siteUrl}/events/feed.xml`)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
