# Changelog

All notable changes to the **Eventr** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-01 — Production Readiness Release

### Added
- **Auth.js v5**: Google OAuth 2.0 and passwordless magic link authentication (`Resend`) replacing mock login.
- **Role-Based Access Control**: `USER`, `ORGANIZER`, and `ADMIN` role enforcement with strict `OrganizerMember` ownership validation.
- **Cryptographic Passes**: HS256 signed JWT tickets with single-use nonces and in-browser camera QR check-in scanner.
- **High-Contention Concurrency**: ACID-compliant Prisma `Serializable` transactions with bounded retries on `P2034` conflict, supporting priority waitlist queuing and automatic promotion upon cancellation.
- **PII Encryption**: AES-256-GCM encryption at rest for phone and contact information in `phoneEncrypted`.
- **Scheduled Ingestion Pipeline**: Modular scraper connectors for Devpost, Google Developer Groups (GDG), Luma Pakistan circles, and campus desks with cross-source deduplication and stale event archival (`missedRuns >= 3`).
- **20 Regional Pakistan Desks**: Nationwide desk directory with haversine distance calculation and 150km GPS cutoff.
- **RFC 5545 iCalendar & Google Calendar**: Downloadable `.ics` files and GCal template URLs with 2-hour default duration and `VALUE=DATE` all-day support.
- **Multimodal AI Flyer Ingestion**: Gemini 2.5 Flash flyer banner extraction via `x-goog-api-key` header with multipart upload.
- **SEO & Structured Data**: Dynamic `schema.org/Event` JSON-LD on event pages, dynamic `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, and edge OpenGraph image generation.
- **Observability**: `@sentry/nextjs` error monitoring and `/api/health` synthetic database latency probes.
- **Testing & Quality Gates**: 42 unit/integration tests with Vitest, Playwright E2E and Axe-core accessibility test suite, and GitHub Actions CI.

### Changed
- **Upgraded Next.js to 16.4.3**: Upgraded from `14.2.24` to resolve advisory CVE-2025-29927; `npm audit --audit-level=high` exits `0`.
- **CSS Variable Theming**: Converted CSS custom properties to space-separated RGB channel triplets for full Tailwind opacity modifier compatibility.
- **Font Optimization**: Migrated from render-blocking `@import` to self-hosted `next/font/google` (`IBM Plex Sans`, `IBM Plex Mono`, `Newsreader`).
- **Unified Selectors**: Replaced inconsistent client counts with pure statistical selectors (`lib/events/selectors.ts`).
- **Word-Boundary Matching**: Replaced loose substring tag matching with strict word-boundary token matching (`(^|[^a-z0-9])`), returning 0% when there is no stack overlap.

### Fixed
- Fixed critical plain-JSON cookie vulnerability (`eventr_auth`) and demo user auto-login.
- Fixed public registration exposure where `GET /api/v1/registrations?email=...` returned arbitrary user tickets.
- Fixed unauthenticated gate check-in and arbitrary `GET /api/seed` anonymous writes.
- Fixed CSV formula injection vulnerability by prepending single quotes to user-supplied cells.
- Fixed double-booking race condition under simultaneous high-concurrency RSVP requests.
- Fixed mobile navigation drawer and always-visible Passport link.
- Fixed Gemini API key transmission in query parameters.

### Removed
- Removed legacy and vulnerable Next.js 14 dependencies.
- Removed deprecated `db/migrations/` in favor of canonical Prisma migrations.
- Removed deprecated and unused `/api/discover` endpoint in favor of scheduled cron jobs.
- Removed fake mock event fallbacks in AI parser.

