import { deriveTags } from "../match";
import { parseSubmissionPeriodDates } from "./dates";
import {
  type IngestedEventCandidate,
  isValidRegistrationUrl,
  slugifyEventId,
} from "./curated";

interface RawDevpostHackathon {
  id?: string | number;
  url: string;
  title?: string;
  submission_period_dates?: string;
  themes?: { name: string }[];
  organization_name?: string;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export async function fetchDevpostEvents(): Promise<IngestedEventCandidate[]> {
  try {
    const res = await fetch(
      "https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&challenge_type[]=online",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { hackathons?: RawDevpostHackathon[] };
    const hackathons = data.hackathons || [];
    const JAN_1_2026_MS = new Date("2026-01-01T00:00:00.000Z").getTime();

    const results: IngestedEventCandidate[] = [];

    for (const h of hackathons) {
      if (!isValidRegistrationUrl(h.url)) continue;
      const title = (h.title || "").trim();
      if (!title) continue;
      if (/\b(2021|2022|2023|2024|2025)\b/i.test(title)) continue;

      const parsedDates = parseSubmissionPeriodDates(h.submission_period_dates);
      const refTime =
        parsedDates.registrationDeadline?.getTime() ??
        parsedDates.endTime?.getTime() ??
        parsedDates.startTime?.getTime();

      if (refTime !== undefined && refTime < JAN_1_2026_MS) {
        continue;
      }

      const themes = Array.isArray(h.themes)
        ? h.themes.map((t) => t.name)
        : [];
      const tags = Array.from(
        new Set(["Virtual", "Hackathon", ...themes, ...deriveTags(title, "")])
      ).slice(0, 6);

      const externalId = `devpost_${h.id || Math.abs(hashCode(h.url))}`;
      results.push({
        externalId,
        slug: slugifyEventId(`${title}-${externalId}`),
        title,
        description: `${title} — Global virtual online hackathon open to developers in Pakistan and worldwide.`,
        city: "Global • Virtual",
        venue: "Online (Devpost)",
        type: "HACKATHON",
        mode: "ONLINE",
        organizer: h.organization_name || "Devpost Global",
        registrationUrl: h.url,
        sourceUrl: h.url,
        tags,
        startTime: parsedDates.startTime,
        endTime: parsedDates.endTime,
        registrationDeadline: parsedDates.registrationDeadline,
        dateOnly: parsedDates.dateOnly,
        needsVerification: parsedDates.needsVerification,
        source: "DEVPOST",
        scope: "global",
      });
    }

    return results;
  } catch (err) {
    console.error("Devpost ingest error:", err);
    return [];
  }
}

