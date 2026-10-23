# Eventr — Product & Technical Specification (spec.md)

> **AI-Powered Tech Radar for Pakistani Developers and Students**  
> *Discover, sync, and register for nationwide hackathons, workshops, and meetups in one tap.*

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
The developer and student tech ecosystem in Pakistan is vibrant but deeply fragmented. Technical events—ranging from university hackathons (at NED, FAST, NUST, GIKI, LUMS, ITU, COMSATS) to tech community gatherings (Google Developer Groups, MLSA, AWS User Groups, IEEE, ACM)—are announced across disparate platforms:
- Cluttered WhatsApp and Discord groups
- Unindexed LinkedIn/Facebook image posts and banners
- Local university notice boards and campus societies
- Scattered Google Forms and Typeforms with zero unified attendee tracking

**Key pain points:**
- **Discovery Friction:** Developers frequently discover hackathons and workshops *after* registration deadlines have passed.
- **Form Fatigue:** Students repeatedly re-enter the same personal details, university roll numbers, GitHub profiles, and team details on unstandardized forms.
- **Calendar & Deadline Disconnect:** No centralized, automated calendar synchronization or intelligent reminder cadence.
- **Organizer Overhead:** Campus leads struggle with attendee verification, walk-in management, check-in congestion, and credential issuance.

### 1.2 Product Vision
**Eventr** is a unified, intelligent tech radar that aggregates, structures, and presents verified technical events across Pakistan. Armed with multimodal AI parsing, developer-first profiles, one-tap registration, and automated calendar sync, Eventr bridges the gap between ambitious builders and transformative opportunities.

---

## 2. Target Personas

| Persona | Description | Core Needs |
| :--- | :--- | :--- |
| **Student Builder** (e.g., Sophomore at NED/FAST) | Aspiring software engineer seeking hackathons, cash prizes, and hands-on workshops. | Early deadline alerts, teammate discovery, 1-tap registration with university credentials. |
| **Professional / Open-Sourcerer** | Working engineer or senior student looking for deep-dive meetups, tech talks, and networking. | Filtering by skill/stack (AI/ML, DevOps, Web3, Cloud), calendar sync, Google/Outlook integration. |
| **Community Organizer / Campus Lead** | GDG Lead, ACM/IEEE Chair, or university club president organizing tech events. | Easy listing, automated poster-to-event parsing, verified student check-in scanner, registration analytics. |

---

## 3. Core Features & Capabilities

```
+-----------------------------------------------------------------------+
|                              EVENTR RADAR                             |
+-----------------------------------------------------------------------+
        |                                       |
        v                                       v
 [AI Ingestion Engine]                 [User Experience]
  - Poster OCR & LLM Extraction         - City/Campus Radar Feed
  - WhatsApp & LinkedIn Ingest          - Stack & Category Filters
  - Dedup & Verification                - 1-Tap Registration
        |                                       |
        +-------------------+-------------------+
                            |
                            v
                [Unified Event Passport]
                 - Dynamic QR Check-in
                 - Google/Apple Calendar Sync
                 - Automated Teammate Matching
```

### 3.1 AI-Powered Discovery Radar & Multimodal Ingestion
- **Poster & Flyer Extraction:** Organizers or bots can upload an event banner/flyer; Gemini 1.5 multimodal parsing automatically extracts:
  - Event title, description, and category (Hackathon, Workshop, Meetup, Competition, Conference)
  - Date, start/end time, and timezone (PKT / UTC+5)
  - Venue (University, Co-working space, or Virtual link) and City (Karachi, Lahore, Islamabad, Peshawar, etc.)
  - Eligibility criteria, registration deadlines, and ticket pricing (Free vs. Paid in PKR)
- **Community Feed Aggregation:** Scrapers for public tech community feeds and event portals with automated deduplication and human-in-the-loop organizer approval.

### 3.2 One-Tap Registration & "DevPassport"
- **Unified Profile:** Developers store their verified profile once (Name, Email, Phone/WhatsApp, University, Department, Graduation Year, GitHub, LinkedIn, Primary Tech Stack).
- **One-Tap RSVP / Apply:** Instantly submits prefilled data to the host's event roster without repeating boilerplate input.
- **Team Matchmaking & Group Registration:** Create teams with shareable invite codes for hackathons; validate team size constraints automatically.

