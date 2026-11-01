import curatedData from "../../prisma/data/curated-events.json";

export interface IngestedEventCandidate {
  externalId: string;
  slug: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  type: "HACKATHON" | "CONFERENCE" | "WORKSHOP" | "MEETUP" | "COMPETITION" | "TECH_TALK";
  mode: "IN_PERSON" | "ONLINE" | "HYBRID";
  organizer: string;
  registrationUrl: string;
  sourceUrl: string;
  tags: string[];
  startTime: Date | null;
  endTime: Date | null;
  registrationDeadline: Date | null;
  dateOnly: boolean;
  needsVerification: boolean;
  source: "DEVPOST" | "GDG" | "LUMA" | "CAMPUS" | "MANUAL";
  scope: "pakistan" | "global";
}

export function slugifyEventId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

export function isValidRegistrationUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, "");

    if (["lu.ma", "luma.com", "devpost.com", "forms.gle"].includes(hostname)) {
      if (!pathname || pathname === "" || pathname === "/" || pathname === "/home") {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function loadCuratedEvents(): IngestedEventCandidate[] {
  return (curatedData as Array<Record<string, unknown>>).map((raw) => {
    const id = String(raw.id || raw.externalId);
    const startTime = raw.startsAt ? new Date(String(raw.startsAt)) : null;
    const endTime = raw.endsAt ? new Date(String(raw.endsAt)) : null;
    const registrationDeadline = raw.registrationDeadline
      ? new Date(String(raw.registrationDeadline))
      : startTime;
    const rawSource = String(raw.source || "campus").toUpperCase();
    const source: IngestedEventCandidate["source"] =
      rawSource === "GDG"
        ? "GDG"
        : rawSource === "LUMA"
        ? "LUMA"
        : rawSource === "DEVPOST"
        ? "DEVPOST"
        : "CAMPUS";

    return {
      externalId: id,
      slug: slugifyEventId(`${raw.title}-${raw.city}-${id}`),
      title: String(raw.title),
      description: String(raw.description),
      city: String(raw.city),
      venue: String(raw.venue || `${raw.city}, Pakistan`),
      type: (String(raw.category || "HACKATHON").toUpperCase() as IngestedEventCandidate["type"]),
      mode: (String(raw.mode || "IN_PERSON").toUpperCase() as IngestedEventCandidate["mode"]),
      organizer: String(raw.organizer || "Community Desk"),
      registrationUrl: String(raw.registrationUrl),
      sourceUrl: String(raw.registrationUrl),
      tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
      startTime,
      endTime,
      registrationDeadline,
      dateOnly: false,
      needsVerification: !startTime,
      source,
      scope: raw.scope === "global" ? "global" : "pakistan",
    };
  });
}

