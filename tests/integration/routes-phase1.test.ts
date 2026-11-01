import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetMemoryRateLimiter } from "@/lib/ratelimit";

// Hoisted mocks for Vitest
const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organizer: {
      create: vi.fn(),
    },
    organizerMember: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    registration: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET as getRegistrations, POST as postRegistration } from "@/app/api/v1/registrations/route";
import { POST as postEvent } from "@/app/api/v1/events/route";
import { POST as postCheckin } from "@/app/api/v1/checkin/route";
import { POST as postAiParse } from "@/app/api/v1/events/ai-parse/route";
import { signTicketToken } from "@/lib/tickets";

describe("Phase 1 Route Security & Authorization Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMemoryRateLimiter();
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  describe("GET & POST /api/v1/registrations — Auth & IDOR Prevention (S-04)", () => {
    it("returns 401 when unauthenticated user calls GET /api/v1/registrations?email=victim@example.com", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const req = new Request("http://localhost:3000/api/v1/registrations?email=victim@example.com");
      const res = await getRegistrations(req);
      expect(res.status).toBe(401);
      expect(mockPrisma.registration.findMany).not.toHaveBeenCalled();
    });

    it("ignores ?email= query param and queries strictly by session.user.id (IDOR prevention)", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user_alice", email: "alice@example.com", role: "USER" },
      });
      mockPrisma.registration.findMany.mockResolvedValueOnce([]);

      const req = new Request(
        "http://localhost:3000/api/v1/registrations?email=victim@example.com"
      );
      const res = await getRegistrations(req);
      expect(res.status).toBe(200);
      expect(mockPrisma.registration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_alice" },
        })
      );
    });

    it("returns 401 on unauthenticated POST /api/v1/registrations", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const req = new Request("http://localhost:3000/api/v1/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "evt_1",
          user: { email: "spoofed@example.com", name: "Spoofer" },
        }),
      });
      const res = await postRegistration(req);
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/events — OrganizerMember Attribution & Turnstile (S-06, S-07, S-12)", () => {
    it("returns 401 when anonymous caller tries to submit an event", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const req = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Spam Event" }),
      });
      const res = await postEvent(req);
      expect(res.status).toBe(401);
    });

    it("derives organizer strictly from OrganizerMember (never free text) and sets status = PENDING", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user_org_1", email: "lead@ned.edu.pk", name: "Ali Khan", role: "ORGANIZER" },
      });

      mockPrisma.organizerMember.findFirst.mockResolvedValueOnce({
        organizer: {
          id: "org_verified_ned",
          name: "NED ACM Chapter",
          verified: true,
        },
      });

      mockPrisma.event.create.mockImplementationOnce(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "evt_new_1",
        ...data,
      }));

      const req = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "NED AI Build Sprint 2026",
          description: "48-hour student build sprint on agentic AI systems.",
          organizer: "GDG Kolachi Impersonation Attempt", // Must be ignored!
          city: "Karachi",
          type: "HACKATHON",
          startsAt: "2026-12-10T09:00:00+05:00",
          endsAt: "2026-12-11T18:00:00+05:00",
        }),
      });

      const res = await postEvent(req);
      expect(res.status).toBe(201);
      const json = (await res.json()) as {
        ok: boolean;
        event: { organizer: string; status: string };
      };
      expect(json.ok).toBe(true);
      expect(json.event.organizer).toBe("NED ACM Chapter");
      expect(json.event.status).toBe("PENDING");
      expect(mockPrisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizerId: "org_verified_ned",
            status: "PENDING",
          }),
        })
      );
    });
  });

  describe("POST /api/v1/checkin — Organizer Scoping, Signed JWT & Atomic Check-In (S-05)", () => {
    it("returns 403 when an authenticated user who is NOT a member of the event's organizer scans a ticket", async () => {
      const token = await signTicketToken({
        registrationId: "reg_1",
        eventId: "evt_1",
        nonce: "nonce_abc",
      });

      mockPrisma.registration.findFirst.mockResolvedValueOnce({
        id: "reg_1",
        eventId: "evt_1",
        status: "CONFIRMED",
        nonce: "nonce_abc",
        checkedInAt: null,
        user: { fullName: "Sara Ahmed", name: "Sara", university: "FAST" },
        event: { id: "evt_1", title: "SOFTEC 2026" },
      });

      mockAuth.mockResolvedValueOnce({
        user: { id: "user_intruder", email: "intruder@example.com", role: "USER" },
      });

      mockPrisma.event.findUnique.mockResolvedValueOnce({
        id: "evt_1",
        title: "SOFTEC 2026",
        organizerId: "org_softec",
        endTime: null,
      });

      mockPrisma.organizerMember.findUnique.mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/v1/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketToken: token }),
      });

      const res = await postCheckin(req);
      expect(res.status).toBe(403);
      expect(mockPrisma.registration.updateMany).not.toHaveBeenCalled();
    });

    it("executes atomic updateMany and returns sanitized attendee/event summary (no email or phone leaked)", async () => {
      const token = await signTicketToken({
        registrationId: "reg_1",
        eventId: "evt_1",
        nonce: "nonce_abc",
      });

      mockPrisma.registration.findFirst.mockResolvedValueOnce({
        id: "reg_1",
        eventId: "evt_1",
        status: "CONFIRMED",
        nonce: "nonce_abc",
        checkedInAt: null,
        user: { fullName: "Sara Ahmed", name: "Sara", university: "FAST" },
        event: { id: "evt_1", title: "SOFTEC 2026" },
      });

      mockAuth.mockResolvedValueOnce({
        user: { id: "user_staff", email: "staff@softec.pk", role: "ORGANIZER" },
      });

      mockPrisma.event.findUnique.mockResolvedValueOnce({
        id: "evt_1",
        title: "SOFTEC 2026",
        organizerId: "org_softec",
        endTime: null,
      });

      mockPrisma.organizerMember.findUnique.mockResolvedValueOnce({
        id: "mem_1",
        userId: "user_staff",
        organizerId: "org_softec",
        role: "STAFF",
      });

      mockPrisma.registration.updateMany.mockResolvedValueOnce({ count: 1 });

      const req = new Request("http://localhost:3000/api/v1/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketToken: token }),
      });

      const res = await postCheckin(req);
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        ok: boolean;
        attendee: Record<string, unknown>;
        event: Record<string, unknown>;
      };
      expect(body.ok).toBe(true);
      expect(body.attendee).toEqual({ name: "Sara Ahmed", university: "FAST" });
      expect(body.attendee).not.toHaveProperty("email");
      expect(body.attendee).not.toHaveProperty("phoneEncrypted");
      expect(body.event).toEqual({ id: "evt_1", title: "SOFTEC 2026" });
    });
  });

  describe("POST /api/v1/events/ai-parse — Honest 503 Failure & Rate Limit (S-14, F-03)", () => {
    it("returns 503 (never a fake mock event) when GEMINI_API_KEY is missing", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user_1", email: "user@example.com", role: "USER" },
      });

      const prevKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        const req = new Request("http://localhost:3000/api/v1/events/ai-parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "FAST Hackathon on 15 Nov 2026 in Karachi" }),
        });

        const res = await postAiParse(req);
        expect(res.status).toBe(503);
        const data = (await res.json()) as { ok: boolean; error: string };
        expect(data.ok).toBe(false);
        expect(data).not.toHaveProperty("event");
      } finally {
        if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
      }
    });
  });
});
