import { revalidateTag } from "next/cache";
import { prisma } from "../prisma";
import { loadCuratedEvents, type IngestedEventCandidate } from "./curated";
import { fetchDevpostEvents } from "./devpost";
import { fetchGdgEvents } from "./gdg";
import { fetchLumaEvents } from "./luma";
import { deduplicateIngestedEvents } from "./dedupe";

export interface SourceRunSummary {
  source: "CAMPUS" | "DEVPOST" | "GDG" | "LUMA";
  fetched: number;
  upserted: number;
  archived: number;
  ok: boolean;
  error?: string;
}

export interface IngestionPipelineResult {
  ok: boolean;
  runs: SourceRunSummary[];
  totalFetched: number;
  totalUpserted: number;
  totalArchived: number;
  fetchedCount: number;
  upsertedCount: number;
  archivedCount: number;
}

/**
 * Executes the scheduled ingestion pipeline across Curated/Campus, Devpost, GDG, and Luma.
 * - Upserts events into PostgreSQL by `(source, externalId)`.
 * - Never fabricates `Date.now() + 7 days` (`F-07`): events with missing dates are flagged
 *   `needsVerification = true` and `status = PENDING`.
 * - Tracks `lastSeenAt` and `missedRuns`: events not seen in `archiveMissedThreshold` (default 3)
 *   consecutive runs or whose `endTime` passed more than 7 days ago are automatically
 *   transitioned to `status = ARCHIVED` (Requirement #3).
 */
