import { deriveTags } from "../match";
import {
  type IngestedEventCandidate,
  isValidRegistrationUrl,
  slugifyEventId,
} from "./curated";

interface RawGdgEvent {
  id?: string | number;
  url: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  chapter?: {
    country?: string;
    country_name?: string;
    city?: string;
    chapter_location?: string;
    title?: string;
  };
}

export function normalizePakistanCity(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (lower.includes("karachi") || lower.includes("kolachi")) return "Karachi";
  if (lower.includes("lahore")) return "Lahore";
  if (lower.includes("islamabad")) return "Islamabad";
  if (lower.includes("rawalpindi")) return "Rawalpindi";
  if (lower.includes("faisalabad")) return "Faisalabad";
  if (lower.includes("peshawar")) return "Peshawar";
  if (lower.includes("multan")) return "Multan";
  if (lower.includes("quetta")) return "Quetta";
  if (lower.includes("hyderabad") || lower.includes("jamshoro")) return "Hyderabad";
  if (lower.includes("sukkur")) return "Sukkur";
  if (lower.includes("topi") || lower.includes("giki")) return "Topi (GIKI)";
  if (lower.includes("abbottabad")) return "Abbottabad";
  if (lower.includes("gilgit")) return "Gilgit";
  if (lower.includes("sialkot")) return "Sialkot";
  if (lower.includes("gujranwala")) return "Gujranwala";
  if (!lower) return "Lahore";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export async function fetchGdgEvents(): Promise<IngestedEventCandidate[]> {
  try {
    const res = await fetch("https://gdg.community.dev/api/event/?status=Published", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: RawGdgEvent[] };
    const results = data.results || [];
    const JAN_1_2026_MS = new Date("2026-01-01T00:00:00.000Z").getTime();

    const pkCities = [
      "karachi",
      "kolachi",
      "lahore",
      "islamabad",
      "peshawar",
      "faisalabad",
      "rawalpindi",
      "multan",
      "quetta",
      "hyderabad",
      "sukkur",
      "abbottabad",
      "gilgit",
    ];
    const pkCampuses = [
      /\bned\b/i,
      /\bfast\b/i,
      /\bnust\b/i,
      /\bgiki\b/i,
      /\biba\b/i,
      /\bcomsats\b/i,
      /\bpucit\b/i,
      /\bhabib\b/i,
      /\buet\b/i,
    ];

    const candidates: IngestedEventCandidate[] = [];

    for (const ev of results) {
      if (!isValidRegistrationUrl(ev.url)) continue;

      const startDate = ev.start_date ? new Date(ev.start_date) : null;
      const endDate = ev.end_date ? new Date(ev.end_date) : null;
      if (startDate && !Number.isNaN(startDate.getTime())) {
        if (startDate.getTime() < JAN_1_2026_MS) continue;
      }

      const c = ev.chapter;
      if (!c) continue;
      const isPkCountry =
        c.country === "PK" || c.country_name?.toLowerCase() === "pakistan";
      const loc = `${c.city || ""} ${c.chapter_location || ""} ${c.title || ""}`.toLowerCase();
      const cityMatch = pkCities.some((city) => loc.includes(city));
      const campusMatch = pkCampuses.some((rx) => rx.test(loc));

      if (!isPkCountry && !cityMatch && !campusMatch) continue;

      const title = ev.title || "GDG Community Gathering";
      const city = normalizePakistanCity(c.city || c.title || "Lahore");
      const type: IngestedEventCandidate["type"] = title
        .toLowerCase()
        .includes("hackathon")
        ? "HACKATHON"
        : title.toLowerCase().includes("devfest") ||
          title.toLowerCase().includes("summit")
        ? "CONFERENCE"
        : "MEETUP";

      const externalId = `gdg_${ev.id || slugifyEventId(ev.url)}`;
      const validStart =
        startDate && !Number.isNaN(startDate.getTime()) ? startDate : null;
      const validEnd =
        endDate && !Number.isNaN(endDate.getTime()) ? endDate : null;

      candidates.push({
        externalId,
        slug: slugifyEventId(`${title}-${city}-${externalId}`),
        title,
        description: `${title} hosted by ${c.title || "GDG Pakistan"} in ${city}, Pakistan.`,
        city,
        venue: `${c.title || "Google Developer Groups"} • ${city}`,
        type,
        mode: "IN_PERSON",
        organizer: c.title || "GDG Pakistan",
        registrationUrl: ev.url,
        sourceUrl: ev.url,
        tags: Array.from(
          new Set(["GDG", "Google Cloud", "Community", ...deriveTags(title, "")])
        ).slice(0, 5),
        startTime: validStart,
        endTime: validEnd,
        registrationDeadline: validStart,
        dateOnly: false,
        needsVerification: !validStart,
        source: "GDG",
        scope: "pakistan",
      });
    }

    return candidates;
  } catch (err) {
    console.error("GDG ingest error:", err);
    return [];
  }
}

