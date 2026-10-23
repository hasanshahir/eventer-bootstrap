# AGENTS.md — Eventr Architecture & Coding Guidelines

Welcome to **Eventr**, Pakistan's AI-powered tech event radar. This document serves as the primary technical blueprint, architectural reference, and operational rulebook for AI coding agents and human contributors working on this repository.

---

## 1. Project Overview

Eventr aggregates, normalizes, and delivers real-time intelligence on developer hackathons, technical conferences, workshops, and student competitions across Pakistan (Karachi, Lahore, Islamabad, Peshawar, Faisalabad, and remote/hybrid).

Key capabilities to be built:
- **Radar Feed**: City-filtered event discovery with developer-oriented categorization.
- **Client-Side Match Scoring**: Live affinity score (0–100%) comparing a developer's local tech stack profile with event tags/descriptions.
- **One-Tap RSVP & DevPassport**: Frictionless registrations generating unique cryptographic ticket tokens and dynamic QR passes.
- **Organizer Check-In Scanner**: Offline-resilient QR camera scanner at `/organizer/scan` updating attendance in real time.
- **RFC 5545 iCalendar Feeds**: 1-click sync to Google Calendar, Apple Calendar, and Microsoft Outlook with 24-hour reminder alarms.
- **Multimodal AI Flyer Ingestion**: Gemini-powered flyer/banner parser extracting structured event data from uploaded posters.

---

## 2. Technology Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript (Strict Mode enabled)
- **Styling**: Tailwind CSS 3 (Dark developer aesthetic)
- **Database & ORM**: Prisma 5 + PostgreSQL (Connection-pooled via PgBouncer)
- **Runtime**: React 18.3 (Server Components by default; Client Components only when browser APIs/state are required)
- **Pre-configured Dependencies** (listed in `package.json`, ready for implementation):
  - `qrcode.react@^4`: High-performance SVG/Canvas QR code rendering for attendee passes.
  - `html5-qrcode`: Browser-native video stream QR code scanner for organizer check-in.
  - `tsx`: Fast TypeScript execution for database seeding and administrative scripts.

---

## 3. Architecture Map

```
eventer/
├── app/
│   ├── globals.css               # Design tokens & atmospheric radial gradients
│   ├── layout.tsx                # Sticky blurred nav, wordmark & footer
│   ├── page.tsx                  # Home Radar (Prisma server component)
│   ├── cities/page.tsx           # City aggregator view (placeholder)
│   ├── passport/page.tsx         # Attendee tickets & QR pass view (placeholder)
│   └── organizer/
│       ├── new/page.tsx          # Submit event & AI poster upload (placeholder)
│       └── scan/page.tsx         # Camera check-in scanner (placeholder)
├── lib/
│   └── prisma.ts                 # PrismaClient singleton with pgbouncer support
├── prisma/
│   ├── schema.prisma             # Canonical data model & database schema
│   └── seed.ts                   # Seed script (1 organizer + 4 Pakistani events)
├── AGENTS.md                     # This agent manual
├── SKILLS.md                     # Implementation playbooks for common patterns
├── BACKLOG.md                    # Ordered, atomic task prompts for feature development
├── next.config.mjs               # Next.js configuration (Prisma external package)
├── tailwind.config.ts            # Tailwind configuration (dark theme, fonts, globs)
├── tsconfig.json                 # Strict TypeScript configuration with @/* path alias
└── .env.example                  # Environment variable contract
```

### Server vs. Client Boundary Rules
- **Server Components (Default)**: Fetch data directly using `prisma` in `app/**/page.tsx` or server subcomponents. No client bundle overhead.
- **Client Components (`'use client'`)**: Only use when interacting with browser APIs:
  - `localStorage` (user tech stack, saved tickets)
  - Video stream / WebRTC (`html5-qrcode` scanner)
  - Form state and interactive inputs (search query, city switchers, modal triggers)

---

## 4. Agent Conventions & Rules of Engagement

