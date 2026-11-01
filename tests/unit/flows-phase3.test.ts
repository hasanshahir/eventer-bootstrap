import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoogleCalendarUrl, generateEventIcs } from "@/lib/calendar";

const mockAuthState = vi.hoisted(() => ({
  session: null as null | {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: "USER" | "ORGANIZER" | "ADMIN";
    };
  },
}));

const mockDb = vi.hoisted(() => ({
  registrations: new Map<
    string,
    {
      id: string;
      userId: string;
      eventId: string;
      status: "CONFIRMED" | "WAITLISTED" | "CANCELLED";
      checkedIn: boolean;
      checkedInAt: Date | null;
      createdAt: Date;
      user?: {
        name: string | null;
        email: string | null;
        university: string | null;
        department: string | null;
        rollNumber: string | null;
      };
      event?: {
        id: string;
        title: string;
      };
    }
  >(),
  organizerMemberships: new Set<string>(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => mockAuthState.session),
}));

vi.mock("@/lib/prisma", () => {
  const txClient = {
    registration: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return mockDb.registrations.get(where.id) ?? null;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { status: "CONFIRMED" | "WAITLISTED" | "CANCELLED" };
        }) => {
          const existing = mockDb.registrations.get(where.id);
          if (!existing) throw new Error("Not found");
          const updated = { ...existing, ...data };
          mockDb.registrations.set(where.id, updated);
          return updated;
        }
      ),
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { eventId: string; status: string };
        }) => {
          const candidates = Array.from(mockDb.registrations.values())
            .filter(
              (r) => r.eventId === where.eventId && r.status === where.status
            )
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          return candidates[0] ?? null;
        }
      ),
      findMany: vi.fn(
        async ({ where }: { where: { eventId: string } }) => {
          return Array.from(mockDb.registrations.values()).filter(
            (r) => r.eventId === where.eventId
          );
        }
      ),
    },
    organizerMember: {
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: {
            userId_organizerId?: { userId: string; organizerId: string };
          };
        }) => {
          const u = where.userId_organizerId?.userId ?? "";
          const o = where.userId_organizerId?.organizerId ?? "";
          return mockDb.organizerMemberships.has(`${u}:${o}`)
            ? { id: "mem-1", userId: u, organizerId: o, role: "OWNER" }
            : null;
        }
      ),
    },
    event: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === "ev-test-1") {
          return {
            id: "ev-test-1",
            slug: "nust-ai-hack-2026",
            title: "NUST AI Hackathon 2026",
            organizerId: "org-1",
            endTime: null,
          };
        }
        return null;
      }),
      findMany: vi.fn(async () => []),
    },
  };

  return {
    prisma: {
      ...txClient,
      $transaction: vi.fn(async (fn: (tx: typeof txClient) => Promise<unknown>) =>
        fn(txClient)
      ),
    },
  };
});