### 3.3 Two-Way Multi-Calendar Sync
- **Native Calendar Sync:** Instant integration with Google Calendar, Apple Calendar, and Microsoft Outlook via RFC 5545 iCalendar (`.ics`) feeds and OAuth direct-push.
- **Adaptive Reminders:** Configurable notification alerts sent 72 hours, 24 hours, and 2 hours before the event via Web Push and WhatsApp alerts.

### 3.4 Digital Passports & Rapid Check-in
- **Cryptographic QR Passes:** Attendees receive a dynamic, tamper-evident QR code pass stored in the app and Apple/Google Wallet.
- **Organizer Scanner PWA:** High-speed, offline-first camera scanner for organizers to check in hundreds of participants in minutes.

---

## 4. Technical Architecture

### 4.1 Recommended Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend / Web** | **Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons** | SEO optimization for public event indexing, fast SSR/SSG, and responsive mobile-first UX. |
| **Mobile Client** | **Progressive Web App (PWA) + Flutter / React Native** | Instant install on iOS & Android devices without app store delays; push notification support. |
| **Backend API** | **Next.js Route Handlers / FastAPI (Python)** | High-throughput async handling, Python ecosystem integration for AI extraction routines. |
| **AI / OCR Service** | **Google Gemini 1.5 Flash / Vision API** | Fast, cost-efficient multimodal extraction from flyer graphics and Pakistani context parsing. |
| **Database** | **PostgreSQL (Neon / Supabase)** | Relational integrity for bookings and transactions with JSONB flexibility for dynamic forms. |
| **Cache & Queue** | **Upstash Redis / Cloudflare Workers** | Rate limiting, live attendee count caches, and scheduled event reminder queues. |
| **Object Storage** | **Cloudflare R2 / AWS S3** | Ultra-low-latency hosting of flyer images, sponsor banners, and digital ticket assets. |
| **Auth** | **Clerk / Supabase Auth** | Built-in GitHub, Google, and email OTP authentication with role-based access control. |
| **Notifications** | **Firebase Cloud Messaging (FCM) + Resend + WhatsApp Cloud API** | Omnichannel alerts for event acceptance, timetable adjustments, and venue updates. |

### 4.2 System Data Flow Diagram

```
[Organizer / Community] 
       │ (Uploads Poster / Flyer)
       ▼
 [Next.js Web / API] ──► [FastAPI / Gemini 1.5] (Extracts structured JSON)
       │
       ▼
 [PostgreSQL (Neon)] ◄─── (Stores verified event details & coordinates)
       ▲
       │
 [Developer / Student] ──► [One-Tap RSVP] ──► [Generates QR Ticket & .ICS]
                                                    │
                                                    ▼
                                          [Syncs to Google Calendar]
```

---

## 5. Data Model & Database Schema

