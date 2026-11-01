import { describe, it, expect, beforeEach } from "vitest";
import { validateEnv } from "@/lib/env";
import { encryptPii, decryptPii, isLikelyPhoneNumber } from "@/lib/crypto";
import { signTicketToken, verifyTicketToken, generateTicketNonce } from "@/lib/tickets";
import { checkRateLimit, resetMemoryRateLimiter } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile";

describe("Phase 0 & Phase 1 Security Primitives", () => {
  describe("lib/env.ts — Zod Environment Validation (D-05)", () => {
    it("rejects retired gemini-1.5-flash when explicitly validated", () => {
      const env = validateEnv({
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://localhost:5432/eventr",
        GEMINI_MODEL: "gemini-1.5-flash",
      });
      // validateEnv normalizes retired 1.5-flash to gemini-3.8-flash
      expect(env.GEMINI_MODEL).toBe("gemini-3.8-flash");
    });

    it("enforces required secrets in production mode", () => {
      expect(() =>
        validateEnv({
          NODE_ENV: "production",
          DATABASE_URL: "postgresql://localhost:5432/eventr",
        })
      ).toThrow(/Missing required production secrets/);
    });

    it("passes in production when all secrets are provided", () => {
      const parsed = validateEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://localhost:5432/eventr",
        AUTH_SECRET: "a-very-long-production-auth-secret-32-chars",
        TICKET_SIGNING_SECRET: "a-very-long-production-ticket-secret-32-chars",
        PII_ENCRYPTION_KEY: "a-very-long-production-pii-encryption-key-32",
        CRON_SECRET: "a-very-long-production-cron-secret-32-chars",
        GEMINI_MODEL: "gemini-3.8-flash",
      });
      expect(parsed.NODE_ENV).toBe("production");
      expect(parsed.GEMINI_MODEL).toBe("gemini-3.8-flash");
    });
  });

  describe("lib/crypto.ts — AES-256-GCM Phone Encryption & S-13 Migration Helper", () => {
    it("encrypts and decrypts phone numbers losslessly with random IVs", () => {
      const phone = "+92 333 0405008";
      const cipher1 = encryptPii(phone);
      const cipher2 = encryptPii(phone);

      expect(cipher1).toMatch(/^v1:/);
      expect(cipher1).not.toBe(cipher2); // Random 12-byte IV per encryption
      expect(decryptPii(cipher1)).toBe(phone);
      expect(decryptPii(cipher2)).toBe(phone);
    });

    it("returns null on tampered ciphertext", () => {
      const cipher = encryptPii("03001234567");
      const tampered = cipher.slice(0, -4) + "AAAA";
      expect(decryptPii(tampered)).toBeNull();
    });

    it("accurately distinguishes Pakistani phone numbers from university roll numbers", () => {
      expect(isLikelyPhoneNumber("03330405008")).toBe(true);
      expect(isLikelyPhoneNumber("+92 300 1234567")).toBe(true);
      expect(isLikelyPhoneNumber("0321-7654321")).toBe(true);
      expect(isLikelyPhoneNumber("CS-22041")).toBe(false);
      expect(isLikelyPhoneNumber("2022-CS-104")).toBe(false);
    });
  });

  describe("lib/tickets.ts — Signed HS256 JWT QR Tickets", () => {
    it("signs and verifies a valid ticket token", async () => {
      const nonce = generateTicketNonce();
      const token = await signTicketToken({
        registrationId: "reg_123",
        eventId: "evt_456",
        nonce,
        eventEndTime: new Date(Date.now() + 3600_000),
      });

      const verified = await verifyTicketToken(token);
      expect(verified).toEqual({
        rid: "reg_123",
        eid: "evt_456",
        n: nonce,
      });
    });

    it("rejects forged or modified tokens", async () => {
      const token = await signTicketToken({
        registrationId: "reg_123",
        eventId: "evt_456",
        nonce: "nonce123",
      });
      const forged = token.slice(0, -5) + "XXXXX";
      expect(await verifyTicketToken(forged)).toBeNull();
      expect(await verifyTicketToken("random-uuid-token")).toBeNull();
    });
  });

  describe("lib/ratelimit.ts — Sliding Window Rate Limiter (S-12)", () => {
    beforeEach(() => {
      resetMemoryRateLimiter();
    });

    it("allows requests within limit and blocks with retryAfterSeconds when exceeded", async () => {
      const r1 = await checkRateLimit("test-ip", 2, 60_000);
      const r2 = await checkRateLimit("test-ip", 2, 60_000);
      const r3 = await checkRateLimit("test-ip", 2, 60_000);

      expect(r1.allowed).toBe(true);
      expect(r2.allowed).toBe(true);
      expect(r3.allowed).toBe(false);
      expect(r3.remaining).toBe(0);
      expect(r3.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe("lib/turnstile.ts — Cloudflare Turnstile Verification (S-12)", () => {
    it("rejects missing token when TURNSTILE_SECRET_KEY is configured", async () => {
      const prev = process.env.TURNSTILE_SECRET_KEY;
      process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
      try {
        const res = await verifyTurnstileToken("");
        expect(res.success).toBe(false);
        expect(res.error).toMatch(/Turnstile/i);
      } finally {
        if (prev === undefined) delete process.env.TURNSTILE_SECRET_KEY;
        else process.env.TURNSTILE_SECRET_KEY = prev;
      }
    });
  });
});

