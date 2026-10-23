import { NextResponse } from "next/server";
import { deriveTags } from "@/lib/match";

export const dynamic = "force-dynamic";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Quetta", "Faisalabad", "Multan"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const PROMPT = `Extract a tech event from this announcement. Return ONLY JSON: {title, organizer, city, venue, startsAt (ISO 8601, assume Asia/Karachi, year 2026 if missing), endsAt, description (max 280 chars), tags (array, from: Next.js, React, Python, AI/ML, Flutter, Node.js, DevOps, Cybersecurity, Web3, UI/UX, Hackathon, Workshop, Career), type (HACKATHON|WORKSHOP|CONFERENCE|MEETUP|COMPETITION), registrationUrl}. Use null for unknown fields.`;

function mock(text: string, imageOnly: boolean) {
  if (imageOnly || !text.trim()) {
    return {
      title: "GDG Karachi AI Night",
      organizer: "GDG Karachi",
      city: "Karachi",
      venue: "NED University, Main Auditorium",
      startsAt: "2026-11-21T17:00:00+05:00",
      endsAt: "2026-11-21T21:00:00+05:00",
      description: "An evening of talks and live demos on Gemini, GenAI and building with Google AI tools.",
      tags: ["AI/ML", "Python", "Workshop"],
      type: "MEETUP",
      registrationUrl: null,
    };
  }
  const lines = text.split(/\r?\n/).map((l) => l.replace(/[*_~]/g, "").trim()).filter(Boolean);
  const title = (lines[0] ?? "Tech Event").slice(0, 100);
  const city = CITIES.find((c) => new RegExp(c, "i").test(text)) ?? null;
  const venueLine = lines.find((l) => /(^|\s)(venue|at|@)[:\s]/i.test(l));
  const venue = venueLine ? venueLine.replace(/.*?(venue|at|@)[:\s]+/i, "").trim() : null;
  let startsAt: string | null = null;
  const m1 = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:,?\s+(20\d\d))?/i);
  const m2 = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d\d))?/i);
  let day: number | null = null,
    mon: number | null = null,
    yr = 2026;
  if (m1) {
    day = +m1[1];
    mon = MONTHS.indexOf(m1[2].toLowerCase());
    if (m1[3]) yr = +m1[3];
  } else if (m2) {
    day = +m2[2];
    mon = MONTHS.indexOf(m2[1].toLowerCase());
    if (m2[3]) yr = +m2[3];
  }
  if (day !== null && mon !== null && mon >= 0) {
    const t = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    let h = 10,
      mi = 0;
    if (t) {
      h = (+t[1] % 12) + (t[3].toLowerCase() === "pm" ? 12 : 0);
      mi = t[2] ? +t[2] : 0;
    }
    startsAt = `${yr}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00+05:00`;
  }
  const url = text.match(/https?:\/\/\S+/)?.[0] ?? null;
  const tags = deriveTags(title, text);
  const type = /hackathon|competition|olympiad/i.test(text)
    ? "HACKATHON"
    : /workshop|bootcamp/i.test(text)
    ? "WORKSHOP"
    : /conference|summit|fest/i.test(text)
    ? "CONFERENCE"
    : "MEETUP";
  return {
    title,
    organizer: null,
    city,
    venue,
    startsAt,
    endsAt: null,
    description: text.replace(/\s+/g, " ").slice(0, 280),
    tags,
    type,
    registrationUrl: url,
  };
}

function normalize(e: any) {
  return {
    title: e?.title ?? "Untitled Event",
    organizer: e?.organizer ?? null,
    city: e?.city ?? null,
    venue: e?.venue ?? null,
    startsAt: e?.startsAt ?? null,
    endsAt: e?.endsAt ?? null,
    description: String(e?.description ?? "").slice(0, 280),
    tags: Array.isArray(e?.tags) ? e.tags : [],
    type: ["HACKATHON", "WORKSHOP", "CONFERENCE", "MEETUP", "COMPETITION"].includes(e?.type)
      ? e.type
      : "MEETUP",
    registrationUrl: e?.registrationUrl ?? null,
  };
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const text: string = body.text ?? "";
  const imageOnly = !!body.imageBase64 && !text.trim();
  const key = process.env.GEMINI_API_KEY;

  if (key && key !== "mock_key") {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const parts: any[] = [{ text: `${PROMPT}\n\n${text}` }];
      if (body.imageBase64) {
        parts.push({
          inlineData: { mimeType: body.mimeType || "image/jpeg", data: body.imageBase64 },
        });
      }
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const raw = String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "")
          .replace(/```json|```/g, "")
          .trim();
        return NextResponse.json({ ok: true, source: "gemini", event: normalize(JSON.parse(raw)) });
      }
    } catch {
    } finally {
      clearTimeout(timer);
    }
  }
  return NextResponse.json({ ok: true, source: "mock", event: normalize(mock(text, imageOnly)) });
}