```sql
-- Users & Developers
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    github_handle VARCHAR(100),
    linkedin_url TEXT,
    university VARCHAR(150),
    degree_program VARCHAR(100),
    graduation_year INT,
    city VARCHAR(80) NOT NULL,
    tech_stack TEXT[], -- e.g. ['React', 'Python', 'Flutter']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizers & Communities
CREATE TABLE organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    contact_email VARCHAR(255) NOT NULL,
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TYPE event_type AS ENUM ('HACKATHON', 'WORKSHOP', 'MEETUP', 'CONFERENCE', 'COMPETITION');
CREATE TYPE event_mode AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    type event_type NOT NULL DEFAULT 'MEETUP',
    mode event_mode NOT NULL DEFAULT 'IN_PERSON',
    venue_name VARCHAR(255),
    venue_address TEXT,
    city VARCHAR(80) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    banner_url TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INT,
    price_pkr NUMERIC(10, 2) DEFAULT 0.00,
    tags TEXT[],
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    raw_ai_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrations & Passes
CREATE TYPE registration_status AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'CHECKED_IN');

CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID,
    status registration_status DEFAULT 'CONFIRMED',
    ticket_token VARCHAR(64) UNIQUE NOT NULL,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Hackathon Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(16) UNIQUE NOT NULL,
    leader_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    max_members INT DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 6. API Interface Specification

### 6.1 Public Radar & Event Endpoints
- `GET /api/v1/events`  
  *Query params:* `city`, `type`, `mode`, `tags`, `from_date`, `to_date`, `query`, `page`, `limit`  
  *Response:* Paginated list of active events with organizer badge and registration counters.

- `GET /api/v1/events/:slug`  
  *Response:* Detailed event view with agenda, speakers, sponsor details, remaining seats, and registration state.

- `POST /api/v1/events/ai-parse`  
  *Payload:* Multipart form data with flyer image or text link.  
  *Response:* Structured JSON schema with extracted parameters for organizer confirmation.

### 6.2 Registration & Developer Passport
- `POST /api/v1/events/:id/register`  
  *Headers:* `Authorization: Bearer <token>`  
  *Payload:* `{ team_invite_code?: string, custom_answers?: Record<string, any> }`  
  *Response:* `{ registration_id, ticket_token, qr_code_url, calendar_sync_urls }`

- `GET /api/v1/calendar/event/:id.ics`  
  *Response:* Dynamic iCalendar file formatted for Google Calendar, Apple Calendar, and Outlook.

### 6.3 Organizer Operations
- `POST /api/v1/organizer/check-in`  
  *Payload:* `{ event_id: string, ticket_token: string }`  
  *Response:* `{ success: true, attendee: { name, university, email }, timestamp }`

- `GET /api/v1/organizer/events/:id/roster.csv`  
  *Response:* Real-time export of confirmed attendees for administrative reporting.

---

## 7. UI/UX & Information Architecture

### 7.1 Key Views
1. **The Radar (Home):**
   - Interactive City Switcher (Karachi | Lahore | Islamabad | Hybrid / Remote)
   - Dynamic Filter Ribbon (Hackathons, Workshops, Conferences, Free Food, Cash Prizes)
   - "Happening This Weekend" and "Ending Soon" priority cards
2. **Event Details Sheet:**
   - Hero banner with venue map preview
   - Live seat countdown indicator
   - "One-Tap Register" prominent action button
   - "Add to Calendar" dropdown with 1-click Google Calendar URL & .ics download
3. **DevPassport (My Tickets):**
   - Active QR passes with animated anti-screenshot watermark
   - Past participation history & verifiable skill badges
4. **Organizer Studio:**
   - Multi-image flyer dropzone with live AI parsing preview
   - Live check-in dashboard with real-time tally counter

---

## 8. Security, Privacy & Local Compliance

- **Personal Data Protection:** Student phone numbers and roll numbers are strictly encrypted at rest and only exposed to verified event organizers upon confirmed RSVP.
- **Bot Mitigation & Anti-Spam:** Cloudflare Turnstile integration on registration and ingestion endpoints to avoid bot flood attacks.
- **Organizer Verification Tiers:**
  - *Tier 1 (Official Community):* Verified university societies, GDGs, and registered companies.
  - *Tier 2 (Independent):* Community-submitted events requiring moderation before public radar broadcast.
- **Offline Resilient Check-In:** Signed JWTs in QR codes allow organizers to validate passes even under intermittent campus Wi-Fi / cellular data connectivity.

---

## 9. Implementation Roadmap

### Phase 1: Foundation & Event Radar (Weeks 1–3)
- [x] Initial specification & repository setup (`spec.md`)
- [ ] Database schema provisioning (PostgreSQL / Neon)
- [ ] Next.js app scaffolding with responsive Tailwind UI
- [ ] Public event browsing, city/type filters, and search indexing
- [ ] Google & GitHub OAuth integration via Clerk / Supabase

### Phase 2: AI Ingestion & Calendar Sync (Weeks 4–5)
- [ ] Gemini 1.5 multimodal parser for event flyers and promotional banners
- [ ] Manual organizer review & publishing dashboard
- [ ] RFC 5545 `.ics` feed generator and 1-tap Google Calendar sync link

### Phase 3: Registration, Teams & QR Passport (Weeks 6–7)
- [ ] Unified developer profile setup (1-tap auto-fill)
- [ ] Team creation and invite codes for hackathons
- [ ] Signed QR code pass generator and mobile scanner PWA
- [ ] Email confirmations with embedded ticket assets (Resend)

### Phase 4: Scale, WhatsApp Notifications & Campus Network (Weeks 8+)
- [ ] WhatsApp Cloud API integration for deadline and venue change alerts
- [ ] Campus Ambassador portal for university society leads
- [ ] Analytics dashboard for sponsors and event organizers

---

## 10. Repository & Contribution Standards

- **Branching Strategy:** `main` (production), `develop` (staging), `feature/<name>` (features).
- **Commit Conventions:** Conventional Commits (`feat:`, `fix:`, `docs:`, `perf:`, `chore:`).
- **Author Identity:** Hasan Shahir (`hasanshahirconnect@gmail.com`).
- **License:** MIT License.
