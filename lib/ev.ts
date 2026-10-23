import { deriveTags } from "./match";

export type EventCard = {
  id: string;
  title: string;
  organizer: string;
  city: string;
  venue: string;
  description: string;
  type: string;
  startsAt: string | null;
  endsAt: string | null;
  tags: string[];
  status: string;
  url: string;
  source?: "devpost" | "gdg" | "luma" | "campus" | string;
  scope?: "pakistan" | "global";
};

export function resolveEventUrl(e: any): string {
  // 1. Direct registrationUrl property
  if (e.registrationUrl && typeof e.registrationUrl === "string" && e.registrationUrl.startsWith("http")) {
    const clean = e.registrationUrl.trim();
    if (!clean.endsWith("lu.ma") && !clean.endsWith("luma.com/home") && !clean.endsWith("devpost.com")) {
      return clean;
    }
  }

  // 2. Direct url property (if not generic lu.ma or devpost)
  if (e.url && typeof e.url === "string" && e.url.startsWith("http")) {
    const clean = e.url.trim();
    if (!clean.endsWith("lu.ma") && !clean.endsWith("luma.com/home") && !clean.endsWith("devpost.com")) {
      return clean;
    }
  }

  // 3. Extract embedded URL from description (e.g. "Official Registration: https://...")
  if (e.description && typeof e.description === "string") {
    const match =
      e.description.match(/(?:Official Registration|Registration|URL|Host|Link):\s*(https?:\/\/[^\s\]]+)/i) ||
      e.description.match(/(https?:\/\/[^\s\]]+)/i);
    if (match) {
      const extracted = match[1].trim();
      if (!extracted.endsWith("lu.ma") && !extracted.endsWith("luma.com/home") && !extracted.endsWith("devpost.com")) {
        return extracted;
      }
    }
  }

  // 4. Fallback search (never generic lu.ma)
  const title = (e.title || "tech event").replace(/[^\w\s]/g, "");
  const city = (e.city || "Pakistan").replace(/[^\w\s]/g, "");
  return `https://www.google.com/search?q=${encodeURIComponent(`${title} ${city} hackathon registration`)}`;
}

export function toCard(e: any): EventCard {
  const title = e.title ?? "Untitled";
  const rawDesc = e.description ?? "";
  const start = e.startTime ?? e.startsAt ?? null;
  const end = e.endTime ?? e.endsAt ?? null;
  const url = resolveEventUrl(e);
  const city = e.city ?? "Karachi";

  // Determine scope: Pakistan or Global
  const isGlobal =
    e.scope === "global" ||
    city.toLowerCase().includes("global") ||
    city.toLowerCase().includes("virtual") ||
    city.toLowerCase().includes("online");

  const scope: "pakistan" | "global" = isGlobal ? "global" : "pakistan";

  // Determine source
  const source =
    e.source ??
    (url.includes("devpost.com")
      ? "devpost"
      : url.includes("gdg.community.dev")
      ? "gdg"
      : url.includes("lu.ma")
      ? "luma"
      : "campus");

  // Clean description removing the appended URL metadata
  const cleanDescription = rawDesc
    .replace(/(?:\n\nOfficial Registration:.*$)/i, "")
    .replace(/(?:Official Registration:.*$)/i, "")
    .trim();
  const startsAt = start ? new Date(start).toISOString() : null;
  const endsAt = end ? new Date(end).toISOString() : null;
  const isClosed = isRegistrationClosed({ startsAt, endsAt });

  return {
    id: String(e.id),
    title,
    organizer: e.organizer?.name ?? (typeof e.organizer === "string" ? e.organizer : "Community Desk"),
    city,
    venue: e.venue ?? (isGlobal ? "Online (Virtual)" : `${city}, Pakistan`),
    description: cleanDescription || `${title} in ${city}. Register directly with the host.`,
    type: String(e.type ?? e.category ?? "HACKATHON"),
    startsAt,
    endsAt,
    tags: Array.isArray(e.tags) && e.tags.length > 0 ? e.tags : deriveTags(title, rawDesc),
    status: isClosed ? "CLOSED" : "OPEN",
    url,
    source,
    scope,
  };
}

export function isRegistrationClosed(e: { startsAt?: string | null; endsAt?: string | null }): boolean {
  if (!e.startsAt && !e.endsAt) return false;
  const now = Date.now();
  if (e.startsAt) {
    const startTime = new Date(e.startsAt).getTime();
    if (!isNaN(startTime) && startTime <= now) {
      return true;
    }
  }
  if (e.endsAt) {
    const endTime = new Date(e.endsAt).getTime();
    if (!isNaN(endTime) && endTime <= now) {
      return true;
    }
  }
  return false;
}

export function fmtDate(iso: string | null) {
  if (!iso) return "TBA";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "TBA";
    return d.toLocaleString("en-GB", {
      timeZone: "Asia/Karachi",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "TBA";
  }
}