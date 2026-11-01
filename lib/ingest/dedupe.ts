import type { IngestedEventCandidate } from "./curated";

export function normalizeUrlForDedupe(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.trim());
    u.hash = "";
    for (const k of Array.from(u.searchParams.keys())) {
      if (k.toLowerCase().startsWith("utm_") || k === "ref") {
        u.searchParams.delete(k);
      }
    }
    return `${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, "").toLowerCase()}${u.search}`;
  } catch {
    return rawUrl.trim().toLowerCase().replace(/\/+$/, "");
  }
}

export function computeTitleCityMonthKey(ev: {
  title: string;
  city: string;
  startTime: Date | null;
}): string {
  const normTitle = ev.title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normCity = ev.city.toLowerCase().replace(/[^a-z0-9]/g, "");
  const yearMonth = ev.startTime
    ? `${ev.startTime.getUTCFullYear()}-${String(
        ev.startTime.getUTCMonth() + 1
      ).padStart(2, "0")}`
    : "unknown";
  return `${normTitle}::${normCity}::${yearMonth}`;
}

/**
 * Deduplicates candidate events across sources (Devpost, GDG, Luma, Curated)
 * by normalized registration URL (when specific to an event path) and by
 * `(normalizedTitle, normalizedCity, YYYY-MM)` so cross-posted events merge cleanly (Requirement #3).
 */
export function deduplicateIngestedEvents(
  candidates: IngestedEventCandidate[]
): IngestedEventCandidate[] {
  const seenSpecificUrls = new Set<string>();
  const seenCompositeKeys = new Set<string>();
  const unique: IngestedEventCandidate[] = [];

  for (const ev of candidates) {
    const compositeKey = computeTitleCityMonthKey(ev);
    if (seenCompositeKeys.has(compositeKey)) {
      continue;
    }

    const normUrl = normalizeUrlForDedupe(ev.registrationUrl);
    // Only deduplicate on URL if it has a path beyond a university homepage
    const hasSpecificPath = normUrl.includes("/") && !normUrl.endsWith(".edu.pk");
    if (hasSpecificPath && seenSpecificUrls.has(normUrl)) {
      continue;
    }

    seenCompositeKeys.add(compositeKey);
    if (hasSpecificPath) {
      seenSpecificUrls.add(normUrl);
    }
    unique.push(ev);
  }

  return unique;
}

