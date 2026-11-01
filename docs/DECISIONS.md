# Eventr — Architecture Decision Records (ADRs)

> **Document**: `docs/DECISIONS.md`  
> **Status**: Accepted & Implemented  
> **Project**: Eventr Pakistan

---

## ADR 01: Next.js 16.4.3 App Router Upgrade

### Context
The original codebase ran on Next.js `14.2.24`, which fell directly in the vulnerable range for **CVE-2025-29927** (Server Actions authorization bypass). Additionally, Vitest and Playwright integration required modern Node.js and ESM capabilities.

### Decision
Upgrade Next.js directly to `16.4.3` with Turbopack, alongside React 18 LTS and TypeScript 5.4. Ensure `npm audit --audit-level=high` exits with `0`.

### Consequences
- Resolves all high and critical CVE advisories.
- Enables Turbopack development compilation with sub-second HMR.
- Standardizes on Next.js App Router conventions (Route Handlers, Metadata API, Server Actions).

---

## ADR 02: Auth.js v5 with Google OAuth & Passwordless Magic Links

### Context
The prototype relied on an unverified plaintext JSON cookie (`eventr_auth`) and a mock sign-in form where any email/password pair logged the user in without verification.

### Decision
Implement **Auth.js v5** (`next-auth@beta`) with `@auth/prisma-adapter`. Provide two authentication methods:
1. **Google OAuth 2.0**: For 1-tap social login.
2. **Passwordless Magic Links (`Resend`)**: For email-first passwordless sign-in.
In testing environments, enable an in-memory transport flag (`AUTH_TEST_TRANSPORT=true`) strictly gated against `NODE_ENV=production`.

### Consequences
- Eliminates plaintext password handling and credential theft vectors.
- Employs encrypted JWE session cookies with HTTPOnly, Secure, and SameSite protection.
- Automatically handles account linking and user profile creation in PostgreSQL.

---

## ADR 03: Zero Prisma in Edge Middleware

### Context
Early designs attempted to run database queries inside Next.js `middleware.ts`. In serverless and Edge runtimes, importing heavy Prisma client instances introduces cold-start latency, memory exhaustion, and connection pooling issues.

### Decision
Keep `middleware.ts` lightweight:
- Handle path matching and security headers.
- Enforce authentication and role checks strictly in Server Components, Route Handlers, and Server Actions using `requireUser()` and `requireRole()` (`lib/authz.ts`) via Auth.js `auth()`.

### Consequences
- Zero edge cold-start degradation.
- Direct database access remains confined to standard Node.js server runtimes where pooled PrismaClient singletons operate safely.

---

## ADR 04: ACID-Compliant Serializable Concurrency with Bounded Retries for RSVP

### Context
In high-contention RSVP windows (e.g. 5 remaining seats requested by 20 simultaneous developers), naive `findUnique` followed by `update` generates race conditions that result in overbooking. Using PostgreSQL `Serializable` isolation prevents overbooking, but high contention triggers transaction aborts (`P2034` serialization conflict / `40001` write conflict).

### Decision
Wrap all seat allocations and RSVP cancellations in a Prisma `Serializable` transaction managed by a bounded exponential backoff retry helper (`withSerializableRetry`, up to 8 attempts with randomized jitter). When capacity is reached, excess applicants are atomically queued with status `WAITLISTED`. When an attendee cancels (`DELETE /api/v1/registrations/[id]`), the oldest waitlisted applicant is automatically promoted to `CONFIRMED`.

### Consequences
- Zero double-booking or capacity over-allocation.
- Zero HTTP 500 errors under heavy concurrency contention (verified by a 20-parallel-requests-for-5-seats integration test).

---

## ADR 05: Cryptographic HS256 JWT Attendee Passes

### Context
The prototype used plain sequential or pseudo-random UUIDs for ticket check-in. Anyone could brute-force check in attendees or inspect passes.

### Decision
Sign all attendee tickets using **HS256 JWTs** via `jose`:
- Payload binds `sub` (user ID), `eid` (event ID), `rid` (registration ID), and a cryptographic single-use `nonce`.
- Check-in endpoint (`POST /api/v1/checkin`) verifies the signature against `TICKET_SIGNING_SECRET`, confirms the ticket matches the active event, and invalidates the nonce upon successful check-in.

### Consequences
- Tickets are tamper-evident and offline-verifiable.
- Check-in scanner protects against ticket duplication, replay attacks, and cross-event fraud.

---

## ADR 06: AES-256-GCM Field Encryption for PII at Rest

### Context
User phone and WhatsApp contact numbers were previously stored in cleartext inside the university `User.rollNumber` column.

