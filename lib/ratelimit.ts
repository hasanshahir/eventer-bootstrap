import { NextResponse } from "next/server";
import { env } from "./env";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, Bucket>();
let warnedInMemory = false;

export function resetMemoryRateLimiter(): void {
  memoryStore.clear();
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Checks rate limit via Upstash Redis REST API when configured, or falls back to
 * an in-memory sliding window limiter with a one-time startup warning.
 */
export async function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const now = Date.now();

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;
      const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", windowKey],
          ["PEXPIRE", windowKey, windowMs, "NX"],
        ]),
      });

      if (res.ok) {
        const data = (await res.json()) as Array<{ result: number }>;
        const count = Number(data?.[0]?.result ?? 1);
        const resetAt = (Math.floor(now / windowMs) + 1) * windowMs;
        const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
        return {
          allowed: count <= limit,
          limit,
          remaining: Math.max(0, limit - count),
          resetAt,
          retryAfterSeconds,
        };
      }
    } catch (err) {
      console.warn("Upstash rate limit fallback to memory:", err);
    }
  } else if (!warnedInMemory && env.NODE_ENV !== "test") {
    warnedInMemory = true;
    console.warn(
      "[RateLimit] UPSTASH_REDIS_REST_URL not set; using in-memory rate limiter."
    );
  }

  const existing = memoryStore.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
    };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds,
  };
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "Too many requests. Please slow down and try again shortly.",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
      },
    }
  );
}

