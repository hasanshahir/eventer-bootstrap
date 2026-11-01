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
    account: {
      deleteMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    organizer: {
      create: vi.fn(),
    },
    organizerMember: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
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
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    team: {
      updateMany: vi.fn(),
    },
    teamMember: {
      deleteMany: vi.fn(),
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
import { GET as getAccount, DELETE as deleteAccount } from "@/app/api/v1/account/route";
import { POST as postEvent } from "@/app/api/v1/events/route";
import { POST as postCheckin } from "@/app/api/v1/checkin/route";
import { POST as postAiParse } from "@/app/api/v1/events/ai-parse/route";
import { signTicketToken } from "@/lib/tickets";

describe("Phase 1 Route Security, Concurrency & Proof Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMemoryRateLimiter();
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  describe("Proof 1 & 2: Forged Cookie Ignored & ?email= Query Param Ignored (S-02, S-04)", () => {
    it("ignores a forged legacy eventr_auth JSON cookie and returns 401 when no server session exists", async () => {
      mockAuth.mockResolvedValue(null);

      const forgedCookie = encodeURIComponent(
        JSON.stringify({
          id: "admin_spoof",
          email: "admin@eventr.pk",
          fullName: "Spoofed Admin",
          role: "ADMIN",
        })
      );

      const resAccount = await getAccount();
      expect(resAccount.status).toBe(401);

      const reqRegs = new Request("http://localhost:3000/api/v1/registrations", {
        headers: { Cookie: `eventr_auth=${forgedCookie}` },
      });
      const resRegs = await getRegistrations(reqRegs);
      expect(resRegs.status).toBe(401);
      expect(mockPrisma.registration.findMany).not.toHaveBeenCalled();
    });

    it("ignores ?email= query param and queries strictly by session.user.id (IDOR prevention)", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user_alice", email: "alice@example.com", role: "USER" },
      });
      mockPrisma.registration.findMany.mockResolvedValueOnce([]);

      const req = new Request(
        "http://localhost:3000/api/v1/registrations?email=victim@lums.edu.pk"
      );
      const res = await getRegistrations(req);
      expect(res.status).toBe(200);
      expect(mockPrisma.registration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_alice" },
        })
      );
    });
  });

  describe("Proof 3: 20-Parallel-Requests-for-5-Seats RSVP Concurrency + P2034 Retry", () => {
    it("confirms exactly 5 seats and waitlists 15 seats across 20 parallel requests even when P2034 serialization conflicts occur", async () => {
      const CAPACITY = 5;
      const TOTAL_REQUESTS = 20;

      const storedRegistrations: Array<{
        id: string;
        userId: string;
        eventId: string;
        status: "CONFIRMED" | "WAITLISTED";
        nonce: string;
        ticketToken: string;
      }> = [];

      // Simulate serialized commit validation + P2034 conflicts under contention:
      // In PostgreSQL Serializable isolation, concurrent transactions read a snapshot and
      // if the seat count changed between snapshot read and commit (or on contention), P2034 is raised.
      const failedAttemptsPerUser = new Map<string, number>();

      mockPrisma.registration.findUnique.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
          const snapshotConfirmedCount = storedRegistrations.filter(
            (r) => r.status === "CONFIRMED"
          ).length;

          const txMock = {
            ...mockPrisma,
            event: {
              findUnique: vi.fn().mockResolvedValue({
                id: "evt_5_seats",
                title: "Karachi AI Workshop",
                capacity: CAPACITY,
                endTime: new Date("2026-12-20T18:00:00Z"),
                status: "APPROVED",
              }),
            },
            registration: {
              ...mockPrisma.registration,
              count: vi.fn().mockImplementation(async () => {
                // Simulate async DB round-trip so all 20 transactions overlap concurrently
                await new Promise((r) => setTimeout(r, 2));
                return snapshotConfirmedCount;
              }),
              create: vi.fn().mockImplementation(
                async ({
                  data,
                }: {
                  data: {
                    id: string;
                    userId: string;
                    eventId: string;
                    status: "CONFIRMED" | "WAITLISTED";
                    nonce: string;
                    ticketToken: string;
                  };
                }) => {
                  const prevFailures = failedAttemptsPerUser.get(data.userId) ?? 0;
                  const currentConfirmed = storedRegistrations.filter(
                    (r) => r.status === "CONFIRMED"
                  ).length;

                  // If snapshot is stale (another concurrent tx committed a seat since our read)
                  // or on the first attempt of odd users, throw Prisma P2034 serialization failure!
                  const userNum = Number(data.userId.replace("user_", ""));
                  if (
                    currentConfirmed !== snapshotConfirmedCount ||
                    (userNum % 2 === 1 && prevFailures === 0)
                  ) {
                    failedAttemptsPerUser.set(data.userId, prevFailures + 1);
                    const p2034 = Object.assign(
                      new Error(
                        "Transaction failed due to a write conflict or a deadlock. Please retry your transaction"
                      ),
                      { code: "P2034" }
                    );
                    throw p2034;
                  }

                  storedRegistrations.push(data);
                  return data;
                }
              ),
            },
          };

          return await fn(txMock as unknown as typeof mockPrisma);
        }
      );

      // Fire 20 parallel POST requests as 20 distinct authenticated users
      const responses = await Promise.all(
        Array.from({ length: TOTAL_REQUESTS }, (_, idx) => {
          const userId = `user_${idx + 1}`;
          mockAuth.mockResolvedValueOnce({
            user: {
              id: userId,
              email: `${userId}@university.edu.pk`,
              role: "USER",
            },
          });

          const req = new Request("http://localhost:3000/api/v1/registrations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId: "evt_5_seats" }),
          });
          return postRegistration(req);
        })
      );

      // Every single request must succeed with 201 (zero 500 errors)
      for (const res of responses) {
        expect(res.status).toBe(201);
      }

      const confirmed = storedRegistrations.filter((r) => r.status === "CONFIRMED");
      const waitlisted = storedRegistrations.filter((r) => r.status === "WAITLISTED");

      expect(storedRegistrations).toHaveLength(20);
      expect(confirmed).toHaveLength(5);
      expect(waitlisted).toHaveLength(15);
      expect(failedAttemptsPerUser.size).toBeGreaterThanOrEqual(10);
    });
  });

  describe("POST /api/v1/events — OrganizerMember Attribution & Turnstile (S-06, S-07, S-12)", () => {
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

      mockPrisma.event.create.mockImplementationOnce(
        async ({ data }: { data: Record<string, unknown> }) => ({
          id: "evt_new_1",
          ...data,
        })
      );

      const req = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "NED AI Build Sprint 2026",
          description: "48-hour student build sprint on agentic AI systems.",
          organizer: "GDG Kolachi Impersonation Attempt",
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
    });
  });

  describe("Proof 4, 5 & 6: POST /api/v1/checkin — 401 Unauth, 403 Attendee, 403 Wrong Organizer, 409 Duplicate Scan (S-05)", () => {
    it("returns 401 when unauthenticated caller calls POST /api/v1/checkin", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const req = new Request("http://localhost:3000/api/v1/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketToken: "any-token" }),
      });
      const res = await postCheckin(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 when an attendee (role: USER) calls POST /api/v1/checkin", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user_attendee", email: "student@fast.edu.pk", role: "USER" },
      });
      const req = new Request("http://localhost:3000/api/v1/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketToken: "any-token" }),
      });
      const res = await postCheckin(req);
      expect(res.status).toBe(403);
    });

    it("returns 403 when an ORGANIZER of a different organization attempts to check in a ticket", async () => {
      const token = await signTicketToken({
        registrationId: "reg_1",
        eventId: "evt_softec",
        nonce: "nonce_abc",
      });

      mockAuth.mockResolvedValue({
        user: { id: "user_other_org", email: "other@org.pk", role: "ORGANIZER" },
      });

      mockPrisma.registration.findFirst.mockResolvedValueOnce({
        id: "reg_1",
        eventId: "evt_softec",
        status: "CONFIRMED",
        nonce: "nonce_abc",
        checkedInAt: null,
        user: { fullName: "Sara Ahmed", name: "Sara", university: "FAST" },
        event: { id: "evt_softec", title: "SOFTEC 2026" },
      });

      mockPrisma.event.findUnique.mockResolvedValueOnce({
        id: "evt_softec",
        title: "SOFTEC 2026",
        organizerId: "org_softec",
        endTime: null,
      });

      // Caller is NOT a member of org_softec
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

    it("returns 200 on first scan and 409 Conflict (alreadyCheckedIn: true) on duplicate scan", async () => {
      const token = await signTicketToken({
        registrationId: "reg_1",
        eventId: "evt_softec",
        nonce: "nonce_abc",
      });

      mockAuth.mockResolvedValue({
        user: { id: "user_staff", email: "staff@softec.pk", role: "ORGANIZER" },
      });

      mockPrisma.event.findUnique.mockResolvedValue({
        id: "evt_softec",
        title: "SOFTEC 2026",
        organizerId: "org_softec",
        endTime: null,
      });

      mockPrisma.organizerMember.findUnique.mockResolvedValue({
        id: "mem_1",
        userId: "user_staff",
        organizerId: "org_softec",
        role: "STAFF",
      });

      // Scan 1: status is CONFIRMED, atomic updateMany updates 1 row
      mockPrisma.registration.findFirst.mockResolvedValueOnce({
        id: "reg_1",
        eventId: "evt_softec",
        status: "CONFIRMED",
        nonce: "nonce_abc",
        checkedInAt: null,
        user: { fullName: "Sara Ahmed", name: "Sara", university: "FAST" },
        event: { id: "evt_softec", title: "SOFTEC 2026" },
      });
      mockPrisma.registration.updateMany.mockResolvedValueOnce({ count: 1 });

      const req1 = new Request("http://localhost:3000/api/v1/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketToken: token }),
      });
      const res1 = await postCheckin(req1);
      expect(res1.status).toBe(200);
      const body1 = (await res1.json()) as {
        ok: boolean;
        attendee: Record<string, unknown>;
      };
      expect(body1.ok).toBe(true);
      expect(body1.attendee).toEqual({ name: "Sara Ahmed", university: "FAST" });

      // Scan 2 (Duplicate): status is now CHECKED_IN -> returns 409 Conflict
      mockPrisma.registration.findFirst.mockResolvedValueOnce({
        id: "reg_1",
        eventId: "evt_softec",
        status: "CHECKED_IN",
        nonce: "nonce_abc",
        checkedInAt: new Date("2026-11-01T12:00:00Z"),
        user: { fullName: "Sara Ahmed", name: "Sara", university: "FAST" },
        event: { id: "evt_softec", title: "SOFTEC 2026" },
      });

      const req2 = new Request("http://localhost:3000/api/v1/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketToken: token }),
      });
      const res2 = await postCheckin(req2);
      expect(res2.status).toBe(409);
      const body2 = (await res2.json()) as {
        ok: boolean;
        alreadyCheckedIn: boolean;
        checkedInAt: string;
      };
      expect(body2.ok).toBe(false);
      expect(body2.alreadyCheckedIn).toBe(true);
      expect(body2.checkedInAt).toBeTruthy();
    });
  });

  describe("Proof 7: Account Deletion with Active Registrations (DELETE /api/v1/account)", () => {
    it("deletes all user registrations and dependent records before deleting the user", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user_with_regs", email: "user@fast.edu.pk", role: "USER" },
      });

      const callOrder: string[] = [];
      mockPrisma.$transaction.mockImplementationOnce(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
          const txMock = {
            ...mockPrisma,
            registration: {
              deleteMany: vi.fn().mockImplementation(async () => {
                callOrder.push("registration.deleteMany");
                return { count: 3 };
              }),
            },
            teamMember: {
              deleteMany: vi.fn().mockImplementation(async () => {
                callOrder.push("teamMember.deleteMany");
                return { count: 1 };
              }),
            },
            team: {
              updateMany: vi.fn().mockImplementation(async () => {
                callOrder.push("team.updateMany");
                return { count: 0 };
              }),
            },
            organizerMember: {
              deleteMany: vi.fn().mockImplementation(async () => {
                callOrder.push("organizerMember.deleteMany");
                return { count: 0 };
              }),
            },
            session: {
              deleteMany: vi.fn().mockImplementation(async () => {
                callOrder.push("session.deleteMany");
                return { count: 1 };
              }),
            },
            account: {
              deleteMany: vi.fn().mockImplementation(async () => {
                callOrder.push("account.deleteMany");
                return { count: 1 };
              }),
            },
            user: {
              delete: vi.fn().mockImplementation(async () => {
                callOrder.push("user.delete");
                return { id: "user_with_regs" };
              }),
            },
          };
          return await fn(txMock as unknown as typeof mockPrisma);
        }
      );

      const res = await deleteAccount();
      expect(res.status).toBe(200);
      expect(callOrder).toEqual([
        "registration.deleteMany",
        "teamMember.deleteMany",
        "team.updateMany",
        "organizerMember.deleteMany",
        "session.deleteMany",
        "account.deleteMany",
        "user.delete",
      ]);
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