### Decision
- Create `phoneEncrypted` column in Prisma schema.
- Encrypt phone numbers at rest using **AES-256-GCM** with random 12-byte initialization vectors (IVs) and 16-byte authentication tags via Node.js `crypto`.
- Provide an idempotent data migration (`scripts/migrate-phone-rollnumber.ts`) that strictly moves phone-shaped numbers and nulls only migrated fields.

### Consequences
- Complies with data protection best practices.
- Database compromises do not expose attendee contact numbers in plaintext.

---

## ADR 07: Modular Scheduled Ingestion Pipeline & Stale Archival

### Context
The home page previously loaded a hard-coded static array of events, ignoring submitted community dispatches and external platforms.

### Decision
Build a modular ingestion engine (`lib/ingest/`):
- Connectors for Devpost, Google Developer Groups (GDG), Luma Pakistan circles, and Collegiate Campus desks.
- Multi-source fuzzy deduplication engine.
- Scheduled via serverless cron routes (`/api/cron/ingest` and `/api/cron/link-check`) running nightly with `CRON_SECRET` authorization.
- Stale event policy: events not observed for 3 consecutive ingestion runs (`missedRuns >= 3`) or past their end date are automatically updated to `ARCHIVED`.

### Consequences
- Single source of truth in PostgreSQL.
- Eliminates manual scraper maintenance while preserving historic archive records.

---

## ADR 08: Single Canonical Event Status Nomenclature

### Context
Inconsistent status terminology existed across documentation, schema, and API routes (`PENDING`, `APPROVED`, `PUBLISHED`, `OPEN`, `CLOSED`, `ARCHIVED`).

### Decision
Standardize on the canonical Prisma enum:
- Moderation Status: `PENDING` -> `APPROVED` | `REJECTED` | `ARCHIVED`.
- Runtime Attendee Availability: `OPEN` vs. `CLOSED` (calculated dynamically by `isRegistrationClosed` based on start time, end time, and registration deadline).

### Consequences
- Consistent types across database, API contracts, and user interfaces.

---

## ADR 09: 20 Regional Desks with 150km GPS Geolocation Cutoff

### Context
Event coverage was previously restricted to 10 hardcoded cities with no URL routing or spatial awareness.

### Decision
Define 20 regional desks (`lib/constants/geo.ts`) covering all provinces and administrative territories of Pakistan (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Hyderabad, Sukkur, Gujranwala, Sialkot, Bahawalpur, Sargodha, Abbottabad, Mardan, Swat, Gilgit, Muzaffarabad, and Online). Implement haversine distance calculation with a 150km cutoff: users outside a 150km hub radius automatically default to the All/Online dispatches.

### Consequences
- Inclusive nationwide coverage for regional campus circuits.
- Reliable GPS snapping without sending user coordinates to third-party services.

---

## ADR 10: RGB Channel Triplet CSS Custom Properties for Theming

### Context
Hex color codes in CSS variables (`--background: #f7efe3`) prevented Tailwind CSS from applying opacity modifiers (`border-foreground/30`, `bg-card/50`).

### Decision
Convert all theme tokens in `app/globals.css` to space-separated RGB channel triplets (e.g. `--foreground: 22 13 8;`). Configure `tailwind.config.ts` to wrap variables in `rgb(var(...) / <alpha-value>)`.

### Consequences
- Tailwind opacity modifiers work identically across light and dark themes.
- Eliminates color-contrast bugs and unreadable borders on high-contrast displays.

---

## ADR 11: Self-Hosted Fonts via next/font/google

### Context
Render-blocking `@import url('https://fonts.googleapis.com/...')` in `app/globals.css` introduced external render-blocking network requests and CSP dependency on `style-src https://fonts.googleapis.com`.

### Decision
Migrate font loading to `next/font/google` in `app/layout.tsx` (`IBM Plex Sans`, `IBM Plex Mono`, `Newsreader`).

### Consequences
- Zero external font requests at runtime; fonts are downloaded at build time and self-hosted with optimal font-display swapping.
- Enables stricter CSP rules with zero external stylesheet origins.

---

## ADR 12: Gemini 2.5 Flash with x-goog-api-key Header

### Context
The prototype referenced retired `gemini-1.5-flash`, sent API keys in query parameters, and returned hardcoded fake events when the key was missing or invalid.

### Decision
Configure `app/api/v1/events/ai-parse/route.ts` to:
- Default to `gemini-2.5-flash` via `env.GEMINI_MODEL`.
- Transmit API keys strictly via the `x-goog-api-key` HTTP request header.
- Support `multipart/form-data` image uploads.
- Never return fake mock data; return HTTP 503 when the API key is not configured or upstream fails, gracefully switching the UI to manual input.

### Consequences
- Protects API keys from appearing in server logs or browser histories.
- Guarantees factual, honest data ingestion without deceiving users.
