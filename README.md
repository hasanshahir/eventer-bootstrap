# Eventr — Pakistan’s Production-Ready Developer & Tech Event Hub 🇵🇰⚡

> **Har event, har shehar.**  
> A unified, deadline-first discovery and registration engine for developer hackathons, engineering summits, campus competitions, and technical meetups across 20 regional Pakistan desks and global virtual circuits.

[![Eventr CI & Quality Gate](https://github.com/hasanshahir/eventer-bootstrap/actions/workflows/ci.yml/badge.svg)](https://github.com/hasanshahir/eventer-bootstrap/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/next.js-16.4.3-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 🚀 Overview

The developer and student tech ecosystem in Pakistan has historically been fragmented across scattered WhatsApp chats, unindexed social media banners, university notice boards, and disparate registration forms.

**Eventr** transforms this ecosystem by providing a production-grade, real-time developer radar that ingests, deduplicates, and delivers verified events across 20 regional Pakistani desks (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Hyderabad, Sukkur, Gujranwala, Sialkot, Bahawalpur, Sargodha, Abbottabad, Mardan, Swat, Gilgit, Muzaffarabad, and Online) along with remote global virtual hackathons.

---

## ⚡ Core Capabilities & Architecture

- **📡 Scheduled Ingestion & Cross-Source Deduplication**: Nightly serverless cron jobs ingest verified events from Devpost, Google Developer Groups (GDG), Luma Pakistan circles, and collegiate campus desks, scoring and deduplicating cross-platform listings without data loss.
- **⏱️ Deadline-First Radar & Unified Selectors**: Real-time registration intelligence prioritizes upcoming registration deadlines, clearly archiving past events while maintaining consistent open/archived counts across all hero tiles and feeds.
- **🔐 Enterprise Authentication & Role-Based Access Control (RBAC)**: Powered by Auth.js v5 with Google OAuth and passwordless magic links (`Resend`). Strict RBAC isolates `USER`, `ORGANIZER` (`OrganizerMember`), and `ADMIN` privileges.
- **🎫 High-Contention 1-Tap RSVP & Waitlist Engine**: ACID-compliant Prisma `Serializable` transactions with bounded retries handle concurrent seat bookings without double-booking or HTTP 500 errors. Cancellations automatically promote the oldest waitlisted attendee.
- **🛡️ Cryptographic HS256 Attendee Passes**: Tickets are signed JWTs binding attendee identity, event ID, and registration nonce. Check-ins verify signatures offline/online without exposing raw UUIDs.
- **📷 Organizer Gate Scanner & Anti-Injection CSV Export**: Secure in-browser QR camera check-in scanner (`/organizer/scan`) validates attendee passes against selected events with live tallies, and exports RFC-4180 attendee rosters with formula injection escaping.
- **🤖 Multimodal AI Flyer Parser**: Powered by Gemini 2.5 Flash via `x-goog-api-key` header with multipart/form-data upload, extracting structured event dates, venues, tags, and formats from society banners without mock fallback.
- **📅 RFC 5545 iCalendar & Google Calendar Sync**: Downloadable `.ics` files and 1-click Google Calendar URLs with automated 2-hour default durations and `VALUE=DATE` all-day support.
- **📍 Geolocation Proximity**: In-browser GPS location detection automatically snaps to your nearest regional tech circuit within a 150km radius.
- **🌐 Comprehensive SEO & Structured Data**: Dynamic `schema.org/Event` JSON-LD metadata, OpenGraph cards, auto-generated `sitemap.xml`, and search crawler `robots.txt`.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16.4.3](https://nextjs.org/) (App Router & Turbopack) | Server Components, Route Handlers, Edge OG images |
| **Runtime** | [Node.js](https://nodejs.org/) (>= 20) | Server runtime |
| **Language** | [TypeScript 5.4](https://www.typescriptlang.org/) | Strict mode, zero-untyped interfaces |
| **Database** | [PostgreSQL (Neon Serverless)](https://neon.tech/) | Pooled relational database with SSL |
| **ORM** | [Prisma 5.22](https://www.prisma.io/) | Schema migrations, type-safe queries & transactions |
| **Auth** | [Auth.js v5 (next-auth@beta)](https://authjs.dev/) | Google OAuth 2.0 & Resend Magic Links |
| **Security & Crypto** | `jose` (HS256) & Node `crypto` (AES-256-GCM) | Signed QR tickets and encrypted PII |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | High-contrast CSS variables with RGB opacity support |
| **Fonts** | `next/font/google` | Self-hosted IBM Plex Sans, IBM Plex Mono & Newsreader |
| **Testing** | [Vitest 5.0](https://vitest.dev/) & [Playwright 1.64](https://playwright.dev/) | Unit, concurrency, E2E, and Axe accessibility testing |
| **Observability** | [@sentry/nextjs](https://sentry.io/) & `/api/health` | Error tracking and synthetic uptime health probes |

---

## 📁 Repository Structure

```
eventr/
├── app/
│   ├── layout.tsx                # Root layout with self-hosted fonts & responsive navbar
│   ├── page.tsx                  # Home radar server component with cached queries
│   ├── globals.css               # Design tokens with RGB channel triplets
│   ├── error.tsx                 # Client error boundary
│   ├── not-found.tsx             # 404 page for missing dispatches
│   ├── loading.tsx               # Skeleton loading indicator
│   ├── global-error.tsx          # Root Sentry fallback error boundary
│   ├── sitemap.ts                # Dynamic XML sitemap generator
│   ├── robots.ts                 # Search crawler robots.txt generator
│   ├── manifest.ts               # Progressive Web App webmanifest
│   ├── opengraph-image.tsx       # Dynamic edge OpenGraph image renderer
│   ├── icon.tsx                  # Dynamic favicon generator
│   ├── login/page.tsx            # Auth.js Google & Magic Link sign-in
│   ├── account/page.tsx          # Profile management, PII encryption & data export/deletion
│   ├── passport/page.tsx         # Attendee DevPassport with signed QR tickets & .ics download
│   ├── cities/
│   │   ├── page.tsx              # Index of all 20 regional Pakistan desks
│   │   └── [slug]/page.tsx       # Dedicated city desk dispatches
│   ├── events/
│   │   └── [slug]/page.tsx       # Event detail page with schema.org/Event JSON-LD
│   ├── organizer/
│   │   ├── new/page.tsx          # Structured dispatch form & Gemini flyer parser
│   │   └── scan/page.tsx         # Organizer gate scanner with event selector & CSV roster
│   ├── admin/
│   │   └── events/page.tsx       # Admin moderation desk (PENDING -> APPROVED/REJECTED)
│   └── api/
│       ├── auth/[...nextauth]/   # Auth.js route handlers
│       ├── health/               # Database connectivity & latency health probe
│       ├── cron/
│       │   ├── ingest/           # Multi-source scheduled event ingestion & deduplication
│       │   └── link-check/       # Event URL availability and archival verifier
│       └── v1/
│           ├── account/          # Account management & GDPR/CCPA export/deletion
│           ├── admin/events/     # Moderator endpoints for event review
│           ├── calendar/event/   # RFC 5545 .ics calendar download API
│           ├── checkin/          # Cryptographic HS256 JWT gate check-in
│           ├── events/           # Public event querying & submission
│           │   ├── [slug]/       # Single event lookup
│           │   └── ai-parse/     # Gemini flyer extraction API
│           ├── organizer/events/ # Managed event roster & anti-injection CSV export
│           └── registrations/    # 1-tap RSVP, waitlist management & cancellation
├── components/
│   ├── Feed.tsx                  # Filterable radar feed with URL sync & deadline sorting
│   ├── Navbar.tsx                # Responsive sticky navbar with mobile drawer
│   ├── MatchBadge.tsx            # Honest word-boundary stack affinity match badge
│   └── RsvpButton.tsx            # 1-tap ticket RSVP button
├── lib/
│   ├── auth.ts                   # Auth.js configuration & credentials
│   ├── authz.ts                  # Role-based authorization & OrganizerMember checks
│   ├── calendar.ts               # RFC 5545 .ics generator & Google Calendar URLs
│   ├── crypto.ts                 # AES-256-GCM field encryption for PII
│   ├── env.ts                    # Zod-validated environment configuration
│   ├── ev.ts                     # EventCard types & deadline helpers
│   ├── match.ts                  # Word-boundary tag matching & honest scoring
│   ├── prisma.ts                 # Singleton PrismaClient
│   ├── ratelimit.ts              # Upstash Redis & in-memory sliding window rate limiter
│   ├── tickets.ts                # HS256 JWT ticket signing & verification
│   ├── turnstile.ts              # Cloudflare Turnstile CAPTCHA verification
│   ├── constants/geo.ts          # 20 regional desk coordinates & 150km GPS resolver
│   ├── events/
│   │   ├── queries.ts            # Cached event database queries with resilient fallbacks
│   │   └── selectors.ts          # Pure statistical selectors & deadline sorting
│   └── ingest/
│       ├── curated.ts            # 40 baseline curated Pakistani 2026 events
│       ├── dates.ts              # Multi-month date range & year-rollover parser
│       ├── dedupe.ts             # Fuzzy title & cross-source deduplication engine
│       ├── devpost.ts            # Devpost hackathons scraper
│       ├── gdg.ts                # Google Developer Groups scraper
│       ├── luma.ts               # Luma community scraper
│       └── run.ts                # Ingestion pipeline runner with missed-run archival
├── prisma/
│   ├── schema.prisma             # Canonical database schema
│   ├── data/curated-events.json  # Curated Pakistan 2026 event seed
│   ├── migrations/               # Production Prisma SQL migrations
│   └── seed.ts                   # Database seeder with first ADMIN bootstrap
└── tests/
    ├── unit/                     # Unit tests for security, ingest, flows, match & ops
    ├── integration/              # Integration tests for route security & concurrency
    └── e2e/                      # Playwright E2E & Axe accessibility quality tests
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **PostgreSQL**: Neon Serverless Postgres instance or local PostgreSQL 16
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hasanshahir/eventer-bootstrap.git
   cd eventer-bootstrap
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   # Database (Neon Serverless PostgreSQL)
   DATABASE_URL="postgresql://user:password@ep-xyz-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://user:password@ep-xyz.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"

   # Auth.js v5 (Minimum 32 random characters)
   AUTH_SECRET="your-32-char-random-auth-secret-here"
   AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Cryptography & Security Secrets (Minimum 32 random characters each)
   TICKET_SIGNING_SECRET="your-32-char-ticket-signing-secret"
   PII_ENCRYPTION_KEY="your-32-char-pii-encryption-key-00"
   CRON_SECRET="your-32-char-cron-secret-key-here"

   # Initial Admin Bootstrap
   ADMIN_EMAIL="admin@eventr.pk"
   ADMIN_NAME="Eventr Administrator"

   # OAuth & Magic Link Providers (Optional in local development)
   AUTH_GOOGLE_ID=""
   AUTH_GOOGLE_SECRET=""
   RESEND_API_KEY=""
   EMAIL_FROM="Eventr <login@eventr.pk>"

   # AI Flyer Ingestion
   GEMINI_API_KEY=""
   GEMINI_MODEL="gemini-2.5-flash"

   # Optional Sentry Monitoring
   SENTRY_DSN=""
   ```

4. **Run database migrations and seed baseline events**:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Eventr includes a comprehensive test suite across unit, integration, concurrency, E2E, and accessibility gates:

```bash
# Run all unit & integration tests (Vitest)
npm test

# Run TypeScript typecheck
npm run typecheck

# Run ESLint quality check
npm run lint

# Build production bundle
npm run build

# Run Playwright E2E & Axe accessibility test suite
npm run test:e2e

# Run Lighthouse CI quality assertions
npm run lhci
```

---

## 🔒 Security & Privacy Architecture

- **Zero Plaintext Sessions**: Session cookies are tamper-proof encrypted JWE tokens managed by Auth.js v5.
- **Data Protection**: Personal contact information (phone numbers, WhatsApp IDs) is encrypted at rest using authenticated AES-256-GCM.
- **Anti-Scraping & Privacy**: Registration rosters and ticket tokens are inaccessible to unauthenticated callers; users can only retrieve their own passes.
- **Tamper-Evident Tickets**: Check-in scanner strictly validates signed HS256 JWTs bound to a cryptographic single-use nonce.
- **Zero In-Memory Drift**: High-contention seat allocations are guarded by database Serializable transactions with exponential backoff retry on conflict.
- **CSV Formula Injection Mitigation**: All user-supplied fields exported to CSV rosters are sanitized against spreadsheet formula injection (`=`, `+`, `-`, `@`).

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