1. **Read `prisma/schema.prisma` First**: Before writing any query, mutation, or API route, review the Prisma schema. It is the single source of truth for all relationships, enums, and required fields.
2. **Extend, Do NOT Regenerate**: When adding functionality, surgically append or edit files. Never blow away working scaffolding or replace complete files with simplified stubs.
3. **Strictly Preserve Dark Design Tokens**: Never introduce light mode or unstyled defaults. All surfaces use `bg-zinc-950` / `bg-zinc-900`, borders use `border-zinc-800`, text uses `text-zinc-100` / `text-zinc-400`, and accents use `emerald-500` / `cyan-500`.
4. **No Database Migrations Folder**: Do **not** create a `prisma/migrations` folder. The deployment platform provisions migrations declaratively.
5. **No WhatsApp Scraping**: Do not implement or suggest WhatsApp scraping. WhatsApp chats are end-to-end encrypted and scraping violates WhatsApp Terms of Service. Flyer ingestion is strictly pull-based via user/organizer file upload.
6. **Small, Focused Iterations**: Implement one atomic task from `BACKLOG.md` at a time.
7. **End-of-Task Verification**: Run `npx tsc --noEmit` once at the conclusion of every step. Zero TypeScript errors are permitted.

---

## 5. Data Model & Registration Lifecycle

```
[User] ─── (1:N) ───► [Registration] ◄─── (N:1) ─── [Event] ◄─── (N:1) ─── [Organizer]
                             │
                             ▼
                           [Team]
```

### Registration Status State Machine

```
      [ User RSVPs ]
             │
             ▼
        +---------+
        | PENDING |
        +---------+
             │
             ├───► [Seat available / Auto-approved] ────► [ CONFIRMED ] ───► [ CHECKED_IN ] (at venue)
             │                                                │
             ├───► [Capacity exceeded] ──► [ WAITLISTED ]     │
             │                                                ▼
             └───► [Cancelled by user or host] ───────► [ CANCELLED ]
```

- **`PENDING`**: Initial status recorded upon registration submission pending verification or capacity check.
- **`CONFIRMED`**: Active registration. Generates an active QR ticket token and calendar invite link.
- **`WAITLISTED`**: User is queued; promoted to `CONFIRMED` if a slot becomes available.
- **`CANCELLED`**: Ticket invalidated; check-in attempts will be rejected.
- **`CHECKED_IN`**: Marked at venue gate by scanning the QR pass via `/organizer/scan`. Sets `checkedInAt = new Date()`.

---

## 6. Planned AI Flyer Parser Design

- **API Engine**: Google Gemini 1.5 Flash (`gemini-1.5-flash`).
- **Transport**: Native `fetch` against the Google Generative Language REST endpoint (`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`). No bulky Google SDK dependencies.
- **Environment Variables**:
  - `GEMINI_API_KEY`: Google AI Studio API key.
  - `GEMINI_MODEL`: Model name (defaults to `gemini-1.5-flash`).
- **Deterministic Mock Fallback**: If `GEMINI_API_KEY` is not configured or rate limits are reached, the parser must cleanly return a realistic, structured mock event payload (e.g., FAST AI Summit, Islamabad) so local development and platform demos remain 100% operational.
- **Data Ingestion Boundary**: Direct file upload (PNG/JPG/WEBP) in `/organizer/new`. No third-party chat scraping.

---

## 7. Planned Client-Side Match Score Design

- **Privacy-First & Zero Latency**: Developers configure their tech stack (e.g. `['React', 'TypeScript', 'Python', 'PyTorch']`) which is saved in browser `localStorage`.
- **Scoring Algorithm**:
  1. Tokenize developer skills and event text (title, type, description, city).
  2. Compute skill overlap weighted by exact keyword matches.
  3. Normalize to an integer score between `0` and `100`.
- **Presentation**: Render a `MatchBadge`:
  - `80%–100%`: Emerald glow (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`)
  - `50%–79%`: Cyan glow (`bg-cyan-500/10 text-cyan-400 border-cyan-500/20`)
  - `<50%`: Subtle zinc badge (`bg-zinc-800 text-zinc-400`)
- **Benefit**: Real-time filtering and sorting without database hits or auth requirements.
