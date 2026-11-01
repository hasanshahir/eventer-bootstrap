import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, authzResponse } from "@/lib/authz";
import { apiError } from "@/lib/api-error";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_TEXT_BYTES = 8 * 1024; // 8 KB

const extractedEventSchema = z.object({
  title: z.string().trim().min(1).max(160).default("Untitled Tech Event"),
  organizer: z.string().trim().max(120).nullable().optional().default(null),
  city: z.string().trim().max(80).nullable().optional().default("Karachi"),
  venue: z.string().trim().max(240).nullable().optional().default(null),
  startsAt: z.string().nullable().optional().default(null),
  endsAt: z.string().nullable().optional().default(null),
  registrationDeadline: z.string().nullable().optional().default(null),
  description: z.string().trim().max(500).default(""),
  tags: z.array(z.string().trim()).max(12).default([]),
  type: z
    .enum(["HACKATHON", "WORKSHOP", "CONFERENCE", "MEETUP", "COMPETITION", "TECH_TALK"])
    .catch("MEETUP"),
  mode: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]).catch("IN_PERSON"),
  registrationUrl: z.string().url().nullable().optional().catch(null),
});

const SYSTEM_PROMPT = `Extract structured Pakistan tech event details from the provided text or flyer image.
Return ONLY valid JSON matching:
{
  "title": string,
  "organizer": string | null,
  "city": string | null,
  "venue": string | null,
  "startsAt": string | null (ISO 8601 in Asia/Karachi +05:00, assume year 2026 if omitted),
  "endsAt": string | null (ISO 8601 in Asia/Karachi +05:00),
  "registrationDeadline": string | null (ISO 8601 in Asia/Karachi +05:00),
  "description": string (concise summary, max 280 chars),
  "tags": string[] (from: Next.js, React, Python, AI/ML, Flutter, Node.js, DevOps, Cybersecurity, Web3, UI/UX, Hackathon, Workshop),
  "type": "HACKATHON" | "WORKSHOP" | "CONFERENCE" | "MEETUP" | "COMPETITION" | "TECH_TALK",
  "mode": "IN_PERSON" | "ONLINE" | "HYBRID",
  "registrationUrl": string | null
}`;

/**
 * POST /api/v1/events/ai-parse
 * - Requires authenticated user + per-user rate limit (fixes S-14).
 * - Accepts multipart/form-data (`flyer` file + `text`) or JSON (`{ text }`).
 * - Passes Gemini API key via `x-goog-api-key` header, NEVER in URL query string (fixes S-14).
 * - Uses `env.GEMINI_MODEL` (never retired `gemini-1.5-flash`) (fixes F-03).
 * - Never returns fake/mock data in production; returns HTTP 503 on missing key or upstream failure (fixes F-03).
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const rl = await checkRateLimit(`ai-parse:${user.id}`, 8, 60_000);
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    const contentType = req.headers.get("content-type") || "";
    let text = "";
    let imageBase64: string | null = null;
    let imageMimeType: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const rawText = formData.get("text");
      if (typeof rawText === "string") {
        text = rawText;
      }

      const file = formData.get("flyer") || formData.get("image");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const blob = file as File;
        if (!ALLOWED_MIME_TYPES.has(blob.type)) {
          return apiError(
            "Unsupported flyer image format. Please upload PNG, JPEG, or WEBP.",
            400
          );
        }
        if (blob.size > MAX_IMAGE_BYTES) {
          return apiError("Flyer image must be 4 MB or smaller.", 413);
        }
        const buffer = Buffer.from(await blob.arrayBuffer());
        imageBase64 = buffer.toString("base64");
        imageMimeType = blob.type;
      }
    } else {
      const body = (await req.json()) as {
        text?: unknown;
        imageBase64?: unknown;
        mimeType?: unknown;
      };
      if (typeof body.text === "string") {
        text = body.text;
      }
      if (typeof body.imageBase64 === "string" && body.imageBase64.length > 0) {
        const mime =
          typeof body.mimeType === "string" ? body.mimeType : "image/jpeg";
        if (!ALLOWED_MIME_TYPES.has(mime)) {
          return apiError(
            "Unsupported flyer image format. Please upload PNG, JPEG, or WEBP.",
            400
          );
        }
        const approxBytes = Math.ceil((body.imageBase64.length * 3) / 4);
        if (approxBytes > MAX_IMAGE_BYTES) {
          return apiError("Flyer image must be 4 MB or smaller.", 413);
        }
        imageBase64 = body.imageBase64;
        imageMimeType = mime;
      }
    }

    if (Buffer.byteLength(text, "utf8") > MAX_TEXT_BYTES) {
      return apiError("Announcement text must be 8 KB or smaller.", 400);
    }

    if (!text.trim() && !imageBase64) {
      return apiError(
        "Please provide announcement text or upload an event flyer image.",
        400
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || env.GEMINI_MODEL;

    if (!apiKey || apiKey.startsWith("AIzaSyFake") || apiKey === "mock_key") {
      return apiError(
        "AI flyer extraction is currently unavailable (GEMINI_API_KEY not configured). Please fill in the event details manually below.",
        503
      );
    }

    if (!model || model.includes("1.5-flash")) {
      return apiError(
        "Configured GEMINI_MODEL is retired or invalid. Please configure a supported Flash model (e.g. gemini-3.8-flash).",
        503
      );
    }

    const parts: Array<Record<string, unknown>> = [
      { text: `${SYSTEM_PROMPT}\n\nAnnouncement:\n${text.trim()}` },
    ];
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent`;

    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          signal: ctrl.signal,
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        });

        if (!res.ok) {
          if (attempt === 0 && res.status >= 500) continue;
          return apiError(
            "AI extraction service returned an error. Please complete the form manually.",
            503
          );
        }

        const data = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
          usageMetadata?: {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
            totalTokenCount?: number;
          };
        };

        const rawJson = String(
          data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
        )
          .replace(/```json|```/g, "")
          .trim();

        const parsedJson: unknown = JSON.parse(rawJson);
        const event = extractedEventSchema.parse(parsedJson);

        return NextResponse.json({
          ok: true,
          source: "gemini",
          model,
          usage: data.usageMetadata ?? null,
          event,
        });
      } catch (err) {
        if (attempt === 0) continue;
        return apiError(
          "Could not extract structured fields from flyer. Please enter details manually.",
          503,
          err
        );
      } finally {
        clearTimeout(timer);
      }
    }

    return apiError(
      "AI extraction timed out. Please enter the event details manually.",
      503
    );
  } catch (err) {
    const authRes = authzResponse(err);
    if (authRes) return authRes;
    return apiError("Failed to process flyer extraction request.", 500, err);
  }
}
