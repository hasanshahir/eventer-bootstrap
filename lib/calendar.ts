import type { EventCard } from "./ev";

export interface CalendarEventInput {
  id?: string;
  title: string;
  description: string;
  city: string;
  venue?: string | null;
  organizer?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  dateOnly?: boolean;
  url?: string | null;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatUtcTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function formatDateOnlyValue(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) payload for an event (fixes F-04).
 * - Uses 2-hour default duration when `endsAt` is absent on timed events.
 * - Uses `VALUE=DATE` all-day format when `dateOnly` is true.
 */
export function generateEventIcs(
  event: EventCard | CalendarEventInput,
  now: Date = new Date()
): string {
  const start = event.startsAt
    ? new Date(event.startsAt)
    : new Date(now.getTime() + 7 * 86400 * 1000);
  const validStart = Number.isNaN(start.getTime()) ? now : start;

  const isDateOnly =
    Boolean(event.dateOnly) ||
    Boolean(event.startsAt && event.startsAt.endsWith("T00:00:00.000Z"));

  let dtStartLine: string;
  let dtEndLine: string;

  if (isDateOnly) {
    const rawEnd = event.endsAt ? new Date(event.endsAt) : null;
    // RFC 5545 DTEND for VALUE=DATE is exclusive (next calendar day)
    const exclusiveEnd =
      rawEnd && !Number.isNaN(rawEnd.getTime())
        ? new Date(rawEnd.getTime() + 86400 * 1000)
        : new Date(validStart.getTime() + 86400 * 1000);
    dtStartLine = `DTSTART;VALUE=DATE:${formatDateOnlyValue(validStart)}`;
    dtEndLine = `DTEND;VALUE=DATE:${formatDateOnlyValue(exclusiveEnd)}`;
  } else {
    const rawEnd = event.endsAt ? new Date(event.endsAt) : null;
    const validEnd =
      rawEnd &&
      !Number.isNaN(rawEnd.getTime()) &&
      rawEnd.getTime() > validStart.getTime()
        ? rawEnd
        : new Date(validStart.getTime() + 2 * 3600 * 1000);
    dtStartLine = `DTSTART:${formatUtcTimestamp(validStart)}`;
    dtEndLine = `DTEND:${formatUtcTimestamp(validEnd)}`;
  }

  const location = [event.venue, event.city, "Pakistan"]
    .filter(Boolean)
    .join(", ");
  const description = `${event.description}\n\nOrganizer: ${event.organizer}\nRegistration: ${event.url}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Eventr Pakistan//National Tech Radar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(event.id || event.title)}@eventr.pk`,
    `DTSTAMP:${formatUtcTimestamp(now)}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    ...(event.url?.startsWith("http") ? [`URL:${event.url}`] : []),
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}

/**
 * Builds a Google Calendar template URL with a 2-hour fallback duration when
 * `endsAt` is missing (fixes F-04).
 */
export function buildGoogleCalendarUrl(
  e: EventCard | CalendarEventInput
): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    location: [e.venue, e.city, "Pakistan"].filter(Boolean).join(", "),
    details: `${e.description}\n\nOfficial Host Registration:\n${e.url}`,
  });

  if (e.startsAt) {
    const start = new Date(e.startsAt);
    if (!Number.isNaN(start.getTime())) {
      const isDateOnly =
        Boolean(e.dateOnly) || e.startsAt.endsWith("T00:00:00.000Z");
      if (isDateOnly) {
        const end = e.endsAt
          ? new Date(new Date(e.endsAt).getTime() + 86400 * 1000)
          : new Date(start.getTime() + 86400 * 1000);
        params.set(
          "dates",
          `${formatDateOnlyValue(start)}/${formatDateOnlyValue(end)}`
        );
      } else {
        const rawEnd = e.endsAt ? new Date(e.endsAt) : null;
        const end =
          rawEnd &&
          !Number.isNaN(rawEnd.getTime()) &&
          rawEnd.getTime() > start.getTime()
            ? rawEnd
            : new Date(start.getTime() + 2 * 3600 * 1000);
        params.set(
          "dates",
          `${formatUtcTimestamp(start)}/${formatUtcTimestamp(end)}`
        );
      }
    }
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
