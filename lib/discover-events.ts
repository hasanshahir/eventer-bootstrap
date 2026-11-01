import {
  loadCuratedEvents,
  isValidRegistrationUrl,
  type IngestedEventCandidate,
} from "./ingest/curated";
import { fetchDevpostEvents } from "./ingest/devpost";
import {
  fetchGdgEvents,
  normalizePakistanCity as normalizeCityName,
} from "./ingest/gdg";
import { fetchLumaEvents } from "./ingest/luma";
import { deduplicateIngestedEvents } from "./ingest/dedupe";
import { runIngestionPipeline } from "./ingest/run";

export { isValidRegistrationUrl, normalizeCityName };

export interface DiscoveredEvent {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  category:
    | "HACKATHON"
    | "CONFERENCE"
    | "WORKSHOP"
    | "MEETUP"
    | "COMPETITION"
    | "TECH_TALK";
  organizer: string;
  registrationUrl: string;
  tags: string[];
  startsAt: string | null;
  endsAt: string | null;
  registrationDeadline?: string | null;
  source: "devpost" | "gdg" | "luma" | "campus";
  scope: "pakistan" | "global";
}

function toDiscoveredEvent(e: IngestedEventCandidate): DiscoveredEvent {
  const lowerSource = e.source.toLowerCase();
  const source: DiscoveredEvent["source"] =
    lowerSource === "devpost" ||
    lowerSource === "gdg" ||
    lowerSource === "luma"
      ? lowerSource
      : "campus";

  return {
    id: e.externalId,
    title: e.title,
    description: e.description,
    city: e.city,
    venue: e.venue,
    category: e.type,
    organizer: e.organizer,
    registrationUrl: e.registrationUrl,
    tags: e.tags,
    startsAt: e.startTime ? e.startTime.toISOString() : null,
    endsAt: e.endTime ? e.endTime.toISOString() : null,
    registrationDeadline: e.registrationDeadline
      ? e.registrationDeadline.toISOString()
      : null,
    source,
    scope: e.scope,
  };
}

export const PAKISTAN_2026_CURATED_EVENTS: DiscoveredEvent[] =
  loadCuratedEvents().map(toDiscoveredEvent);

export async function fetchDevpostHackathons(): Promise<DiscoveredEvent[]> {
  const list = await fetchDevpostEvents();
  return list.map(toDiscoveredEvent);
}

export async function fetchGdgPakistanEvents(): Promise<DiscoveredEvent[]> {
  const list = await fetchGdgEvents();
  return list.map(toDiscoveredEvent);
}

export async function fetchLumaPakistanEvents(): Promise<DiscoveredEvent[]> {
  const list = await fetchLumaEvents();
  return list.map(toDiscoveredEvent);
}

export async function discoverAllEvents(): Promise<{
  events: DiscoveredEvent[];
  total: number;
  cached: boolean;
}> {
  const [devpost, gdg, luma] = await Promise.allSettled([
    fetchDevpostEvents(),
    fetchGdgEvents(),
    fetchLumaEvents(),
  ]);

  const raw: IngestedEventCandidate[] = [
    ...loadCuratedEvents(),
    ...(devpost.status === "fulfilled" ? devpost.value : []),
    ...(gdg.status === "fulfilled" ? gdg.value : []),
    ...(luma.status === "fulfilled" ? luma.value : []),
  ];

  const deduplicated = deduplicateIngestedEvents(raw);
  const events = deduplicated.map(toDiscoveredEvent);
  return {
    events,
    total: events.length,
    cached: false,
  };
}

export async function syncDiscoveredEventsToPrisma() {
  return runIngestionPipeline({ includeLiveConnectors: false });
}
