import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ZodError } from "zod";

export interface ApiErrorPayload {
  ok: false;
  error: string;
  requestId: string;
  issues?: Array<{ path: string; message: string }>;
}

/**
 * Standardized API error response helper.
 * Never exposes internal `err.message` or stack traces to clients on 500 errors (fixes S-11).
 */
export function apiError(
  message: string,
  status = 500,
  internalErr?: unknown
): NextResponse<ApiErrorPayload> {
  const requestId = randomUUID();

  if (internalErr instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: message || "Invalid request payload",
        requestId,
        issues: internalErr.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  if (internalErr) {
    console.error(`[API Error ${requestId}] (${status}) ${message}:`, internalErr);
  }

  const safeClientMessage =
    status >= 500
      ? message || "An unexpected server error occurred."
      : message;

  return NextResponse.json(
    {
      ok: false,
      error: safeClientMessage,
      requestId,
    },
    { status }
  );
}

