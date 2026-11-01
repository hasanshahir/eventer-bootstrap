# Eventr — REST API Documentation

> **Base URL**: `https://eventer-bootstrap.vercel.app` (or `http://localhost:3000` in local development)  
> **Format**: JSON (`application/json`) / iCalendar (`text/calendar`) / CSV (`text/csv`)  
> **Auth**: Session cookie (`authjs.session-token`) or `Authorization: Bearer <token>`

---

## 1. System & Health

### `GET /api/health`
Probes database connectivity and measures operational response latency.
- **Auth**: None (Public)
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-11-01T15:35:00.000Z",
    "uptimeSec": 12450,
    "checks": {
      "database": {
        "status": "connected",
        "latencyMs": 14
      }
    },
    "latencyMs": 15
  }
  ```
- **Response `503 Service Unavailable`**:
  ```json
  {
    "status": "unhealthy",
    "timestamp": "2026-11-01T15:35:00.000Z",
    "uptimeSec": 12450,
    "checks": {
      "database": {
        "status": "unreachable",
        "error": "Neon connection timeout"
      }
    },
    "latencyMs": 5002
  }
  ```

---

## 2. Public Events & Calendars

### `GET /api/v1/events`
Retrieves a filtered list of approved and archived events.
- **Auth**: None (Public)
- **Query Parameters**:
  - `city` (string, optional): Filter by city desk (e.g. `Karachi`, `Islamabad`, `Online`).
  - `type` (string, optional): Filter by format (`HACKATHON`, `CONFERENCE`, `WORKSHOP`, `MEETUP`, `COMPETITION`, `TECH_TALK`).
  - `scope` (string, optional): `PAKISTAN` (on-ground only) or `GLOBAL` (virtual only).
  - `openOnly` (boolean, optional): `true` to return only events with open registration.
  - `q` (string, optional): Search keyword matched against title, organizer, city, and tags.
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "count": 9,
    "total": 9,
    "events": [
      {
        "id": "cm3abc123",
        "slug": "nust-ai-hackathon-2026",
        "title": "NUST National AI Hackathon 2026",
        "organizer": "NUST ACM Student Chapter",
        "organizerVerified": true,
        "city": "Islamabad",
        "venue": "NUST H-12 Campus",
        "type": "HACKATHON",
        "mode": "IN_PERSON",
        "startsAt": "2026-11-20T04:00:00.000Z",
        "endsAt": "2026-11-22T13:00:00.000Z",
        "registrationDeadline": "2026-11-15T18:59:59.000Z",
        "capacity": 150,
        "tags": ["AI/ML", "Python", "Next.js"],
        "status": "OPEN",
        "url": "https://nust.edu.pk/hackathon"
      }
    ]
  }
  ```

