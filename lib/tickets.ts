import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { env } from "./env";

export interface TicketPayload {
  rid: string; // Registration ID
  eid: string; // Event ID
  n: string;   // Nonce stored on Registration
}

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.TICKET_SIGNING_SECRET);
}

export function generateTicketNonce(): string {
  return randomBytes(12).toString("hex");
}

/**
 * Signs a tamper-evident HS256 JWT pass token for an attendee registration.
 * Expiration defaults to event endTime + 24 hours (or 30 days from now if endTime is null).
 */
export async function signTicketToken(params: {
  registrationId: string;
  eventId: string;
  nonce: string;
  eventEndTime?: Date | null;
}): Promise<string> {
  const baseEndMs = params.eventEndTime
    ? params.eventEndTime.getTime()
    : Date.now() + 30 * 24 * 60 * 60 * 1000;
  const expSeconds = Math.max(
    Math.floor(Date.now() / 1000) + 3600,
    Math.floor((baseEndMs + 24 * 60 * 60 * 1000) / 1000)
  );

  return new SignJWT({
    rid: params.registrationId,
    eid: params.eventId,
    n: params.nonce,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expSeconds)
    .sign(getSecretKey());
}

/**
 * Verifies a signed HS256 JWT ticket token and returns `{ rid, eid, n }`.
 */
export async function verifyTicketToken(token: string): Promise<TicketPayload | null> {
  if (!token || typeof token !== "string") return null;
  try {
    const { payload } = await jwtVerify(token.trim(), getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.rid !== "string" ||
      typeof payload.eid !== "string" ||
      typeof payload.n !== "string"
    ) {
      return null;
    }
    return {
      rid: payload.rid,
      eid: payload.eid,
      n: payload.n,
    };
  } catch {
    return null;
  }
}

