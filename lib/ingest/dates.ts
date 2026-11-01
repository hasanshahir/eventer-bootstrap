export interface ParsedEventDates {
  startTime: Date | null;
  endTime: Date | null;
  registrationDeadline: Date | null;
  dateOnly: boolean;
  needsVerification: boolean;
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function parseMonthDayYear(
  fragment: string,
  fallbackYear: number
): Date | null {
  const clean = fragment.replace(/,/g, " ").trim().replace(/\s+/g, " ");
  // Match e.g. "May 12 2026" or "May 12" or "12 May 2026"
  const mdy = clean.match(/^([A-Za-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
  if (mdy) {
    const m = MONTH_INDEX[mdy[1].toLowerCase()];
    const day = Number(mdy[2]);
    const year = mdy[3] ? Number(mdy[3]) : fallbackYear;
    if (m !== undefined && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, m, day, 0, 0, 0, 0));
    }
  }

  const dmy = clean.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const m = MONTH_INDEX[dmy[2].toLowerCase()];
    const year = dmy[3] ? Number(dmy[3]) : fallbackYear;
    if (m !== undefined && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, m, day, 0, 0, 0, 0));
    }
  }

  const direct = new Date(clean);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }
  return null;
}

/**
 * Parses Devpost and date-range strings into `{ startTime, endTime, registrationDeadline, dateOnly, needsVerification }` (fixes F-07 & F-08).
 * Examples handled:
 * - "May 12 - Jun 15, 2026" -> startTime: 2026-05-12T00:00:00Z, endTime: 2026-06-15T00:00:00Z, registrationDeadline: 2026-06-15T00:00:00Z
 * - "May 12 - 18, 2026"     -> startTime: 2026-05-12T00:00:00Z, endTime: 2026-05-18T00:00:00Z, registrationDeadline: 2026-05-18T00:00:00Z
 * - "Dec 20, 2025 - Jan 15, 2026" -> startTime: 2025-12-20T00:00:00Z, endTime: 2026-01-15T00:00:00Z
 * - "May 12, 2026"          -> startTime: 2026-05-12T00:00:00Z, endTime: null, registrationDeadline: 2026-05-12T00:00:00Z
 * Never fabricates `Date.now() + 7 days` when input is missing/invalid; instead returns `needsVerification: true`.
 */
export function parseSubmissionPeriodDates(
  raw?: string | null,
  referenceYear = 2026
): ParsedEventDates {
  if (!raw || !raw.trim()) {
    return {
      startTime: null,
      endTime: null,
      registrationDeadline: null,
      dateOnly: true,
      needsVerification: true,
    };
  }

  const trimmed = raw.trim();

  // Check if range with hyphen or en-dash
  if (trimmed.includes("-") || trimmed.includes("–")) {
    const parts = trimmed.split(/\s*[-–]\s*/);
    if (parts.length === 2) {
      const [leftRaw, rightRaw] = parts;
      const rightYearMatch = rightRaw.match(/\b(20\d{2})\b/);
      const leftYearMatch = leftRaw.match(/\b(20\d{2})\b/);
      const endYear = rightYearMatch
        ? Number(rightYearMatch[1])
        : leftYearMatch
        ? Number(leftYearMatch[1])
        : referenceYear;
      const startYear = leftYearMatch ? Number(leftYearMatch[1]) : endYear;

      const startDate = parseMonthDayYear(leftRaw, startYear);

      // Handle "May 12 - 18, 2026" where right side has no month name
      let endDate: Date | null = null;
      const dayOnlyMatch = rightRaw
        .replace(/,/g, " ")
        .trim()
        .match(/^(\d{1,2})(?:\s+(\d{4}))?$/);
      if (dayOnlyMatch && startDate) {
        const day = Number(dayOnlyMatch[1]);
        const year = dayOnlyMatch[2] ? Number(dayOnlyMatch[2]) : endYear;
        endDate = new Date(
          Date.UTC(year, startDate.getUTCMonth(), day, 0, 0, 0, 0)
        );
      } else {
        endDate = parseMonthDayYear(rightRaw, endYear);
      }

      if (startDate && endDate) {
        return {
          startTime: startDate,
          endTime: endDate,
          registrationDeadline: endDate,
          dateOnly: true,
          needsVerification: false,
        };
      }
    }
  }

  // Single date
  const yearMatch = trimmed.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : referenceYear;
  const singleDate = parseMonthDayYear(trimmed, year);
  if (singleDate) {
    return {
      startTime: singleDate,
      endTime: null,
      registrationDeadline: singleDate,
      dateOnly: true,
      needsVerification: false,
    };
  }

  return {
    startTime: null,
    endTime: null,
    registrationDeadline: null,
    dateOnly: true,
    needsVerification: true,
  };
}

