import { deriveTags } from "../match";
import {
  type IngestedEventCandidate,
  isValidRegistrationUrl,
  slugifyEventId,
} from "./curated";
import { normalizePakistanCity } from "./gdg";

interface RawLumaEntry {
  start_at?: string;
  end_at?: string;
  event?: {
    url?: string;
    name?: string;
  };
  geo_address?: {
    country_code?: string;
    country?: string;
    city_state?: string;
    address?: string;
    city?: string;
  };
  hosts?: { name?: string }[];
}

export async function fetchLumaEvents(): Promise<IngestedEventCandidate[]> {
  const cities = ["karachi", "lahore", "islamabad"];
  const allLuma: IngestedEventCandidate[] = [];
  const JAN_1_2026_MS = new Date("2026-01-01T00:00:00.000Z").getTime();

  for (const city of cities) {
    try {
      const res = await fetch(
        `https://api.lu.ma/discover/get-paginated-events?city=${city}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) continue;
      const data = (await res.json()) as { entries?: RawLumaEntry[] };
      const entries = data.entries || [];

      for (const entry of entries) {
        const ev = entry.event;
        if (!ev || !ev.url) continue;

        const geo = entry.geo_address;
        if (geo?.country_code && geo.country_code !== "PK") continue;

        const isPak =
          geo?.country_code === "PK" ||
          geo?.country?.toLowerCase() === "pakistan" ||
          geo?.city_state?.toLowerCase().includes("pakistan") ||
          geo?.address?.toLowerCase().includes("pakistan") ||
          Boolean(
            ev.name &&
              /\b(karachi|lahore|islamabad|rawalpindi|peshawar|faisalabad|multan|quetta|hyderabad|sukkur)\b/i.test(
                ev.name
              )
          );

        if (!isPak) continue;

        const startDate = entry.start_at ? new Date(entry.start_at) : null;
        const endDate = entry.end_at ? new Date(entry.end_at) : null;
        if (startDate && !Number.isNaN(startDate.getTime())) {
          if (startDate.getTime() < JAN_1_2026_MS) continue;
        }

        const specificUrl = `https://lu.ma/${ev.url}`;
        if (!isValidRegistrationUrl(specificUrl)) continue;

        const title = ev.name || "Community Meetup";
        const realCity = normalizePakistanCity(geo?.city || city);
        const type: IngestedEventCandidate["type"] = title
          .toLowerCase()
          .includes("hack")
          ? "HACKATHON"
          : title.toLowerCase().includes("fest") ||
            title.toLowerCase().includes("pitch") ||
            title.toLowerCase().includes("summit")
          ? "CONFERENCE"
          : "MEETUP";

        const externalId = `luma_${ev.url}`;
        const validStart =
          startDate && !Number.isNaN(startDate.getTime()) ? startDate : null;
        const validEnd =
          endDate && !Number.isNaN(endDate.getTime()) ? endDate : null;

        allLuma.push({
          externalId,
          slug: slugifyEventId(`${title}-${realCity}-${externalId}`),
          title,
          description: `${title} in ${realCity}, Pakistan. Direct attendee passes verified on Luma.`,
          city: realCity,
          venue: geo?.city_state || `${realCity}, Pakistan`,
          type,
          mode: "IN_PERSON",
          organizer: entry.hosts?.[0]?.name || "Pakistan Tech Circle",
          registrationUrl: specificUrl,
          sourceUrl: specificUrl,
          tags: Array.from(
            new Set(["Luma", "Networking", ...deriveTags(title, "")])
          ).slice(0, 5),
          startTime: validStart,
          endTime: validEnd,
          registrationDeadline: validStart,
          dateOnly: false,
          needsVerification: !validStart,
          source: "LUMA",
          scope: "pakistan",
        });
      }
    } catch (err) {
      console.error(`Luma ingest error for ${city}:`, err);
    }
  }

  return allLuma;
}

