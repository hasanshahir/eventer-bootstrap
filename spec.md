# Eventr — Product & Technical Specification (spec.md)

> **Pakistan’s Production-Ready Developer & Tech Event Hub**  
> *Discover, sync, and register for nationwide hackathons, workshops, and meetups in one tap.*

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
The developer and student tech ecosystem in Pakistan is vibrant but historically fragmented. Technical events—ranging from university hackathons (at NED, FAST, NUST, GIKI, LUMS, ITU, COMSATS) to tech community gatherings (Google Developer Groups, MLSA, AWS User Groups, IEEE, ACM)—have been scattered across disparate platforms:
- Unindexed WhatsApp and Discord groups
- Low-resolution social media flyers with missing links
- Campus notice boards with outdated schedules
- Google Forms with zero unified attendee tracking or ticket generation

### 1.2 Product Vision
**Eventr** provides a unified, production-grade tech radar that aggregates, structures, and presents verified technical events across 20 regional Pakistani desks and global virtual circuits. Armed with multimodal AI parsing, developer-first profiles, 1-tap registration, cryptographic passes, and automated calendar sync, Eventr bridges the gap between ambitious builders and transformative opportunities.

---

## 2. Technical Stack Specification

| Component | Specification | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.4.3 (App Router) | Server Components, Route Handlers, Edge OG Image Generation |
| **Runtime** | Node.js >= 20 | Long-Term Support engine |
| **Language** | TypeScript 5.4 | Strict type checking with zero `any` overrides |
| **Database** | PostgreSQL (Neon Serverless) | Connection pooled PostgreSQL with SSL enforcement |
| **ORM** | Prisma 5.22 | Transactional queries, migrations, and seeding |
| **Authentication** | Auth.js v5 (`next-auth@beta`) | Google OAuth 2.0 & Resend Passwordless Magic Links |
| **Security & Crypto** | `jose` (HS256) & Node `crypto` (AES-256-GCM) | Tamper-evident JWT tickets and PII field encryption |
| **CSS & Design** | Tailwind CSS 3.4 | RGB channel CSS custom properties with full opacity modifier support |
| **Typography** | `next/font/google` | Self-hosted IBM Plex Sans, IBM Plex Mono & Newsreader |
| **Observability** | `@sentry/nextjs` & `/api/health` | Error reporting and synthetic database health monitoring |
| **Testing** | Vitest 5.0 & Playwright 1.64 | Unit, route security, concurrency, E2E, and Axe-core accessibility |

---

## 3. Implementation Status Matrix

