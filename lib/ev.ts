import { deriveTags } from "./match";

export type SourcePlatform =
  | "Instagram"
  | "WhatsApp"
  | "Discord"
  | "Google Form"
  | "Devpost"
  | "Luma"
  | "Official Site";

export type EventCard = {
  id: string;
  title: string;
  organizer: string;
  city: string;
  venue: string;
  description: string;
  type: string;
  startsAt: string | null;
  endsAt: string | null;
  deadline: string | null;
  publishedAt: string;
  sourceUrl: string;
  sourcePlatform: SourcePlatform;
  prizePool?: string;
  coordinates: { lat: number; lng: number };
  tags: string[];
  status: string;
  distanceKm?: number;
};

// Known Pakistani City Coordinates
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Faisalabad: { lat: 31.4504, lng: 73.135 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Topi: { lat: 34.0706, lng: 72.6416 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Hyderabad: { lat: 25.396, lng: 68.3578 },
  Sukkur: { lat: 27.7052, lng: 68.8574 },
  Quetta: { lat: 30.1798, lng: 66.975 },
  Abbottabad: { lat: 34.1688, lng: 73.2215 },
  Gilgit: { lat: 35.9221, lng: 74.3087 },
  Remote: { lat: 30.3753, lng: 69.3451 },
};

// Scraped Pakistani Tech Events Feed
export const SCRAPED_EVENTS: EventCard[] = [
  {
    id: "scraped-1",
    title: "NED AI & DeepTech Hackathon 2026",
    organizer: "NED University CS Society",
    city: "Karachi",
    venue: "NED University, Main Campus, University Rd",
    description: "24-hour intense AI hackathon challenging students to build agentic workflows, robotics controllers, and LLM microservices. Mentors from top Karachi tech firms.",
    type: "HACKATHON",
    startsAt: "2026-11-14T09:00:00+05:00",
    endsAt: "2026-11-15T15:00:00+05:00",
    deadline: "2026-11-05T23:59:00+05:00",
    publishedAt: "2026-10-18T10:00:00+05:00",
    sourceUrl: "https://instagram.com/p/ned_ai_hackathon_26",
    sourcePlatform: "Instagram",
    prizePool: "PKR 500,000 + Incubation",
    coordinates: { lat: 24.9317, lng: 67.1147 },
    tags: ["AI/ML", "Python", "Next.js", "Hackathon"],
    status: "OPEN",
  },
  {
    id: "scraped-2",
    title: "GDG Kolachi DevFest 2026",
    organizer: "Google Developer Groups Karachi",
    city: "Karachi",
    venue: "Karachi Expo Centre, Hall 3",
    description: "Pakistan's largest community developer conference with technical tracks in Gemini AI, Flutter, Cloud, and Agentic Software. 1,000+ developers attending.",
    type: "CONFERENCE",
    startsAt: "2026-11-21T09:30:00+05:00",
    endsAt: "2026-11-21T18:00:00+05:00",
    deadline: "2026-11-12T18:00:00+05:00",
    publishedAt: "2026-10-17T14:30:00+05:00",
    sourceUrl: "https://chat.whatsapp.com/invite/gdgkolachi2026",
    sourcePlatform: "WhatsApp",
    prizePool: "Google Swag & Cloud Credits",
    coordinates: { lat: 24.8988, lng: 67.0864 },
    tags: ["Flutter", "Google Cloud", "AI/ML", "Android"],
    status: "OPEN",
  },
  {
    id: "scraped-3",
    title: "SOFTEC '26 National Hackathon",
    organizer: "FAST-NUCES Lahore",
    city: "Lahore",
    venue: "FAST-NUCES Lahore, Faisal Town",
    description: "The premier 36-hour competitive hackathon at FAST Lahore. Teams compete in FinTech, Web3, Generative AI, and Autonomous Systems tracks.",
    type: "HACKATHON",
    startsAt: "2026-11-27T09:00:00+05:00",
    endsAt: "2026-11-28T21:00:00+05:00",
    deadline: "2026-11-15T23:59:00+05:00",
    publishedAt: "2026-10-16T12:00:00+05:00",
    sourceUrl: "https://forms.gle/softec2026hackathon",
    sourcePlatform: "Google Form",
    prizePool: "PKR 1,000,000 Cash Pool",
    coordinates: { lat: 31.4815, lng: 74.303 },
    tags: ["Hackathon", "React", "TypeScript", "Python"],
    status: "OPEN",
  },
  {
    id: "scraped-4",
    title: "NUST Olympiad CodeSprint 2026",
    organizer: "NUST Science Society",
    city: "Islamabad",
    venue: "NUST H-12 Campus, Jinnah Auditorium",
    description: "12-hour high-speed algorithm and software build challenge. Algorithmic problem solving followed by an AI system implementation sprint.",
    type: "COMPETITION",
    startsAt: "2026-12-05T10:00:00+05:00",
    endsAt: "2026-12-05T22:00:00+05:00",
    deadline: "2026-11-25T23:59:00+05:00",
    publishedAt: "2026-10-15T09:00:00+05:00",
    sourceUrl: "https://discord.gg/nust-tech-olympiad",
    sourcePlatform: "Discord",
    prizePool: "PKR 350,000 + Tech Gadgets",
    coordinates: { lat: 33.6425, lng: 72.993 },
    tags: ["Algorithms", "Python", "C++", "AI/ML"],
    status: "OPEN",
  },
  {
    id: "scraped-5",
    title: "GIKI Netronix Hackathon 2026",
    organizer: "GIKI ACM Chapter",
    city: "Topi",
    venue: "GIK Institute, Topi, Swabi, KP",
    description: "All-Pakistan residential hackathon nestled in Topi. 48 hours of hardware-software hacking, IoT builds, and open innovation.",
    type: "HACKATHON",
    startsAt: "2026-12-12T10:00:00+05:00",
    endsAt: "2026-12-14T12:00:00+05:00",
    deadline: "2026-11-20T23:59:00+05:00",
    publishedAt: "2026-10-14T11:00:00+05:00",
    sourceUrl: "https://instagram.com/p/giki_netronix_26",
    sourcePlatform: "Instagram",
    prizePool: "PKR 750,000 + Shields",
    coordinates: { lat: 34.0706, lng: 72.6416 },
    tags: ["IoT", "Hardware", "Python", "Next.js"],
    status: "OPEN",
  },
  {
    id: "scraped-6",
    title: "PakDevs Virtual AI Sprint",
    organizer: "Pakistan Developer Community",
    city: "Remote",
    venue: "Online Discord / YouTube Live",
    description: "Nationwide remote hackathon open to all developers in Pakistan. Build and deploy agentic AI apps within 48 hours.",
    type: "HACKATHON",
    startsAt: "2026-11-07T18:00:00+05:00",
    endsAt: "2026-11-09T23:59:00+05:00",
    deadline: "2026-11-04T23:59:00+05:00",
    publishedAt: "2026-10-18T18:00:00+05:00",
    sourceUrl: "https://devpost.com/hackathons/pakdevs-ai-sprint",
    sourcePlatform: "Devpost",
    prizePool: "PKR 300,000 + Vercel Credits",
    coordinates: { lat: 30.3753, lng: 69.3451 },
    tags: ["AI/ML", "Next.js", "TypeScript", "Tailwind CSS"],
    status: "OPEN",
  },
];

// Haversine distance in Kilometers
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function toCard(e: any): EventCard {
  const title = e.title ?? "Untitled";
  const description = e.description ?? "";
  const start = e.startTime ?? null;
  const end = e.endTime ?? null;
  const city = e.city ?? "Karachi";
  const coords = CITY_COORDS[city] ?? CITY_COORDS["Remote"];

  return {
    id: String(e.id),
    title,
    organizer: e.organizer?.name ?? "Tech Community",
    city,
    venue: e.venue ?? city,
    description,
    type: String(e.type ?? "HACKATHON"),
    startsAt: start ? new Date(start).toISOString() : null,
    endsAt: end ? new Date(end).toISOString() : null,
    deadline: e.deadline ?? "2026-11-15T23:59:00+05:00",
    publishedAt: e.createdAt ?? new Date().toISOString(),
    sourceUrl: e.sourceUrl ?? "https://forms.gle/pakistan-tech-event",
    sourcePlatform: (e.sourcePlatform as SourcePlatform) ?? "Google Form",
    prizePool: e.prizePool ?? "Certificates & Prizes",
    coordinates: coords,
    tags: deriveTags(title, description),
    status: "OPEN",
  };
}

export function fmtDate(iso: string | null) {
  if (!iso) return "TBA";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDeadline(iso: string | null) {
  if (!iso) return "No deadline specified";
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffHours = Math.round((target - now) / (1000 * 60 * 60));

  const formatted = new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
  });

  if (diffHours < 0) return `Closed on ${formatted}`;
  if (diffHours <= 24) return `⚠️ Closes in ${diffHours}h (${formatted})`;
  const days = Math.round(diffHours / 24);
  return `Due in ${days} days (${formatted})`;
}
