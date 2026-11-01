import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseSubmissionPeriodDates } from "@/lib/ingest/dates";
import { deduplicateIngestedEvents } from "@/lib/ingest/dedupe";
import {
  loadCuratedEvents,
  type IngestedEventCandidate,
} from "@/lib/ingest/curated";
import { findNearestCityDesk, ALL_CITY_DESKS } from "@/lib/constants/geo";
import {
  countByCityDesk,
  countByFormat,
  countBySource,
  countOpenAndArchived,
  sortEventsDeadlineFirst,
} from "@/lib/events/selectors";
import { fmtDate, toCard } from "@/lib/ev";

const mockAuth = vi.fn();
const mockPrisma = {
  organizer: {
    upsert: vi.fn(),
  },
  ingestionRun: {
    create: vi.fn(),
    update: vi.fn(),
  },
  event: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock("@/lib/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/ingest/devpost", () => ({
  fetchDevpostEvents: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/ingest/gdg", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ingest/gdg")>();
  return {
    ...actual,
    fetchGdgEvents: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("@/lib/ingest/luma", () => ({
  fetchLumaEvents: vi.fn().mockResolvedValue([]),
}));

describe("Phase 2 — Ingestion Dates, Deduplication, Selectors, Geo, Cron & Admin Moderation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("F-08: parses multi-month submission_period_dates ('May 12 - Jun 15, 2026') into startTime + endTime + registrationDeadline", () => {
    const parsed = parseSubmissionPeriodDates("May 12 - Jun 15, 2026");
    expect(parsed.needsVerification).toBe(false);
    expect(parsed.dateOnly).toBe(true);
    expect(parsed.startTime?.toISOString()).toBe("2026-05-12T00:00:00.000Z");
    expect(parsed.endTime?.toISOString()).toBe("2026-06-15T00:00:00.000Z");
    expect(parsed.registrationDeadline?.toISOString()).toBe(
      "2026-06-15T00:00:00.000Z"
    );
  });

  it("F-08: parses same-month submission_period_dates ('May 12 - 18, 2026') accurately", () => {
    const parsed = parseSubmissionPeriodDates("May 12 - 18, 2026");
    expect(parsed.needsVerification).toBe(false);
    expect(parsed.dateOnly).toBe(true);
    expect(parsed.startTime?.toISOString()).toBe("2026-05-12T00:00:00.000Z");
    expect(parsed.endTime?.toISOString()).toBe("2026-05-18T00:00:00.000Z");
  });

  it("F-07: never fabricates Date.now() + 7 days when date string is empty or unparseable", () => {
    const emptyParsed = parseSubmissionPeriodDates(null);
    expect(emptyParsed.startTime).toBeNull();
    expect(emptyParsed.endTime).toBeNull();
    expect(emptyParsed.needsVerification).toBe(true);

    const garbageParsed = parseSubmissionPeriodDates("TBA soon");
    expect(garbageParsed.startTime).toBeNull();
    expect(garbageParsed.endTime).toBeNull();
    expect(garbageParsed.needsVerification).toBe(true);
  });

  it("F-08: fmtDate renders date-only events without a misleading 05:00 PKT timestamp", () => {
    const rendered = fmtDate("2026-05-12T00:00:00.000Z", true);
    expect(rendered).toContain("12 May 2026");
    expect(rendered).not.toContain("05:00");
  });

  it("F-10: loads all 40 curated Pakistan 2026 events from JSON with valid URLs", () => {
    const curated = loadCuratedEvents();
    expect(curated.length).toBe(40);
    expect(curated[0].externalId).toBe("khi_gdg_kolachi_2026");
  });

  it("Requirement #3: deduplicates cross-source events by normalized URL and (title, city, YYYY-MM)", () => {
    const baseEvent: IngestedEventCandidate = {
      source: "LUMA",
      externalId: "luma_1",
      slug: "karachi-ai-builders-meetup",
      title: "Karachi AI Builders Meetup",
      description: "Monthly AI builders session",
      city: "Karachi",
      venue: "Karachi, Pakistan",
      mode: "IN_PERSON",
      type: "MEETUP",
      organizer: "Karachi AI",
      registrationUrl: "https://lu.ma/khi-ai-2026?utm_source=twitter",
      sourceUrl: "https://lu.ma/khi-ai-2026",
      tags: ["AI/ML"],
      startTime: new Date("2026-11-15T10:00:00.000Z"),
      endTime: new Date("2026-11-15T13:00:00.000Z"),
      registrationDeadline: new Date("2026-11-15T10:00:00.000Z"),
      dateOnly: false,
      scope: "pakistan",
      needsVerification: false,
    };

    const duplicateByUrl: IngestedEventCandidate = {
      ...baseEvent,
      source: "CAMPUS",
      externalId: "campus_dup_1",
      title: "Different Title Same Luma Link",
      registrationUrl: "https://lu.ma/khi-ai-2026/",
    };

    const duplicateByTitleCityMonth: IngestedEventCandidate = {
      ...baseEvent,
      source: "GDG",
      externalId: "gdg_dup_2",
      registrationUrl: "https://gdg.community.dev/events/khi-ai-2026",
    };

    const deduplicated = deduplicateIngestedEvents([
      baseEvent,
      duplicateByUrl,
      duplicateByTitleCityMonth,
    ]);
    expect(deduplicated.length).toBe(1);
    expect(deduplicated[0].externalId).toBe("luma_1");
  });

  it("U-08 & D-06: exposes all 20 regional desks (19 physical + 1 virtual) and enforces 150km GPS cutoff", () => {
    expect(ALL_CITY_DESKS.length).toBe(20);
    expect(ALL_CITY_DESKS.filter((d) => !d.isVirtual).length).toBe(19);

    // Near Karachi (24.86, 67.00) -> within 150km cutoff
    const nearKhi = findNearestCityDesk(24.87, 67.02, 150);
    expect(nearKhi.withinCutoff).toBe(true);
    expect(nearKhi.desk.slug).toBe("karachi");

    // Far away (e.g. Dubai 25.2048, 55.2708) -> > 150km -> withinCutoff: false
    const farAway = findNearestCityDesk(25.2048, 55.2708, 150);
    expect(farAway.withinCutoff).toBe(false);
  });

  it("F-05: unified selectors compute consistent open/archived, source, format, and city desk counts", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const cards = [
      toCard({
        id: "ev_open_khi",
        title: "Open Karachi Hackathon",
        city: "Karachi",
        type: "HACKATHON",
        source: "gdg",
        startTime: "2026-08-10T09:00:00.000Z",
        endTime: "2026-08-12T18:00:00.000Z",
        registrationUrl: "https://gdg.community.dev/events/open-khi",
      }),
      toCard({
        id: "ev_closed_lhr",
        title: "Past Lahore Conference",
        city: "Lahore",
        type: "CONFERENCE",
        source: "campus",
        startTime: "2026-02-10T09:00:00.000Z",
        endTime: "2026-02-11T18:00:00.000Z",
        registrationUrl: "https://lums.edu.pk/events/past-lhr",
      }),
      toCard({
        id: "ev_open_global",
        title: "Global Devpost Sprint",
        city: "Global • Virtual",
        type: "HACKATHON",
        source: "devpost",
        scope: "global",
        startTime: "2026-07-01T00:00:00.000Z",
        endTime: "2026-07-15T23:59:59.000Z",
        registrationUrl: "https://devpost.com/software/global-sprint",
      }),
    ];

    const oa = countOpenAndArchived(cards, now);
    expect(oa).toEqual({ open: 2, archived: 1, total: 3 });

    const bySource = countBySource(cards, { openOnly: true, now });
    expect(bySource.gdg).toBe(1);
    expect(bySource.devpost).toBe(1);
    expect(bySource.campus).toBe(0);

    const byFormatOpen = countByFormat(cards, { openOnly: true, now });
    expect(byFormatOpen.HACKATHON).toBe(2);
    expect(byFormatOpen.CONFERENCE).toBe(0);

    const byCityOpen = countByCityDesk(cards, { openOnly: true, now });
    expect(byCityOpen.karachi).toBe(1);
    expect(byCityOpen.lahore).toBeUndefined();
    expect(byCityOpen.online).toBe(1);

    const sorted = sortEventsDeadlineFirst(cards, now);
    expect(sorted[0].id).toBe("ev_open_global");
    expect(sorted[1].id).toBe("ev_open_khi");
    expect(sorted[2].id).toBe("ev_closed_lhr");
  });

  it("Requirement #3: runIngestionPipeline increments missedRuns and archives events when missedRuns >= 3", async () => {
    mockPrisma.organizer.upsert.mockResolvedValue({
      id: "org_radar_scanner",
      name: "Eventr Autonomous Radar",
    });
    mockPrisma.ingestionRun.create.mockResolvedValue({ id: "run_1" });
    mockPrisma.ingestionRun.update.mockResolvedValue({ id: "run_1" });
    mockPrisma.event.upsert.mockResolvedValue({ id: "ev_existing" });
    mockPrisma.event.updateMany.mockResolvedValue({ count: 2 });

    const { runIngestionPipeline } = await import("@/lib/ingest/run");
    const summary = await runIngestionPipeline({
      includeLiveConnectors: false,
      now: new Date("2026-11-01T12:00:00.000Z"),
    });

    expect(summary.fetchedCount).toBe(40);
    expect(summary.upsertedCount).toBe(40);
    expect(mockPrisma.event.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { missedRuns: { gte: 3 } },
          ]),
        }),
        data: { status: "ARCHIVED" },
      })
    );
  });

  it("GET /api/cron/ingest rejects missing/wrong CRON_SECRET with 401 and succeeds with valid secret", async () => {
    process.env.CRON_SECRET = "test-cron-secret-123456";
    mockPrisma.organizer.upsert.mockResolvedValue({ id: "org_radar_scanner" });
    mockPrisma.ingestionRun.create.mockResolvedValue({ id: "run_cron" });
    mockPrisma.ingestionRun.update.mockResolvedValue({ id: "run_cron" });
    mockPrisma.event.upsert.mockResolvedValue({ id: "ev_1" });
    mockPrisma.event.updateMany.mockResolvedValue({ count: 0 });

    const { GET } = await import("@/app/api/cron/ingest/route");

    const unauthRes = await GET(
      new Request("http://localhost:3000/api/cron/ingest")
    );
    expect(unauthRes.status).toBe(401);

    const wrongRes = await GET(
      new Request("http://localhost:3000/api/cron/ingest", {
        headers: { Authorization: "Bearer wrong-secret-value" },
      })
    );
    expect(wrongRes.status).toBe(401);

    const okRes = await GET(
      new Request("http://localhost:3000/api/cron/ingest", {
        headers: { Authorization: "Bearer test-cron-secret-123456" },
      })
    );
    expect(okRes.status).toBe(200);
    const body = await okRes.json();
    expect(body.ok).toBe(true);
  });

  it("PATCH /api/v1/admin/events/[id] returns 403 for non-ADMIN and 200 when ADMIN approves a PENDING event", async () => {
    const { PATCH } = await import("@/app/api/v1/admin/events/[id]/route");

    mockAuth.mockResolvedValueOnce({
      user: { id: "user_org", email: "org@uni.edu.pk", role: "ORGANIZER" },
    });

    const forbiddenRes = await PATCH(
      new Request("http://localhost:3000/api/v1/admin/events/ev_pending_1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      }),
      { params: Promise.resolve({ id: "ev_pending_1" }) }
    );
    expect(forbiddenRes.status).toBe(403);

    mockAuth.mockResolvedValueOnce({
      user: { id: "user_admin", email: "admin@eventr.pk", role: "ADMIN" },
    });
    mockPrisma.event.findUnique.mockResolvedValueOnce({
      id: "ev_pending_1",
      title: "New Campus Hackathon",
      status: "PENDING",
      verifiedAt: null,
      missedRuns: 0,
    });
    mockPrisma.event.update.mockImplementationOnce(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "ev_pending_1",
        title: "New Campus Hackathon",
        ...data,
      })
    );

    const approvedRes = await PATCH(
      new Request("http://localhost:3000/api/v1/admin/events/ev_pending_1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      }),
      { params: Promise.resolve({ id: "ev_pending_1" }) }
    );
    expect(approvedRes.status).toBe(200);
    const approvedBody = await approvedRes.json();
    expect(approvedBody.ok).toBe(true);
    expect(approvedBody.event.status).toBe("APPROVED");
    expect(approvedBody.event.verifiedAt).toBeDefined();
  });
});
