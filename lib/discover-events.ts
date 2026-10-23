import { prisma } from "./prisma";
import { deriveTags } from "./match";

export interface DiscoveredEvent {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  category: "HACKATHON" | "CONFERENCE" | "WORKSHOP" | "MEETUP" | "COMPETITION" | "TECH_TALK";
  organizer: string;
  registrationUrl: string;
  tags: string[];
  startsAt: string | null;
  endsAt: string | null;
  source: "devpost" | "gdg" | "luma" | "campus";
  scope: "pakistan" | "global";
}

// In-memory cache with 1-hour TTL
let memoryCache: { events: DiscoveredEvent[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function isValidRegistrationUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, "");

    // STRICT VALIDATION RULE: Reject generic root domains
    if (["lu.ma", "luma.com", "devpost.com", "forms.gle"].includes(hostname)) {
      if (!pathname || pathname === "" || pathname === "/" || pathname === "/home") {
        return false;
      }
    }
    if (hostname === "docs.google.com" && pathname.startsWith("/forms") && (!pathname.includes("/d/") && pathname.length < 15)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Pipeline 1: Global Virtual Hackathons (Devpost Public API)
export async function fetchDevpostHackathons(): Promise<DiscoveredEvent[]> {
  try {
    const res = await fetch(
      "https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&challenge_type[]=online",
      {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const hackathons = data.hackathons || [];

    return hackathons
      .filter((h: any) => isValidRegistrationUrl(h.url))
      .map((h: any) => {
        const themes = Array.isArray(h.themes) ? h.themes.map((t: any) => t.name) : [];
        const tags = Array.from(new Set(["Virtual", "Hackathon", ...themes, ...deriveTags(h.title, "")])).slice(0, 5);

        return {
          id: `devpost_${h.id || Math.abs(hashCode(h.url))}`,
          title: h.title,
          description: `${h.title} — Global virtual online hackathon open to developers in Pakistan and worldwide.`,
          city: "Global • Virtual",
          venue: "Online (Devpost)",
          category: "HACKATHON" as const,
          organizer: h.organization_name || "Devpost Global",
          registrationUrl: h.url,
          tags,
          startsAt: parseUpcomingDate(h.submission_period_dates),
          endsAt: null,
          source: "devpost" as const,
          scope: "global" as const,
        };
      });
  } catch (err) {
    console.error("Devpost scanner error:", err);
    return [];
  }
}

// Pipeline 2: Pakistan Official GDG & Campus Chapters (Bevy Public API)
export async function fetchGdgPakistanEvents(): Promise<DiscoveredEvent[]> {
  try {
    const res = await fetch("https://gdg.community.dev/api/event/?status=Published", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];

    const pkCities = ["karachi", "lahore", "islamabad", "peshawar", "faisalabad", "rawalpindi", "multan", "quetta", "hyderabad"];
    const pkCampuses = [/\bned\b/i, /\bfast\b/i, /\bnust\b/i, /\bgiki\b/i, /\biba\b/i, /\bcomsats\b/i, /\bpucit\b/i, /\bhabib\b/i, /\buet\b/i];
    const now = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    return results
      .filter((ev: any) => {
        if (!isValidRegistrationUrl(ev.url)) return false;
        if (ev.start_date && ev.start_date < now) return false;

        const c = ev.chapter;
        if (!c) return false;
        if (c.country === "PK" || c.country_name?.toLowerCase() === "pakistan") return true;

        const loc = `${c.city || ""} ${c.chapter_location || ""} ${c.title || ""}`.toLowerCase();
        const cityMatch = pkCities.some((city) => loc.includes(city));
        const campusMatch = pkCampuses.some((rx) => rx.test(loc));
        return cityMatch || campusMatch;
      })
      .map((ev: any) => {
        const title = ev.title || "GDG Community Gathering";
        const city = ev.chapter?.city || "Lahore";
        const cat = title.toLowerCase().includes("hackathon")
          ? ("HACKATHON" as const)
          : title.toLowerCase().includes("devfest") || title.toLowerCase().includes("summit")
          ? ("CONFERENCE" as const)
          : ("MEETUP" as const);

        return {
          id: `gdg_${ev.id || Math.abs(hashCode(ev.url))}`,
          title,
          description: `${title} hosted by ${ev.chapter?.title || "GDG Pakistan"} in ${city}, Pakistan.`,
          city,
          venue: `${ev.chapter?.title || "Google Developer Groups"} • ${city}`,
          category: cat,
          organizer: ev.chapter?.title || "GDG Pakistan",
          registrationUrl: ev.url,
          tags: ["GDG", "Google Cloud", "Community", ...deriveTags(title, "")].slice(0, 5),
          startsAt: ev.start_date || null,
          endsAt: ev.end_date || null,
          source: "gdg" as const,
          scope: "pakistan" as const,
        };
      });
  } catch (err) {
    console.error("GDG scanner error:", err);
    return [];
  }
}

// Pipeline 3: Real Luma Pakistan Cities & Circles
export async function fetchLumaPakistanEvents(): Promise<DiscoveredEvent[]> {
  const cities = ["karachi", "lahore", "islamabad"];
  const allLuma: DiscoveredEvent[] = [];

  for (const city of cities) {
    try {
      const res = await fetch(`https://api.lu.ma/discover/get-paginated-events?city=${city}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const entries = data.entries || [];

      for (const entry of entries) {
        const ev = entry.event;
        if (!ev || !ev.url) continue;

        const specificUrl = `https://lu.ma/${ev.url}`;
        if (!isValidRegistrationUrl(specificUrl)) continue;

        const title = ev.name || "Community Meetup";
        const eventCity = capitalize(city);
        const cat = title.toLowerCase().includes("hack")
          ? ("HACKATHON" as const)
          : title.toLowerCase().includes("fest") || title.toLowerCase().includes("pitch") || title.toLowerCase().includes("summit")
          ? ("CONFERENCE" as const)
          : ("MEETUP" as const);

        allLuma.push({
          id: `luma_${ev.url}`,
          title,
          description: `${title} in ${eventCity}, Pakistan. Direct attendee passes and tickets verified on Luma.`,
          city: eventCity,
          venue: entry.geo_address?.city_state || `${eventCity}, Pakistan`,
          category: cat,
          organizer: entry.hosts?.[0]?.name || "Pakistan Tech Circle",
          registrationUrl: specificUrl,
          tags: ["Luma", "Networking", ...deriveTags(title, "")].slice(0, 5),
          startsAt: entry.start_at || null,
          endsAt: null,
          source: "luma" as const,
          scope: "pakistan" as const,
        });
      }
    } catch (err) {
      console.error(`Luma scanner error for ${city}:`, err);
    }
  }

  return allLuma;
}

// Pipeline 4: Campus & Collegiate Hackathons (Unstop Online Challenges)
export async function fetchCampusAndUnstopEvents(): Promise<DiscoveredEvent[]> {
  try {
    const res = await fetch(
      "https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&quickApply=0&types=online",
      {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.data?.data || [];

    return items
      .filter((item: any) => isValidRegistrationUrl(item.seo_url))
      .slice(0, 10)
      .map((item: any) => {
        const title = item.title || "Collegiate Coding Challenge";
        return {
          id: `unstop_${item.id || Math.abs(hashCode(item.seo_url))}`,
          title,
          description: `${title} hosted by ${item.organisation?.name || "Collegiate Desk"} on Unstop.`,
          city: "Global • Virtual",
          venue: "Online (Unstop Platform)",
          category: "HACKATHON" as const,
          organizer: item.organisation?.name || "Campus Desk",
          registrationUrl: item.seo_url,
          tags: ["Campus", "Hackathon", "Coding", ...deriveTags(title, "")].slice(0, 5),
          startsAt: item.start_date || null,
          endsAt: null,
          source: "campus" as const,
          scope: "global" as const,
        };
      });
  } catch (err) {
    console.error("Unstop scanner error:", err);
    return [];
  }
}

// Master Aggregator with Deduplication and Database Persistence
export async function discoverAllEvents(bypassCache = false): Promise<{
  events: DiscoveredEvent[];
  sources: { devpost: number; gdg: number; luma: number; campus: number };
}> {
  if (!bypassCache && memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
    const devpost = memoryCache.events.filter((e) => e.source === "devpost").length;
    const gdg = memoryCache.events.filter((e) => e.source === "gdg").length;
    const luma = memoryCache.events.filter((e) => e.source === "luma").length;
    const campus = memoryCache.events.filter((e) => e.source === "campus").length;
    return {
      events: memoryCache.events,
      sources: { devpost, gdg, luma, campus },
    };
  }

  const [devpostEvents, gdgEvents, lumaEvents, campusEvents] = await Promise.all([
    fetchDevpostHackathons(),
    fetchGdgPakistanEvents(),
    fetchLumaPakistanEvents(),
    fetchCampusAndUnstopEvents(),
  ]);

  const rawList = [...devpostEvents, ...gdgEvents, ...lumaEvents, ...campusEvents];

  // Deduplicate strictly by normalized registration URL
  const seenUrls = new Set<string>();
  const uniqueEvents: DiscoveredEvent[] = [];

  for (const ev of rawList) {
    if (!isValidRegistrationUrl(ev.registrationUrl)) continue;
    const norm = ev.registrationUrl.toLowerCase().replace(/\/+$/, "");
    if (seenUrls.has(norm)) continue;
    seenUrls.add(norm);
    uniqueEvents.push(ev);
  }

  // Sort by start date (upcoming first)
  uniqueEvents.sort((a, b) => {
    const timeA = a.startsAt ? new Date(a.startsAt).getTime() : Infinity;
    const timeB = b.startsAt ? new Date(b.startsAt).getTime() : Infinity;
    return timeA - timeB;
  });

  memoryCache = {
    events: uniqueEvents,
    timestamp: Date.now(),
  };

  // Sync to Neon DB asynchronously
  syncDiscoveredEventsToPrisma(uniqueEvents).catch((err) => {
    console.error("Async Prisma sync error:", err);
  });

  const devpost = uniqueEvents.filter((e) => e.source === "devpost").length;
  const gdg = uniqueEvents.filter((e) => e.source === "gdg").length;
  const luma = uniqueEvents.filter((e) => e.source === "luma").length;
  const campus = uniqueEvents.filter((e) => e.source === "campus").length;

  return {
    events: uniqueEvents,
    sources: { devpost, gdg, luma, campus },
  };
}

// Sync to PostgreSQL with Prisma
export async function syncDiscoveredEventsToPrisma(events: DiscoveredEvent[]) {
  try {
    const organizer = await (prisma as any).organizer.upsert({
      where: { id: "org_radar_scanner" },
      update: { name: "HackScout Autonomous Radar" },
      create: {
        id: "org_radar_scanner",
        name: "HackScout Autonomous Radar",
      },
    });

    // Delete fake mock events
    try {
      await (prisma as any).event.deleteMany({
        where: {
          OR: [
            { id: { in: ["event_ned_techfest_2026", "event_gdg_kolachi_2026", "event_softec_2026", "event_nust_codesprint_2026"] } },
            { description: { contains: "https://lu.ma\n" } },
            { description: { endsWith: "https://lu.ma" } },
            { description: { contains: "https://luma.com/home" } },
          ],
        },
      });
    } catch {}

    // Upsert discovered events
    for (const ev of events) {
      const startTime = ev.startsAt ? new Date(ev.startsAt) : new Date(Date.now() + 7 * 86400 * 1000);
      const endTime = ev.endsAt ? new Date(ev.endsAt) : new Date(startTime.getTime() + 48 * 3600 * 1000);
      const fullDescription = `${ev.description}\n\nOfficial Registration: ${ev.registrationUrl}`;

      await (prisma as any).event.upsert({
        where: { id: ev.id },
        update: {
          title: ev.title,
          description: fullDescription,
          city: ev.city,
          venue: ev.venue,
          type: ev.category,
          startTime,
          endTime,
        },
        create: {
          id: ev.id,
          title: ev.title,
          description: fullDescription,
          city: ev.city,
          venue: ev.venue,
          type: ev.category,
          startTime,
          endTime,
          organizerId: organizer.id,
        },
      });
    }
  } catch (err) {
    console.warn("Prisma sync warning:", err);
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function parseUpcomingDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split("-");
    const endPart = parts[parts.length - 1].trim();
    const parsed = new Date(endPart);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  } catch {}
  return null;
}
