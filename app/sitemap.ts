import type { MetadataRoute } from "next";
import { ALL_CITY_DESKS } from "@/lib/constants/geo";
import { getPublicEvents } from "@/lib/events/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://eventer-bootstrap.vercel.app";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/cities`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/events`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/organizer/new`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/passport`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const cityRoutes: MetadataRoute.Sitemap = ALL_CITY_DESKS.map((desk) => ({
    url: `${baseUrl}/cities/${encodeURIComponent(desk.slug)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const events = await getPublicEvents();
  const eventRoutes: MetadataRoute.Sitemap = events.map((ev) => ({
    url: `${baseUrl}/events/${encodeURIComponent(ev.slug || ev.id)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.75,
  }));

  return [...staticRoutes, ...cityRoutes, ...eventRoutes];
}

