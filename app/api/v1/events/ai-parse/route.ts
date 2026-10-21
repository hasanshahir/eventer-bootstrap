import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { text, imageBase64, mimeType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    if (apiKey && (imageBase64 || text)) {
      const parts: any[] = [
        {
          text: `You are an event extraction intelligence engine for Pakistan. Extract event details into valid JSON with keys:
- title: string
- description: string
- organizer: string
- city: string (Karachi, Lahore, Islamabad, Peshawar, Faisalabad, or Remote)
- venue: string
- type: string (HACKATHON, CONFERENCE, WORKSHOP, or COMPETITION)
- startsAt: ISO 8601 string
- endsAt: ISO 8601 string
- capacity: integer or null
- tags: array of strings (e.g. ["AI/ML", "Python", "Web3"])

Return ONLY the raw JSON object without markdown fences or additional commentary.`,
        },
      ];

      if (imageBase64) {
        parts.push({
          inline_data: {
            mime_type: mimeType || "image/png",
            data: imageBase64,
          },
        });
      }

      if (text) {
        parts.push({ text: `Source text / description: ${text}` });
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const cleaned = candidate.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          return NextResponse.json({
            ok: true,
            source: "gemini-1.5-flash",
            event: parsed,
          });
        }
      }
    }

    // Deterministic fallback for local dev when GEMINI_API_KEY is not set
    const now = new Date();
    const fallbackStart = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const fallbackEnd = new Date(fallbackStart.getTime() + 8 * 60 * 60 * 1000);

    return NextResponse.json({
      ok: true,
      source: "fallback",
      event: {
        title: text ? text.slice(0, 50) : "NED AI & Robotics Hackathon 2026",
        description:
          text ||
          "Inter-university engineering hackathon focusing on robotics automation and computer vision.",
        organizer: "NED Tech Society",
        city: "Karachi",
        venue: "NED University Main Campus",
        type: "HACKATHON",
        startsAt: fallbackStart.toISOString(),
        endsAt: fallbackEnd.toISOString(),
        capacity: 200,
        tags: ["AI/ML", "Robotics", "Python"],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to parse event flyer" },
      { status: 500 }
    );
  }
}