| Area | Feature / Capability | Audit Item | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Security** | Auth.js v5 Google & Magic Link session handling | `S-01`, `S-02`, `S-03` | **COMPLETED** | Zero plaintext passwords, encrypted JWE session cookies (`lib/auth.ts`, `app/login/page.tsx`) |
| **Security** | Gated registration query & user data isolation | `S-04` | **COMPLETED** | `GET /api/v1/registrations` returns only authenticated caller's registrations (`tests/integration/routes-phase1.test.ts`) |
| **Security** | Cryptographic HS256 JWT tickets & Gate verification | `S-05`, `F-14` | **COMPLETED** | Signed tickets bound to event & nonce; verified at `/api/v1/checkin` (`lib/tickets.ts`) |
| **Security** | Role-Based Access Control (RBAC) | `S-06`, `S-07` | **COMPLETED** | `requireRole`, `requireOrganizerForEvent`; organizer derived from `OrganizerMember` (`lib/authz.ts`) |
| **Security** | Rate Limiting & Cloudflare Turnstile CAPTCHA | `S-08`, `S-09` | **COMPLETED** | Rate limits on RSVP, check-in, submission & parse; Turnstile on public writes (`lib/ratelimit.ts`, `lib/turnstile.ts`) |
| **Security** | PII Encryption at Rest & Account Deletion | `S-10`, `S-11` | **COMPLETED** | AES-256-GCM encryption on contact fields; transactional account deletion (`lib/crypto.ts`, `app/api/v1/account`) |
| **Security** | Hardened Security Headers & Content Security Policy | `S-12` | **COMPLETED** | HSTS, X-Content-Type-Options, Frame-Options DENY, strict CSP (`next.config.mjs`) |
| **Security** | Safe Secret Handling & Production Enforcement | `S-13`, `S-14` | **COMPLETED** | `lib/env.ts` enforces 32-character secrets in production; Gemini key via `x-goog-api-key` header |
| **Data Engine** | Scheduled Ingestion (Devpost, GDG, Luma, Campus) | `F-01`, `F-07` | **COMPLETED** | Modular pipeline (`lib/ingest/`); `GET /api/cron/ingest` runs nightly at 02:00 UTC |
| **Data Engine** | Multi-Month Date Parsing & Deduplication | `F-08`, `F-10` | **COMPLETED** | Multi-month range support; cross-source deduplication; 40 curated Pakistani 2026 events |
| **Data Engine** | Stale Event Archival (`missedRuns >= 3`) | Requirement #3 | **COMPLETED** | Automatically marks unseen events as `ARCHIVED` (`lib/ingest/run.ts`) |
| **Core Flows** | High-Contention 1-Tap RSVP & Waitlist Promotion | `F-02`, `F-15` | **COMPLETED** | Serializable transaction with bounded retry; cancellations promote oldest waitlisted attendee |
| **Core Flows** | Multimodal AI Flyer Parser (Gemini 2.5 Flash) | `F-03`, `F-13` | **COMPLETED** | Multipart upload; zero fake mock fallback in production (`app/api/v1/events/ai-parse/route.ts`) |
| **Core Flows** | RFC 5545 iCalendar (`.ics`) & Google Calendar | `F-04` | **COMPLETED** | Standard `.ics` download & GCal URLs with 2-hour default duration and `VALUE=DATE` (`lib/calendar.ts`) |
| **Core Flows** | Organizer Gate Scanner & Anti-Injection CSV Roster | `F-09`, `F-12` | **COMPLETED** | Live camera viewfinder, event selector, real-time tallies, and formula-escaped CSV roster |
| **Core Flows** | Admin Moderation Desk (`PENDING` -> `APPROVED`) | Requirement #6 | **COMPLETED** | `/admin/events` interface for approving or rejecting submitted campus events |
| **Frontend** | Consistent Counts & Unified Statistical Selectors | `F-05` | **COMPLETED** | `lib/events/selectors.ts` drives identical counts across hero masthead, source ledger & feeds |
| **Frontend** | Word-Boundary Tag Matching & Honest Match Scoring | `F-06` | **COMPLETED** | Strict token boundaries (`(^|[^a-z0-9])`); returns 0% when zero stack overlap (`lib/match.ts`) |
| **Frontend** | RGB Theme Custom Properties & Tailwind Opacity | `U-01` | **COMPLETED** | `var(--foreground / <alpha-value>)` works seamlessly across light and dark themes (`app/globals.css`) |
| **Frontend** | Self-Hosted Google Fonts | `U-05` | **COMPLETED** | Migrated to `next/font/google` (`IBM Plex Sans`, `IBM Plex Mono`, `Newsreader`) |
| **Frontend** | Dedicated City Pages & Regional Desks | `U-06`, `U-07` | **COMPLETED** | `/cities` and `/cities/[slug]` for all 20 regional desks; resilient error boundaries |
| **Frontend** | Responsive Navigation & Always-Visible Passport | `U-02`, `U-04` | **COMPLETED** | Mobile hamburger drawer; Passport link visible to both guests and members (`components/Navbar.tsx`) |
| **SEO & Ops** | Event Detail Pages with schema.org/Event JSON-LD | `D-03` | **COMPLETED** | `/events/[slug]` with structured schema markup, canonical URLs, and dynamic OpenGraph image |
| **SEO & Ops** | Sitemap & Robots.txt | `D-03` | **COMPLETED** | Auto-generated `/sitemap.xml` and `/robots.txt` indexing all active desks and events |
| **SEO & Ops** | Uptime Health Probes & Sentry Observability | `D-01`, `D-02` | **COMPLETED** | `GET /api/health` probes database connectivity; Sentry captures uncaught client/server faults |
| **Quality** | Complete Test Suite & CI Automation | `D-05`, `D-06` | **COMPLETED** | 42 unit/integration tests passing; Playwright E2E and Axe accessibility suite; GitHub Actions CI |

---

## 4. Canonical API Endpoints

### 4.1 Public Endpoints
- `GET /api/health`: Synthetic uptime health probe checking database connectivity and response latency.
- `GET /api/v1/events`: Filtered list of approved and archived events (`?city=`, `?type=`, `?scope=`, `?openOnly=`, `?q=`).
- `GET /api/v1/events/[slug]`: Single event record by slug or identifier.
- `GET /api/v1/calendar/event/[id]`: RFC 5545 iCalendar (`.ics`) payload for direct calendar import.

### 4.2 Authenticated Attendee Endpoints
- `GET /api/v1/account`: Retrieves the authenticated user's profile and Decrypted contact information.
- `PATCH /api/v1/account`: Updates profile fields (encrypting phone/WhatsApp credentials at rest).
- `DELETE /api/v1/account`: GDPR/CCPA compliant transactional account deletion.
- `GET /api/v1/account/export`: Full JSON data export of all personal information and registrations.
- `GET /api/v1/registrations`: Retrieves caller's active registrations with signed HS256 ticket JWTs.
- `POST /api/v1/registrations`: 1-Tap RSVP reserving a seat or entering the event waitlist.
- `DELETE /api/v1/registrations/[id]`: Cancels registration and atomically promotes oldest waitlisted attendee.

### 4.3 Organizer Endpoints
- `POST /api/v1/events`: Submits a new event dispatch (deriving organizer from `OrganizerMember`).
- `POST /api/v1/events/ai-parse`: Gemini 2.5 Flash multimodal flyer extraction via multipart upload.
- `GET /api/v1/organizer/events`: Roster of events managed by the authenticated organizer.
- `GET /api/v1/organizer/events/[id]/roster.csv`: Formula-escaped RFC-4180 attendee roster download.
- `POST /api/v1/checkin`: Validates signed HS256 ticket JWT and checks in attendee at the gate.

### 4.4 Admin Moderation & Automation
- `GET /api/v1/admin/events`: Lists pending, approved, and rejected events for moderator review.
- `PATCH /api/v1/admin/events/[id]`: Approves or rejects a submitted event.
- `GET /api/cron/ingest`: Triggered nightly to ingest, deduplicate, and archive regional events.
- `GET /api/cron/link-check`: Verifies host URL responsiveness and archives broken listings.