### `GET /api/v1/events/[slug]`
Retrieves full details for a single event by slug or ID.
- **Auth**: None (Public)
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "event": {
      "id": "cm3abc123",
      "slug": "nust-ai-hackathon-2026",
      "title": "NUST National AI Hackathon 2026"
    }
  }
  ```
- **Response `404 Not Found`**:
  ```json
  {
    "ok": false,
    "error": "Event not found"
  }
  ```

### `GET /api/v1/calendar/event/[id]` or `.ics`
Exports an RFC 5545 compliant iCalendar (`.ics`) file.
- **Auth**: None (Public)
- **Headers**: `Content-Type: text/calendar; charset=utf-8`
- **Response Body**:
  ```
  BEGIN:VCALENDAR
  VERSION:2.0
  PRODID:-//Eventr Pakistan//National Tech Radar//EN
  CALSCALE:GREGORIAN
  METHOD:PUBLISH
  BEGIN:VEVENT
  UID:cm3abc123@eventr.pk
  DTSTAMP:20261101T153500Z
  DTSTART:20261120T040000Z
  DTEND:20261122T130000Z
  SUMMARY:NUST National AI Hackathon 2026
  DESCRIPTION:Official Host Registration:\nhttps://nust.edu.pk/hackathon
  LOCATION:NUST H-12 Campus, Islamabad, Pakistan
  STATUS:CONFIRMED
  END:VEVENT
  END:VCALENDAR
  ```

---

## 3. Attendee Registrations & DevPassport

### `GET /api/v1/registrations`
Retrieves the authenticated user's registrations and cryptographic HS256 ticket JWTs.
- **Auth**: Authenticated User (`USER`, `ORGANIZER`, `ADMIN`)
- **Response `200 OK`**:
  ```json
  {
    "registrations": [
      {
        "id": "reg-456",
        "status": "CONFIRMED",
        "ticketToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "checkedIn": false,
        "checkedInAt": null,
        "event": {
          "id": "cm3abc123",
          "title": "NUST National AI Hackathon 2026",
          "city": "Islamabad",
          "startTime": "2026-11-20T04:00:00.000Z"
        }
      }
    ]
  }
  ```

### `POST /api/v1/registrations`
1-Tap RSVP allocating a seat or queuing on the waitlist.
- **Auth**: Authenticated User
- **Request Body**:
  ```json
  {
    "eventId": "cm3abc123",
    "turnstileToken": "optional-turnstile-token"
  }
  ```
- **Response `200 OK` (Confirmed)**:
  ```json
  {
    "ok": true,
    "registration": {
      "id": "reg-456",
      "status": "CONFIRMED",
      "ticketToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Response `200 OK` (Waitlisted)**:
  ```json
  {
    "ok": true,
    "waitlisted": true,
    "message": "Event is at capacity. You are placed on the priority waitlist.",
    "registration": {
      "id": "reg-457",
      "status": "WAITLISTED",
      "ticketToken": null
    }
  }
  ```

### `DELETE /api/v1/registrations/[id]`
Cancels registration and atomically promotes the oldest waitlisted applicant.
- **Auth**: Authenticated Owner
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "registration": {
      "id": "reg-456",
      "status": "CANCELLED"
    },
    "promotedRegistrationId": "reg-457"
  }
  ```

---

## 4. Organizer Operations

### `GET /api/v1/organizer/events`
Returns list of events managed by the caller's `OrganizerMember` profile.
- **Auth**: `ORGANIZER` or `ADMIN`
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "events": [
      {
        "id": "cm3abc123",
        "title": "NUST National AI Hackathon 2026",
        "city": "Islamabad",
        "confirmedCount": 150,
        "checkedInCount": 84,
        "waitlistedCount": 22
      }
    ]
  }
  ```

### `GET /api/v1/organizer/events/[id]/roster.csv`
Exports an RFC-4180 attendee roster with formula injection sanitization.
- **Auth**: Authorized `OrganizerMember` or `ADMIN`
- **Headers**: `Content-Type: text/csv; charset=utf-8`
- **CSV Output**:
  ```csv
  Registration ID,Attendee Name,Email,University,Department,Roll Number,Phone,Status,Checked In,Checked In At
  "reg-456","Hasan Shahir","hasan@example.com","NUST","SE","2023-SE-01","'+923001234567","CONFIRMED","true","2026-11-20T05:15:00.000Z"
  ```

### `POST /api/v1/checkin`
Validates signed HS256 ticket JWT and checks attendee into gate.
- **Auth**: Authorized `OrganizerMember` or `ADMIN`
- **Request Body**:
  ```json
  {
    "ticketToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "eventId": "cm3abc123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "checkedInAt": "2026-11-20T05:15:00.000Z",
    "attendee": {
      "name": "Hasan Shahir",
      "university": "NUST"
    },
    "event": {
      "id": "cm3abc123",
      "title": "NUST National AI Hackathon 2026"
    }
  }
  ```

### `POST /api/v1/events/ai-parse`
Extracts event dates, venues, tags, and formats from an announcement or flyer image.
- **Auth**: Authenticated User
- **Content-Type**: `multipart/form-data` (`flyer` file and optional `text`) or `application/json` (`{ "text": string }`)
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "source": "gemini",
    "model": "gemini-2.5-flash",
    "event": {
      "title": "FAST AI Summit 2026",
      "city": "Islamabad",
      "venue": "FAST-NUCES Islamabad",
      "startsAt": "2026-11-21T05:00:00.000Z",
      "type": "HACKATHON",
      "mode": "IN_PERSON",
      "tags": ["AI/ML", "Next.js", "Python"]
    }
  }
  ```

---

## 5. Automation & Cron Jobs

### `GET /api/cron/ingest`
Executes multi-source scrapers, deduplicates records, and archives stale events.
- **Auth**: `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "timestamp": "2026-11-01T02:00:00.000Z",
    "ingested": 48,
    "created": 3,
    "updated": 42,
    "archived": 3
  }
  ```

