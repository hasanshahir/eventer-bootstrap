# Eventr — Pakistan’s AI-Powered Tech Event Radar 🇵🇰⚡

> **Har event, har shehar.**  
> A unified, deadline-first discovery and registration engine for developer hackathons, engineering summits, campus competitions, and technical meetups across Pakistan and global virtual circuits.

---

## 🚀 Overview

The developer and student tech ecosystem in Pakistan has long been fragmented across scattered WhatsApp chats, unindexed social media banners, university notice boards, and disparate registration forms.

**Eventr** solves this by providing a high-signal, real-time developer radar that aggregates, normalizes, and delivers verified events across Pakistan (Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Faisalabad, Multan, Quetta, Hyderabad, Sukkur) along with remote global hackathons.

---

## ⚡ Key Capabilities

- **📡 Autonomous Multi-Source Radar**: Ingests, normalizes, and verifies tech events across leading platforms (Devpost, Google Developer Groups, Luma, Unstop, and university campus circuits).
- **⏱️ Deadline-First Radar & Dynamic Sorting**: Live registration intelligence automatically places active opportunities first, while clearly archiving concluded events with muted status cards.
- **🎯 Client-Side Stack Affinity Match**: Privacy-first, zero-latency 0–100% skill matching comparing your tech stack (e.g. React, Next.js, Python, PyTorch, Rust, Go, Cloud) against event syllabi.
- **🎫 One-Tap RSVP & DevPassport**: Instant friction-free registration generating cryptographic ticket tokens and dynamic QR attendee passes.
- **📷 Organizer Gate Scanner**: In-browser QR camera check-in scanner at `/organizer/scan` for venue access control and real-time attendance logging.
- **📅 RFC 5545 Calendar Integration**: 1-click sync to Google Calendar, Apple Calendar, and Outlook with 24-hour reminder alarms.
- **🤖 Multimodal AI Poster Parser**: Gemini-powered flyer ingestion at `/organizer/new` that converts uploaded event banners and flyers into structured event records.
- **📍 Geolocation Proximity**: In-browser GPS location detection automatically snapping to your nearest regional tech circuit.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode enabled)
- **Database & ORM**: [Prisma](https://www.prisma.io/) with [PostgreSQL](https://www.postgresql.org/) (Neon Serverless with Connection Pooling)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom high-contrast developer dark theme)
- **QR Engine**: `qrcode.react` (pass generation) & `html5-qrcode` (camera scanning)
- **Authentication**: Google OAuth 2.0 with dynamic redirect host negotiation and secure cookie sessions

---

## 📁 Repository Structure

```
eventr/
├── app/
│   ├── layout.tsx                # Root layout with responsive header, wordmark & footer
│   ├── page.tsx                  # Home radar server component with live multi-source fetch
│   ├── globals.css               # Design tokens, radial glow, and typography
│   ├── login/page.tsx            # Unified login & account creation interface
│   ├── passport/page.tsx         # Attendee DevPassport & QR pass viewer
│   ├── organizer/
│   │   ├── new/page.tsx          # Submit event & AI poster parser
│   │   └── scan/page.tsx         # Organizer camera QR check-in scanner
│   └── api/
│       ├── auth/                 # Google OAuth callback, email login, and session endpoints
│       ├── discover/             # Multi-source live event discovery engine
│       ├── seed/                 # Database seeding handler
│       └── v1/
│           ├── events/           # Dynamic iCalendar (.ics) export and sync APIs
│           └── registrations/    # 1-tap RSVP, ticket creation, and scanner validation
├── components/
│   ├── Feed.tsx                  # Interactive radar feed with city & format filters
│   ├── Navbar.tsx                # Sticky navbar with auth modal and navigation
│   ├── MatchBadge.tsx            # Color-coded tech stack affinity badge
│   ├── RsvpButton.tsx            # 1-tap ticket claim button
│   └── EventCard.tsx             # Modular event card
├── lib/
│   ├── prisma.ts                 # PrismaClient singleton with pooled connection support
│   ├── discover-events.ts        # Ingestion engine (Devpost, GDG, Luma, Unstop)
│   ├── ev.ts                     # EventCard types and deadline date helpers
│   └── match.ts                  # Keyword overlap algorithm and tag derivation
└── prisma/
    └── schema.prisma             # Canonical database schema (Events, Organizers, Users, Registrations)
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: v18.17+ or v20+
- **npm** or **pnpm**
- **PostgreSQL**: Neon database connection string (or local Postgres)

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

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Provide your values:
   ```env
   DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
   GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Synchronize Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js local development server |
| `npm run build` | Compiles the production build and generates Prisma client |
| `npm run start` | Starts the production server |
| `npx tsc --noEmit` | Performs strict TypeScript type checks across all files |
| `npm run db:seed` | Seeds the database with curated nationwide tech events |

---

## 🔒 License

MIT License. Built for the Pakistani developer and student tech ecosystem.