export async function runIngestionPipeline(options?: {
  archiveMissedThreshold?: number;
  includeLiveConnectors?: boolean;
  now?: Date;
}): Promise<IngestionPipelineResult> {
  const archiveMissedThreshold = options?.archiveMissedThreshold ?? 3;
  const includeLiveConnectors = options?.includeLiveConnectors ?? true;
  const now = options?.now ?? new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400 * 1000);

  const organizer = await prisma.organizer.upsert({
    where: { id: "org_radar_scanner" },
    update: { name: "Eventr Autonomous Radar", verified: true },
    create: {
      id: "org_radar_scanner",
      slug: "eventr-autonomous-radar",
      name: "Eventr Autonomous Radar",
      verified: true,
    },
  });

  const allSourceFetchers: Array<{
    source: "CAMPUS" | "DEVPOST" | "GDG" | "LUMA";
    isLiveExternal: boolean;
    fetcher: () => Promise<IngestedEventCandidate[]> | IngestedEventCandidate[];
  }> = [
    {
      source: "CAMPUS",
      isLiveExternal: false,
      fetcher: () => loadCuratedEvents(),
    },
    ...(includeLiveConnectors
      ? [
          {
            source: "DEVPOST" as const,
            isLiveExternal: true,
            fetcher: () => fetchDevpostEvents(),
          },
          {
            source: "GDG" as const,
            isLiveExternal: true,
            fetcher: () => fetchGdgEvents(),
          },
          {
            source: "LUMA" as const,
            isLiveExternal: true,
            fetcher: () => fetchLumaEvents(),
          },
        ]
      : []),
  ];

  const runs: SourceRunSummary[] = [];
  let totalFetched = 0;
  let totalUpserted = 0;
  let totalArchived = 0;

  const allFetchedBySource = new Map<
    "CAMPUS" | "DEVPOST" | "GDG" | "LUMA",
    IngestedEventCandidate[]
  >();

  for (const sf of allSourceFetchers) {
    try {
      const items = await sf.fetcher();
      allFetchedBySource.set(sf.source, items);
    } catch (err) {
      allFetchedBySource.set(sf.source, []);
      runs.push({
        source: sf.source,
        fetched: 0,
        upserted: 0,
        archived: 0,
        ok: false,
        error: err instanceof Error ? err.message : "Source fetch failed",
      });
    }
  }

  const combinedCandidates = [
    ...(allFetchedBySource.get("CAMPUS") ?? []),
    ...(allFetchedBySource.get("GDG") ?? []),
    ...(allFetchedBySource.get("LUMA") ?? []),
    ...(allFetchedBySource.get("DEVPOST") ?? []),
  ];
  const deduplicatedAll = deduplicateIngestedEvents(combinedCandidates);
  const allowedExternalIds = new Set(deduplicatedAll.map((c) => c.externalId));

  for (const sf of allSourceFetchers) {
    if (runs.some((r) => r.source === sf.source)) continue;

    const rawCandidates = allFetchedBySource.get(sf.source) ?? [];
    const candidates = rawCandidates.filter((c) =>
      allowedExternalIds.has(c.externalId)
    );

    const runRecord = await prisma.ingestionRun.create({
      data: {
        source: sf.source,
        startedAt: new Date(),
        fetched: rawCandidates.length,
        ok: true,
      },
    });

    let upserted = 0;
    let archived = 0;
    const seenExternalIds: string[] = [];

    try {
      for (const ev of candidates) {
        seenExternalIds.push(ev.externalId);
        const hasValidStart =
          ev.startTime instanceof Date && !Number.isNaN(ev.startTime.getTime());
        const startTime = hasValidStart ? ev.startTime! : now;
        const status =
          ev.needsVerification || !hasValidStart ? "PENDING" : "APPROVED";

        await prisma.event.upsert({
          where: {
            source_externalId: {
              source: ev.source,
              externalId: ev.externalId,
            },
          },
          update: {
            title: ev.title,
            description: ev.description,
            city: ev.city,
            venue: ev.venue,
            type: ev.type,
            mode: ev.mode,
            startTime,
            endTime: ev.endTime,
            registrationDeadline: ev.registrationDeadline,
            dateOnly: ev.dateOnly,
            registrationUrl: ev.registrationUrl,
            sourceUrl: ev.sourceUrl,
            tags: ev.tags,
            needsVerification: ev.needsVerification,
            lastSeenAt: now,
            missedRuns: 0,
          },
          create: {
            id: ev.externalId,
            slug: ev.slug,
            title: ev.title,
            description: ev.description,
            city: ev.city,
            venue: ev.venue,
            type: ev.type,
            mode: ev.mode,
            startTime,
            endTime: ev.endTime,
            registrationDeadline: ev.registrationDeadline,
            dateOnly: ev.dateOnly,
            registrationUrl: ev.registrationUrl,
            sourceUrl: ev.sourceUrl,
            source: ev.source,
            externalId: ev.externalId,
            tags: ev.tags,
            status,
            needsVerification: ev.needsVerification,
            lastSeenAt: now,
            missedRuns: 0,
            organizerId: organizer.id,
          },
        });
        upserted++;
      }

      if (seenExternalIds.length > 0) {
        // 1. Increment missedRuns for previously APPROVED events from this source not seen in this run
        await prisma.event.updateMany({
          where: {
            source: sf.source,
            status: "APPROVED",
            externalId: { notIn: seenExternalIds },
          },
          data: {
            missedRuns: { increment: 1 },
          },
        });

        // 2. Archive events where missedRuns >= archiveMissedThreshold OR endTime < sevenDaysAgo
        const archivedResult = await prisma.event.updateMany({
          where: {
            source: sf.source,
            status: "APPROVED",
            OR: [
              { missedRuns: { gte: archiveMissedThreshold } },
              { endTime: { lt: sevenDaysAgo } },
            ],
          },
          data: {
            status: "ARCHIVED",
          },
        });
        archived = archivedResult.count;
      }

      await prisma.ingestionRun.update({
        where: { id: runRecord.id },
        data: {
          finishedAt: new Date(),
          upserted,
          archived,
          ok: true,
        },
      });

      totalFetched += rawCandidates.length;
      totalUpserted += upserted;
      totalArchived += archived;
      runs.push({
        source: sf.source,
        fetched: rawCandidates.length,
        upserted,
        archived,
        ok: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ingest error";
      await prisma.ingestionRun.update({
        where: { id: runRecord.id },
        data: {
          finishedAt: new Date(),
          upserted,
          archived,
          ok: false,
          error: msg,
        },
      });
      runs.push({
        source: sf.source,
        fetched: rawCandidates.length,
        upserted,
        archived,
        ok: false,
        error: msg,
      });
    }
  }

  try {
    revalidateTag("events", "max");
  } catch {}

  return {
    ok: runs.every((r) => r.ok),
    runs,
    totalFetched,
    totalUpserted,
    totalArchived,
    fetchedCount: totalFetched,
    upsertedCount: totalUpserted,
    archivedCount: totalArchived,
  };
}
