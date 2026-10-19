import { deriveTags } from "./match";

export type EventCard = {
  id: string; title: string; organizer: string; city: string; venue: string;
  description: string; type: string; startsAt: string | null; endsAt: string | null;
  tags: string[]; status: string;
};

export function toCard(e: any): EventCard {
  const title = e.title ?? "Untitled";
  const description = e.description ?? "";
  const start = e.startTime ?? null;
  const end = e.endTime ?? null;
  return {
    id: String(e.id),
    title,
    organizer: e.organizer?.name ?? "",
    city: e.city ?? "Remote",
    venue: e.venue ?? "",
    description,
    type: String(e.type ?? "EVENT"),
    startsAt: start ? new Date(start).toISOString() : null,
    endsAt: end ? new Date(end).toISOString() : null,
    tags: deriveTags(title, description),
    status: "OPEN",
  };
}

export function fmtDate(iso: string | null) {
  if (!iso) return "TBA";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Karachi", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}