describe("Phase 3 Core Product Flows", () => {
  beforeEach(() => {
    mockAuthState.session = null;
    mockDb.registrations.clear();
    mockDb.organizerMemberships.clear();
  });

  it("1. generateEventIcs & buildGoogleCalendarUrl apply a 2-hour default duration when endsAt is missing and support VALUE=DATE", () => {
    const timedIcs = generateEventIcs({
      id: "ev-1",
      title: "Karachi Next.js Meetup",
      description: "Production App Router deep dive",
      city: "Karachi",
      venue: "NIC Karachi",
      startsAt: "2026-11-15T14:00:00.000Z",
      endsAt: null,
      url: "https://eventr.pk/events/karachi-nextjs",
    });

    expect(timedIcs).toContain("BEGIN:VCALENDAR");
    expect(timedIcs).toContain("DTSTART:20261115T140000Z");
    expect(timedIcs).toContain("DTEND:20261115T160000Z");
    expect(timedIcs).toContain("SUMMARY:Karachi Next.js Meetup");

    const allDayIcs = generateEventIcs({
      id: "ev-2",
      title: "All Day Summit",
      description: "Full day conference",
      city: "Lahore",
      startsAt: "2026-12-01T00:00:00.000Z",
      dateOnly: true,
    });
    expect(allDayIcs).toContain("DTSTART;VALUE=DATE:20261201");
    expect(allDayIcs).toContain("DTEND;VALUE=DATE:20261202");

    const gcalUrl = buildGoogleCalendarUrl({
      title: "Karachi Next.js Meetup",
      description: "Production App Router deep dive",
      city: "Karachi",
      startsAt: "2026-11-15T14:00:00.000Z",
      endsAt: null,
    });
    expect(gcalUrl).toContain("20261115T140000Z%2F20261115T160000Z");
  });

  it("2. DELETE /api/v1/registrations/[id] cancels CONFIRMED registration and promotes the oldest WAITLISTED attendee", async () => {
    mockDb.registrations.set("reg-confirmed-1", {
      id: "reg-confirmed-1",
      userId: "user-1",
      eventId: "ev-test-1",
      status: "CONFIRMED",
      checkedIn: false,
      checkedInAt: null,
      createdAt: new Date("2026-11-01T10:00:00Z"),
    });
    mockDb.registrations.set("reg-wait-old", {
      id: "reg-wait-old",
      userId: "user-2",
      eventId: "ev-test-1",
      status: "WAITLISTED",
      checkedIn: false,
      checkedInAt: null,
      createdAt: new Date("2026-11-01T10:05:00Z"),
    });
    mockDb.registrations.set("reg-wait-new", {
      id: "reg-wait-new",
      userId: "user-3",
      eventId: "ev-test-1",
      status: "WAITLISTED",
      checkedIn: false,
      checkedInAt: null,
      createdAt: new Date("2026-11-01T10:10:00Z"),
    });

    const { DELETE } = await import("@/app/api/v1/registrations/[id]/route");

    // Wrong user cannot cancel user-1's registration
    mockAuthState.session = {
      user: { id: "user-2", email: "u2@example.com", role: "USER" },
    };
    const forbiddenRes = await DELETE(
      new Request("http://localhost:3000/api/v1/registrations/reg-confirmed-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "reg-confirmed-1" }) }
    );
    expect(forbiddenRes.status).toBe(403);

    // Owner cancels -> reg-wait-old promoted to CONFIRMED
    mockAuthState.session = {
      user: { id: "user-1", email: "u1@example.com", role: "USER" },
    };
    const okRes = await DELETE(
      new Request("http://localhost:3000/api/v1/registrations/reg-confirmed-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "reg-confirmed-1" }) }
    );
    expect(okRes.status).toBe(200);
    const body = (await okRes.json()) as {
      ok: boolean;
      cancelledId: string;
      promotedRegistrationId: string | null;
    };
    expect(body.ok).toBe(true);
    expect(body.promotedRegistrationId).toBe("reg-wait-old");
    expect(mockDb.registrations.get("reg-confirmed-1")?.status).toBe("CANCELLED");
    expect(mockDb.registrations.get("reg-wait-old")?.status).toBe("CONFIRMED");
    expect(mockDb.registrations.get("reg-wait-new")?.status).toBe("WAITLISTED");
  });

  it("3. GET /api/v1/organizer/events/[id]/roster.csv enforces OrganizerMember RBAC and neutralizes CSV formula injection", async () => {
    mockDb.registrations.set("reg-csv-1", {
      id: "reg-csv-1",
      userId: "user-a",
      eventId: "ev-test-1",
      status: "CONFIRMED",
      checkedIn: true,
      checkedInAt: new Date("2026-11-01T12:00:00Z"),
      createdAt: new Date("2026-11-01T09:00:00Z"),
      user: {
        name: "=CMD|' /C calc'!A0",
        email: "attendee@nust.edu.pk",
        university: "NUST",
        department: "CS",
        rollNumber: "+92300",
      },
    });

    const { GET } = await import(
      "@/app/api/v1/organizer/events/[id]/roster.csv/route"
    );

    // Non-member organizer gets 403
    mockAuthState.session = {
      user: { id: "org-intruder", email: "intruder@org.pk", role: "ORGANIZER" },
    };
    const denied = await GET(
      new Request("http://localhost:3000/api/v1/organizer/events/ev-test-1/roster.csv"),
      { params: Promise.resolve({ id: "ev-test-1" }) }
    );
    expect(denied.status).toBe(403);

    // Authorized OrganizerMember gets 200 CSV with escaped formula prefix
    mockDb.organizerMemberships.add("org-owner:org-1");
    mockAuthState.session = {
      user: { id: "org-owner", email: "owner@org.pk", role: "ORGANIZER" },
    };
    const allowed = await GET(
      new Request("http://localhost:3000/api/v1/organizer/events/ev-test-1/roster.csv"),
      { params: Promise.resolve({ id: "ev-test-1" }) }
    );
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("content-type")).toContain("text/csv");
    const csv = await allowed.text();
    expect(csv).toContain("Registration ID,Attendee Name,Email");
    expect(csv).toContain("'=CMD|' /C calc'!A0");
    expect(csv).toContain("'+92300");
  });

  it("4. GET /api/v1/events & GET /api/v1/calendar/event/[id] serve filtered events and .ics download", async () => {
    const { GET: listEvents } = await import("@/app/api/v1/events/route");
    const res = await listEvents(
      new Request("http://localhost:3000/api/v1/events?city=Karachi&openOnly=true")
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      ok: boolean;
      count: number;
      events: Array<{ id: string; city: string }>;
    };
    expect(data.ok).toBe(true);
    expect(data.count).toBeGreaterThan(0);
    expect(
      data.events.every((e) => e.city.toLowerCase() === "karachi")
    ).toBe(true);

    const firstId = data.events[0]!.id;
    const { GET: getCalendar } = await import(
      "@/app/api/v1/calendar/event/[id]/route"
    );
    const calRes = await getCalendar(
      new Request(`http://localhost:3000/api/v1/calendar/event/${firstId}.ics`),
      { params: Promise.resolve({ id: `${firstId}.ics` }) }
    );
    expect(calRes.status).toBe(200);
    expect(calRes.headers.get("content-type")).toContain("text/calendar");
    const icsText = await calRes.text();
    expect(icsText).toContain("BEGIN:VCALENDAR");
  });
});
