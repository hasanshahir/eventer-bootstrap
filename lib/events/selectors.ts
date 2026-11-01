import type { EventCard } from "@/lib/ev";

/**
 * Pure, deterministic selectors used across `/`, `/cities`, `/cities/[slug]`, and `Feed`
 * so hero counters, source ledger counters, format tiles, and city desk counts never
 * contradict each other (fixes F-05).
 */

function resolveNowMs(now?: number | Date): number {
  if (now instanceof Date) return now.getTime();
  if (typeof now === "number") return now;
  return Date.now();
}

export function getEffectiveDeadlineMs(
  event: Pick<EventCard, "registrationDeadline" | "startsAt" | "endsAt">
): number {
  const deadlineRaw =
    event.registrationDeadline || event.endsAt || event.startsAt;
  if (!deadlineRaw) return Infinity;
  const parsed = new Date(deadlineRaw).getTime();
  return Number.isNaN(parsed) ? Infinity : parsed;
}

export function isEventOpenAt(
  event: Pick<
    EventCard,
    | "registrationDeadline"
    | "startsAt"
    | "endsAt"
    | "status"
    | "moderationStatus"
  >,
  now?: number | Date
): boolean {
  const nowMs = resolveNowMs(now);
  const mod = event.moderationStatus;
  if (mod && mod !== "APPROVED") {
    return false;
  }
  if (
    event.status === "ARCHIVED" ||
    event.status === "REJECTED" ||
    event.status === "PENDING"
  ) {
    return false;
  }
  const refRaw = event.registrationDeadline || event.endsAt || event.startsAt;
  if (!refRaw) {
    return event.status !== "CLOSED";
  }
  const refTime = new Date(refRaw);
  if (Number.isNaN(refTime.getTime())) return true;
  const endOfDay = new Date(refTime);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() >= nowMs;
}

export function isVirtualOrGlobalEvent(
  event: Pick<EventCard, "city" | "scope">
): boolean {
  const c = (event.city || "").trim().toLowerCase();
  return (
    event.scope === "global" ||
    c === "online" ||
    c === "remote" ||
    c.includes("global") ||
    c.includes("virtual") ||
    c.includes("online")
  );
}

export function countOpenAndArchived(
  events: EventCard[],
  now?: number | Date
): { open: number; archived: number; total: number } {
  const nowMs = resolveNowMs(now);
  let open = 0;
  let archived = 0;
  for (const ev of events) {
    if (isEventOpenAt(ev, nowMs)) {
      open++;
    } else {
      archived++;
    }
  }
  return { open, archived, total: events.length };
}

export function countBySource(
  events: EventCard[],
  options: { openOnly?: boolean; now?: number | Date; nowMs?: number } = {}
): {
  devpost: number;
  gdg: number;
  luma: number;
  campus: number;
  manual: number;
} {
  const nowMs = resolveNowMs(options.now ?? options.nowMs);
  let devpost = 0;
  let gdg = 0;
  let luma = 0;
  let campus = 0;
  let manual = 0;

  for (const e of events) {
    if (options.openOnly && !isEventOpenAt(e, nowMs)) continue;
    const src = (e.source || "").toLowerCase();
    const url = (e.url || "").toLowerCase();
    if (src === "devpost" || url.includes("devpost.com")) devpost++;
    else if (src === "gdg" || url.includes("gdg.community.dev")) gdg++;
    else if (src === "luma" || url.includes("lu.ma")) luma++;
    else if (src === "manual") manual++;
    else campus++;
  }

  return { devpost, gdg, luma, campus, manual };
}

export function countByFormat(
  events: EventCard[],
  options: { openOnly?: boolean; now?: number | Date; nowMs?: number } = {}
): {
  HACKATHON: number;
  CONFERENCE: number;
  WORKSHOP: number;
  MEETUP: number;
  COMPETITION: number;
  TECH_TALK: number;
} {
  const nowMs = resolveNowMs(options.now ?? options.nowMs);
  const counts = {
    HACKATHON: 0,
    CONFERENCE: 0,
    WORKSHOP: 0,
    MEETUP: 0,
    COMPETITION: 0,
    TECH_TALK: 0,
  };

  for (const e of events) {
    if (options.openOnly && !isEventOpenAt(e, nowMs)) continue;
    const t = (e.type || "MEETUP").toUpperCase();
    if (t in counts) {
      counts[t as keyof typeof counts]++;
    } else {
      counts.MEETUP++;
    }
  }

  return counts;
}

export function countByCityDesk(
  events: EventCard[],
  options: { openOnly?: boolean; now?: number | Date; nowMs?: number } = {}
): Record<string, number> {
  const nowMs = resolveNowMs(options.now ?? options.nowMs);
  const counts: Record<string, number> = {};

  for (const e of events) {
    if (options.openOnly && !isEventOpenAt(e, nowMs)) continue;
    const c = (e.city || "").trim().toLowerCase();
    if (isVirtualOrGlobalEvent(e)) {
      counts["online"] = (counts["online"] ?? 0) + 1;
      counts["online / virtual"] = (counts["online / virtual"] ?? 0) + 1;
    } else if (c) {
      counts[c] = (counts[c] ?? 0) + 1;
      if (
        (c === "peshawar" || c.includes("topi")) &&
        ((e.venue || "").toLowerCase().includes("giki") ||
          (e.venue || "").toLowerCase().includes("topi"))
      ) {
        counts["topi"] = (counts["topi"] ?? 0) + 1;
        counts["topi (giki)"] = (counts["topi (giki)"] ?? 0) + 1;
      }
    }
  }

  return counts;
}

/**
 * Sorts events deadline-first (fixes F-06):
 * 1. Open events come first, ordered ascending by `registrationDeadline ?? startsAt`.
 * 2. Closed/archived events follow, ordered descending by `startsAt`.
 */
export function sortEventsDeadlineFirst(
  events: EventCard[],
  now?: number | Date
): EventCard[] {
  const nowMs = resolveNowMs(now);
  return [...events].sort((a, b) => {
    const aOpen = isEventOpenAt(a, nowMs);
    const bOpen = isEventOpenAt(b, nowMs);

    if (aOpen && !bOpen) return -1;
    if (!aOpen && bOpen) return 1;

    if (aOpen && bOpen) {
      const aDeadline = a.registrationDeadline
        ? new Date(a.registrationDeadline).getTime()
        : a.startsAt
          ? new Date(a.startsAt).getTime()
          : Infinity;
      const bDeadline = b.registrationDeadline
        ? new Date(b.registrationDeadline).getTime()
        : b.startsAt
          ? new Date(b.startsAt).getTime()
          : Infinity;
      return aDeadline - bDeadline;
    }

    const aStart = a.startsAt ? new Date(a.startsAt).getTime() : 0;
    const bStart = b.startsAt ? new Date(b.startsAt).getTime() : 0;
    return bStart - aStart;
  });
}
