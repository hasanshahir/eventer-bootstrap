import { deriveTags } from "./match";

export type EventCard = {
  id: string;
  slug?: string;
  title: string;
  organizer: string;
  organizerVerified?: boolean;
  city: string;
  venue: string;
  description: string;
  type: string;
  mode?: "IN_PERSON" | "ONLINE" | "HYBRID" | string;
  startsAt: string | null;
  endsAt: string | null;
  registrationDeadline?: string | null;
  dateOnly?: boolean;
  capacity?: number | null;
  tags: string[];
  status: string;
  moderationStatus?: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED" | string;
  url: string;
  source?: "devpost" | "gdg" | "luma" | "campus" | "manual" | string;
  scope?: "pakistan" | "global";
};

export interface RawEventLike {
  id?: string | number | null;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  city?: string | null;
  venue?: string | null;
  type?: string | null;
  category?: string | null;
  mode?: string | null;
  startTime?: Date | string | null;
  startsAt?: Date | string | null;
  endTime?: Date | string | null;
  endsAt?: Date | string | null;
  registrationDeadline?: Date | string | null;
  dateOnly?: boolean | null;
  capacity?: number | null;
  status?: string | null;
  registrationUrl?: string | null;
  sourceUrl?: string | null;
  url?: string | null;
  tags?: string[] | null;
  source?: string | null;
  scope?: string | null;
  organizer?: { name?: string | null; verified?: boolean | null } | string | null;
}

export function resolveEventUrl(e: RawEventLike): string {
  if (
    e.registrationUrl &&
    typeof e.registrationUrl === "string" &&
    e.registrationUrl.startsWith("http")
  ) {
    const clean = e.registrationUrl.trim();
    if (
      !clean.endsWith("lu.ma") &&
      !clean.endsWith("luma.com/home") &&
      !clean.endsWith("devpost.com")
    ) {
      return clean;
    }
  }

  if (e.url && typeof e.url === "string" && e.url.startsWith("http")) {
    const clean = e.url.trim();
    if (
      !clean.endsWith("lu.ma") &&
      !clean.endsWith("luma.com/home") &&
      !clean.endsWith("devpost.com")
    ) {
      return clean;
    }
  }

  if (e.description && typeof e.description === "string") {
    const match =
      e.description.match(
        /(?:Official Registration|Registration|URL|Host|Link):\s*(https?:\/\/[^\s\]]+)/i
      ) || e.description.match(/(https?:\/\/[^\s\]]+)/i);
    if (match) {
      const extracted = match[1].trim();
      if (
        !extracted.endsWith("lu.ma") &&
        !extracted.endsWith("luma.com/home") &&
        !extracted.endsWith("devpost.com")
      ) {
        return extracted;
      }
    }
  }

  if (e.sourceUrl && typeof e.sourceUrl === "string" && e.sourceUrl.startsWith("http")) {
    return e.sourceUrl.trim();
  }

  const slug = e.slug || String(e.id || "event");
  return `/events/${encodeURIComponent(slug)}`;
}

export function toCard(e: RawEventLike): EventCard {
  const title = e.title ?? "Untitled";
  const rawDesc = e.description ?? "";
  const start = e.startTime ?? e.startsAt ?? null;
  const end = e.endTime ?? e.endsAt ?? null;
  const deadline = e.registrationDeadline ?? null;
  const url = resolveEventUrl(e);
  const city = e.city ?? "Karachi";

  const isGlobal =
    e.scope === "global" ||
    e.mode === "ONLINE" ||
    city.toLowerCase().includes("global") ||
    city.toLowerCase().includes("virtual") ||
    city.toLowerCase().includes("online");

  const scope: "pakistan" | "global" = isGlobal ? "global" : "pakistan";

  const rawSource = (e.source ?? "").toString().toLowerCase();
  const source =
    rawSource ||
    (url.includes("devpost.com")
      ? "devpost"
      : url.includes("gdg.community.dev")
        ? "gdg"
        : url.includes("lu.ma")
          ? "luma"
          : "campus");

  const cleanDescription = rawDesc
    .replace(/(?:\n\nOfficial Registration:.*$)/i, "")
    .replace(/(?:Official Registration:.*$)/i, "")
    .trim();

  const startsAt = start ? new Date(start).toISOString() : null;
  const endsAt = end ? new Date(end).toISOString() : null;
  const registrationDeadline = deadline ? new Date(deadline).toISOString() : null;
  const moderationStatus = e.status ?? "APPROVED";
  const isClosed = isRegistrationClosed({
    startsAt,
    endsAt,
    registrationDeadline,
    moderationStatus,
  });

  const organizerName =
    typeof e.organizer === "string"
      ? e.organizer
      : e.organizer?.name || "Community Desk";
  const organizerVerified =
    typeof e.organizer === "object" && e.organizer !== null
      ? Boolean(e.organizer.verified)
      : false;

  const dateOnly =
    typeof e.dateOnly === "boolean"
      ? e.dateOnly
      : Boolean(startsAt && startsAt.endsWith("T00:00:00.000Z"));

  return {
    id: String(e.id ?? ""),
    slug: e.slug ?? String(e.id ?? ""),
    title,
    organizer: organizerName,
    organizerVerified,
    city,
    venue: e.venue ?? (isGlobal ? "Online (Virtual)" : `${city}, Pakistan`),
    description:
      cleanDescription || `${title} in ${city}. Register directly with the host.`,
    type: String(e.type ?? e.category ?? "HACKATHON").toUpperCase(),
    mode: e.mode ?? (isGlobal ? "ONLINE" : "IN_PERSON"),
    startsAt,
    endsAt,
    registrationDeadline,
    dateOnly,
    capacity: e.capacity ?? null,
    tags:
      Array.isArray(e.tags) && e.tags.length > 0
        ? e.tags
        : deriveTags(title, rawDesc),
    status: isClosed ? "CLOSED" : "OPEN",
    moderationStatus,
    url,
    source,
    scope,
  };
}

export function isRegistrationClosed(e: {
  startsAt?: string | null;
  endsAt?: string | null;
  registrationDeadline?: string | null;
  moderationStatus?: string | null;
}): boolean {
  if (e.moderationStatus === "ARCHIVED" || e.moderationStatus === "REJECTED") {
    return true;
  }
  const refIso = e.registrationDeadline || e.endsAt || e.startsAt;
  if (!refIso) return false;
  const refDate = new Date(refIso);
  if (Number.isNaN(refDate.getTime())) return false;
  const endOfDay = new Date(refDate);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() < Date.now();
}

export function fmtDate(iso: string | null, dateOnly = false): string {
  if (!iso) return "TBA";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "TBA";
    const isMidnightUtc = iso.endsWith("T00:00:00.000Z");
    if (dateOnly || isMidnightUtc) {
      return d.toLocaleDateString("en-GB", {
        timeZone: "Asia/Karachi",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
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
