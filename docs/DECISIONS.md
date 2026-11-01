# Eventr — Architectural & Security Decisions (`docs/DECISIONS.md`)

This document records key architectural, security, and platform decisions made during the production-readiness transformation of Eventr (`hasanshahir/eventer-bootstrap`).

---

## ADR-01: Authentication & Session Strategy
- **Decision**: Use **Auth.js v5 (`next-auth@beta`)** with `@auth/prisma-adapter` and **database-backed sessions**, supporting **Google OAuth** and **Resend Email Magic Links**. Remove all password fields, strength meters, fake Google modals, and `lib/demoUser.ts`.
- **Rationale**:
  - Eliminates `S-01` (fake password auth), `S-02` (unsigned JSON cookies), `S-03` (fake Google account picker), `S-08` (`demoUser` auto-login), and `S-09` (missing OAuth `state`/PKCE and header-derived redirect URIs).
  - Database sessions allow instant server-side revocation on sign-out or account deletion.
  - **Zero Prisma in Middleware**: Next.js Edge middleware does not run Prisma. All session and role checks execute in Node.js server contexts (`Server Components`, `Route Handlers`, `Server Actions`) via `auth()` and `lib/authz.ts`.

## ADR-02: Role-Based Access Control & Organizer Attribution
- **Decision**: Enforce `Role` (`USER`, `ORGANIZER`, `ADMIN`) and an `OrganizerMember` join table (`userId`, `organizerId`, `role: OWNER | STAFF`).
- **Rationale**:
  - Fixes `S-07` (organizer impersonation where anyone could submit an event with `"organizer": "GDG Kolachi"`).
  - `POST /api/v1/events` derives `organizerId` strictly from the authenticated user's `OrganizerMember` record (provisioning a personal unverified organizer workspace if the user has none).
  - Check-in (`POST /api/v1/checkin`) and roster exports (`GET /api/v1/organizer/events/[id]/roster.csv`) verify that the caller is a member of the specific event's organizer or an `ADMIN`.

## ADR-03: PII Protection & Phone Number Migration
- **Decision**: Store phone numbers encrypted at rest (`User.phoneEncrypted`) using **AES-256-GCM** (`lib/crypto.ts`, key derived from `PII_ENCRYPTION_KEY`) and migrate existing phone numbers out of `User.rollNumber`. Replace `api.dicebear.com` avatar URLs with deterministic local initials badges.
- **Rationale**:
  - Fixes `S-13` (phone numbers stored in plain text inside `rollNumber` and user names leaked to `api.dicebear.com` via image requests).
  - Provides self-service **Export My Data** (`GET /api/v1/account/export`) and **Delete My Account** (`DELETE /api/v1/account`) at `/account`.

## ADR-04: Database as Single Source of Truth & Vercel Cron Compatibility
- **Decision**: All public views (`/`, `/cities`, `/cities/[slug]`, `/events/[slug]`, `GET /api/v1/events`) read exclusively from PostgreSQL via cached queries (`unstable_cache`, tag `events`, revalidate `300s`). Upstream ingestion runs via `GET /api/cron/ingest` (`Bearer ${CRON_SECRET}`).
- **Vercel Hobby Plan Cron Adjustment**:
  - Vercel Hobby accounts reject deployments if `vercel.json` contains cron expressions running more than once per day.
  - Therefore, `vercel.json` is configured with daily schedules (`0 2 * * *` for ingestion and `0 3 * * *` for link health checks) so deployments succeed on both Hobby and Pro tiers, while `.github/workflows/ingest-cron.yml` triggers `GET /api/cron/ingest` every 6 hours.

## ADR-05: Multimodal AI Flyer Parser & Gemini Model Selection
- **Decision**:
  - Require authentication + per-user rate limiting on `POST /api/v1/events/ai-parse`.
  - Accept `multipart/form-data` uploads (`<= 4 MB`, `image/png`, `image/jpeg`, `image/webp`) instead of base64-in-JSON.
  - Send the API key in the `x-goog-api-key` HTTP header (`S-14`) and read the model name strictly from `GEMINI_MODEL` (configured in `.env.example` as `gemini-3.8-flash`, with full support for `gemini-2.5-flash` or any current Flash model), with **no fallback to retired `gemini-1.5-flash`** and **no fake/mock event returned in production** (`503 Service Unavailable` returned on upstream failure or missing key).

