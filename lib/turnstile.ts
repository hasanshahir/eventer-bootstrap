import { env } from "./env";

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Verifies Cloudflare Turnstile token when TURNSTILE_SECRET_KEY is configured (fixes S-12).
 * Applied on event submission (POST /api/v1/events) and RSVP (POST /api/v1/registrations).
 */
export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY || env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { success: true };
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    return {
      success: false,
      error: "Bot verification token (Turnstile) is required.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.set("secret", secret);
    formData.set("response", token.trim());
    if (remoteIp) {
      formData.set("remoteip", remoteIp);
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      }
    );

    if (!res.ok) {
      return {
        success: false,
        error: "Unable to verify bot protection challenge.",
      };
    }

    const data = (await res.json()) as { success?: boolean };
    if (!data.success) {
      return {
        success: false,
        error: "Bot protection verification failed.",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Bot verification service unreachable.",
    };
  }
}

