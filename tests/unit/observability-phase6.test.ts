import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDbState = vi.hoisted(() => ({
  shouldFail: false,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(async () => {
      if (mockDbState.shouldFail) {
        throw new Error("Neon connection timeout");
      }
      return [{ 1: 1 }];
    }),
    user: {
      findFirst: vi.fn(async () => {
        if (mockDbState.shouldFail) {
          throw new Error("Neon connection timeout");
        }
        return { id: "u-1" };
      }),
    },
  },
}));

describe("Phase 6 — Observability & Health Probing", () => {
  beforeEach(() => {
    mockDbState.shouldFail = false;
  });

  it("1. GET /api/health returns 200 with healthy database checks and latency", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      status: string;
      checks: { database: { status: string; latencyMs: number } };
      latencyMs: number;
    };
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("connected");
    expect(body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("2. GET /api/health returns 503 when database is unreachable", async () => {
    mockDbState.shouldFail = true;

    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(503);

    const body = (await res.json()) as {
      status: string;
      checks: { database: { status: string; error?: string } };
    };
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database.status).toBe("unreachable");
  });
});
